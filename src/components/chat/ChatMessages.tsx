'use client'

import { useEffect, useRef } from 'react'
import { MessageBubble } from './MessageBubble'
import { WelcomeScreen } from './WelcomeScreen'
import { ThinkingIndicator } from './ThinkingIndicator'
import { ErrorBanner } from './ErrorBanner'
import { useChatStore } from '@/store/chat-store'

export function ChatMessages() {
  const bottomRef = useRef<HTMLDivElement>(null)
  const messages = useChatStore((s) => s.messages)
  const isStreaming = useChatStore((s) => s.isStreaming)
  const streamingContent = useChatStore((s) => s.streamingContent)
  const error = useChatStore((s) => s.error)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  if (messages.length === 0 && !isStreaming) {
    return <WelcomeScreen />
  }

  return (
    <div className="flex-1 overflow-y-auto py-4">
      <div className="max-w-3xl mx-auto">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {isStreaming && (
          <>
            <MessageBubble
              message={{
                id: 0,
                conversation_id: '',
                role: 'assistant',
                content: '',
                created_at: '',
              }}
              isStreaming
              streamingContent={streamingContent}
            />
            {!streamingContent && <ThinkingIndicator className="pl-12" />}
          </>
        )}

        {error && <ErrorBanner message={error} />}
      </div>
      <div ref={bottomRef} />
    </div>
  )
}
