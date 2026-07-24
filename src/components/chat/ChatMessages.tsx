'use client'

import { useEffect, useRef } from 'react'
import { MessageBubble } from './MessageBubble'
import { WelcomeScreen } from './WelcomeScreen'
import { ThinkingIndicator } from './ThinkingIndicator'
import { ErrorBanner } from './ErrorBanner'
import { useChatStore } from '@/store/chat-store'
import { createClient } from '@/lib/supabase/client'

const STREAMING_PLACEHOLDER_ID = -1

export function ChatMessages() {
  const bottomRef = useRef<HTMLDivElement>(null)
  const messages = useChatStore((s) => s.messages)
  const isStreaming = useChatStore((s) => s.isStreaming)
  const streamingContent = useChatStore((s) => s.streamingContent)
  const error = useChatStore((s) => s.error)
  const currentConversationId = useChatStore((s) => s.currentConversationId)
  const setConversationAttachments = useChatStore((s) => s.setConversationAttachments)

  // Load attachments when conversation or messages change
  useEffect(() => {
    if (!currentConversationId) return
    const supabase = createClient()
    supabase
      .from('attachments')
      .select('id, cloudinary_url, thumbnail_url, file_name, file_type, mime_type, message_id, width, height')
      .eq('conversation_id', currentConversationId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data) {
          setConversationAttachments(
            data.map((a) => ({
              id: a.id,
              cloudinaryUrl: a.cloudinary_url,
              thumbnailUrl: a.thumbnail_url,
              fileName: a.file_name,
              fileType: a.file_type,
              mimeType: a.mime_type,
              messageId: a.message_id,
              width: a.width,
              height: a.height,
            }))
          )
        }
      })
  }, [currentConversationId, setConversationAttachments, messages.length])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  if (messages.length === 0 && !isStreaming) {
    return <WelcomeScreen />
  }

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden">
      <div className="w-full max-w-3xl mx-auto px-0 sm:px-4">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {isStreaming && (
          <>
            <MessageBubble
              message={{
                id: STREAMING_PLACEHOLDER_ID,
                conversation_id: '',
                role: 'assistant',
                content: '',
                created_at: '',
              }}
              isStreaming
              streamingContent={streamingContent}
            />
            {!streamingContent && <ThinkingIndicator className="pb-4" />}
          </>
        )}

        {error && <div className="px-3 sm:px-0 pb-2"><ErrorBanner message={error} /></div>}
      </div>
      <div ref={bottomRef} />
    </div>
  )
}
