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
    <div className="flex-1 overflow-y-auto overflow-x-hidden">
      {/* Messages container: full-width on mobile, centered on desktop */}
      <div className="w-full max-w-3xl mx-auto px-0 sm:px-4">
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
            {!streamingContent && <ThinkingIndicator className="pb-4" />}
          </>
        )}

        {error && <div className="px-3 sm:px-0 pb-2"><ErrorBanner message={error} /></div>}
      </div>
      <div ref={bottomRef} />
    </div>
  )
}
