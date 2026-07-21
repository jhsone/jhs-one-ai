'use client'

import { cn } from '@/lib/utils/cn'
import { User, Bot } from 'lucide-react'
import { MarkdownRenderer } from './MarkdownRenderer'
import type { Message } from '@/types'

interface MessageBubbleProps {
  message: Message
  isStreaming?: boolean
  streamingContent?: string
}

export function MessageBubble({ message, isStreaming, streamingContent }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const displayContent = isStreaming ? streamingContent || '' : message.content

  return (
    <div className={cn('flex gap-3 px-4 py-3', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <Bot className="h-4 w-4 text-white" />
        </div>
      )}

      <div className={cn('max-w-[75%]', isUser ? 'order-first' : 'order-1')}>
        <div
          className={cn(
            'rounded-2xl px-4 py-2.5',
            isUser
              ? 'bg-blue-600 text-white rounded-br-sm'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-sm'
          )}
        >
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap">{displayContent}</p>
          ) : (
            <div className="text-sm">
              <MarkdownRenderer content={displayContent} />
              {isStreaming && (
                <span className="inline-block w-1.5 h-4 bg-blue-500 dark:bg-blue-400 animate-pulse ml-0.5" />
              )}
            </div>
          )}
        </div>
      </div>

      {isUser && (
        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
          <User className="h-4 w-4 text-gray-600 dark:text-gray-300" />
        </div>
      )}
    </div>
  )
}
