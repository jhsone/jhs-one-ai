'use client'

import { useCallback, useRef } from 'react'
import { useChatStore } from '@/store/chat-store'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/shared/AuthProvider'
import type { Message } from '@/types'

function streamAssistantResponse(
  store: ReturnType<typeof useChatStore.getState>,
  supabase: ReturnType<typeof createClient>,
  convId: string,
  response: Response,
  abortRef: React.MutableRefObject<AbortController | null>,
  onDone?: () => void
) {
  return new Promise<void>(async (resolve) => {
    const reader = response.body?.getReader()
    if (!reader) throw new Error('No response stream')

    const decoder = new TextDecoder()
    let fullResponse = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const payload = line.slice(6).trim()
          if (!payload) continue
          try {
            const data = JSON.parse(payload)
            if (data.type === 'text') {
              fullResponse += data.content
              store.appendStreamingContent(data.content)
            } else if (data.type === 'done') {
              const assistantMsg: Message = {
                id: Date.now() + 1,
                conversation_id: convId,
                role: 'assistant',
                content: fullResponse,
                created_at: new Date().toISOString(),
              }
              store.addMessage(assistantMsg)
              store.setIsStreaming(false)
              store.setStreamingContent('')

              await supabase.from('messages').insert({
                conversation_id: convId,
                role: 'assistant',
                content: fullResponse,
              })

              await supabase
                .from('conversations')
                .update({ updated_at: new Date().toISOString() })
                .eq('id', convId)

              if (fullResponse.length > 10) {
                const title = fullResponse.replace(/[^\w\s]/g, '').trim().slice(0, 60)
                await supabase
                  .from('conversations')
                  .update({ title: title + (fullResponse.length > 60 ? '...' : '') })
                  .eq('id', convId)
                store.updateConversation(convId, { title: title + (fullResponse.length > 60 ? '...' : '') })
              }
              onDone?.()
              resolve()
            } else if (data.type === 'error') {
              store.setError(data.content)
              store.setIsStreaming(false)
              resolve()
            }
          } catch (parseErr) { console.error('SSE parse error:', parseErr) }
        }
      }
    }
    resolve()
  })
}

export function useChat() {
  const store = useChatStore()
  const abortRef = useRef<AbortController | null>(null)
  const { session } = useAuth()

  const loadConversations = useCallback(async () => {
    if (!session?.user) return
    const supabase = createClient()
    const { data } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', session.user.id)
      .order('updated_at', { ascending: false })

    if (data) store.setConversations(data)
  }, [store, session])

  const loadMessages = useCallback(async (conversationId: string) => {
    if (!session?.user) return
    const supabase = createClient()
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (data) {
      store.setMessages(data as Message[])
      store.setCurrentConversation(conversationId)
    }
  }, [store, session])

  const createConversation = useCallback(async (): Promise<string | null> => {
    if (!session?.user) return null
    const supabase = createClient()

    const { data, error } = await supabase
      .from('conversations')
      .insert({ user_id: session.user.id, title: 'New Chat' })
      .select()
      .maybeSingle()

    if (error) return null
    if (data) {
      store.addConversation(data)
      store.setCurrentConversation(data.id)
      store.setMessages([])
      return data.id
    }
    return null
  }, [store, session])

  const sendMessage = useCallback(async (content: string, attachmentIds?: string[]) => {
    if (!session?.user) return
    const supabase = createClient()

    let convId = store.currentConversationId
    if (!convId) {
      convId = await createConversation()
      if (!convId) return
    }

    const tempUserMsg: Message = {
      id: Date.now(),
      conversation_id: convId,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    }

    store.addMessage(tempUserMsg)
    store.setIsStreaming(true)
    store.setStreamingContent('')
    store.setError(null)

    await supabase.from('messages').insert({
      conversation_id: convId,
      role: 'user',
      content,
    })

    const history = store.messages.map(m => ({
      role: m.role,
      content: m.content,
    }))

    try {
      abortRef.current = new AbortController()
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          conversation_id: convId,
          history,
          attachment_ids: attachmentIds?.length ? attachmentIds : undefined,
        }),
        signal: abortRef.current.signal,
      })

      if (!response.ok) throw new Error('Failed to get response')

      await streamAssistantResponse(store, supabase, convId!, response, abortRef)
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        store.setError(err.message || 'Something went wrong')
      }
      store.setIsStreaming(false)
    }
  }, [store, createConversation, session])

  /**
   * Edit and resend a user message: update content locally + DB, remove subsequent
   * AI messages, and re-trigger AI response from the edited message.
   */
  const editAndResend = useCallback(async (originalMsg: Message, newContent: string) => {
    if (!session?.user) return
    if (originalMsg.role !== 'user') return

    const supabase = createClient()
    const convId = originalMsg.conversation_id

    // Update the user message content in local store and DB
    store.updateMessage(originalMsg.id, { content: newContent })
    await supabase
      .from('messages')
      .update({ content: newContent })
      .eq('id', originalMsg.id)

    // Build history and remove stale messages after edited message from store
    const msgs = useChatStore.getState().messages
    const editIdx = msgs.findIndex(m => m.id === originalMsg.id)
    if (editIdx === -1) return

    store.setMessages(msgs.slice(0, editIdx + 1))

    const history = msgs.slice(0, editIdx).map(m => ({
      role: m.role,
      content: m.content,
    }))

    store.setIsStreaming(true)
    store.setStreamingContent('')
    store.setError(null)

    try {
      abortRef.current = new AbortController()
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: newContent,
          conversation_id: convId,
          history,
        }),
        signal: abortRef.current.signal,
      })

      if (!response.ok) throw new Error('Failed to get response')

      await streamAssistantResponse(store, supabase, convId, response, abortRef)
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        store.setError(err.message || 'Something went wrong')
      }
      store.setIsStreaming(false)
    }
  }, [store, session])

  /**
   * Regenerate the last AI response by resending the preceding user message.
   */
  const regenerateResponse = useCallback(async (assistantMsg: Message) => {
    if (!session?.user) return
    if (assistantMsg.role !== 'assistant') return

    const supabase = createClient()
    const convId = assistantMsg.conversation_id

    const msgs = useChatStore.getState().messages
    const idx = msgs.findIndex(m => m.id === assistantMsg.id)

    // Find the preceding user message
    let userMsg: Message | null = null
    let userMsgIdx = 0
    for (let i = idx - 1; i >= 0; i--) {
      if (msgs[i].role === 'user') {
        userMsg = msgs[i]
        userMsgIdx = i
        break
      }
    }
    if (!userMsg) return

    // Remove old assistant response(s) from store (keep DB for audit)
    store.setMessages(msgs.slice(0, userMsgIdx + 1))

    store.setIsStreaming(true)
    store.setStreamingContent('')
    store.setError(null)

    const history = msgs.slice(0, userMsgIdx).map(m => ({
      role: m.role,
      content: m.content,
    }))

    try {
      abortRef.current = new AbortController()
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg.content,
          conversation_id: convId,
          history,
        }),
        signal: abortRef.current.signal,
      })

      if (!response.ok) throw new Error('Failed to get response')

      await streamAssistantResponse(store, supabase, convId, response, abortRef)
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        store.setError(err.message || 'Something went wrong')
      }
      store.setIsStreaming(false)
    }
  }, [store, session])

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort()
    store.setIsStreaming(false)
  }, [store])

  return {
    ...store,
    loadConversations,
    loadMessages,
    createConversation,
    sendMessage,
    editAndResend,
    regenerateResponse,
    stopStreaming,
  }
}
