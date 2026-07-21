'use client'

import { useCallback, useRef } from 'react'
import { useChatStore } from '@/store/chat-store'
import { createClient } from '@/lib/supabase/client'
import type { Message } from '@/types'

export function useChat() {
  const store = useChatStore()
  const abortRef = useRef<AbortController | null>(null)

  const loadConversations = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (data) store.setConversations(data)
  }, [store])

  const loadMessages = useCallback(async (conversationId: string) => {
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
  }, [store])

  const createConversation = useCallback(async (): Promise<string | null> => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('conversations')
      .insert({ user_id: user.id, title: 'New Chat' })
      .select()
      .single()

    if (error) return null
    if (data) {
      store.addConversation(data)
      store.setCurrentConversation(data.id)
      store.setMessages([])
      return data.id
    }
    return null
  }, [store])

  const sendMessage = useCallback(async (content: string) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

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

    const history = [...store.messages, tempUserMsg].map(m => ({
      role: m.role,
      content: m.content,
    }))

    try {
      abortRef.current = new AbortController()
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, conversation_id: convId, history }),
        signal: abortRef.current.signal,
      })

      if (!response.ok) throw new Error('Failed to get response')

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
            try {
              const data = JSON.parse(line.slice(6))
              if (data.type === 'text') {
                fullResponse += data.content
                store.appendStreamingContent(data.content)
              } else if (data.type === 'done') {
                const assistantMsg: Message = {
                  id: Date.now() + 1,
                  conversation_id: convId!,
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
                  store.updateConversation(convId!, { title: title + (fullResponse.length > 60 ? '...' : '') })
                }
              } else if (data.type === 'error') {
                store.setError(data.content)
                store.setIsStreaming(false)
              }
            } catch {}
          }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        store.setError(err.message || 'Something went wrong')
      }
      store.setIsStreaming(false)
    }
  }, [store, createConversation])

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
    stopStreaming,
  }
}
