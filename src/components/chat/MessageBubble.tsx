'use client'

import { cn } from '@/lib/utils/cn'
import { User } from 'lucide-react'
import { MarkdownRenderer } from './MarkdownRenderer'
import { References } from './References'
import { RichResponse } from './RichResponse'
import { AiAvatar } from '@/components/shared/AiAvatar'
import { parseReferences } from '@/lib/utils/references'
import { parseRichResponse } from '@/lib/utils/rich-response'
import type { Message } from '@/types'
import { useMemo } from 'react'

interface MessageBubbleProps {
  message: Message
  isStreaming?: boolean
  streamingContent?: string
}

export function MessageBubble({ message, isStreaming, streamingContent }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const rawContent = isStreaming ? streamingContent || '' : message.content

  const { cleanContent, references, richResponse } = useMemo(() => {
    if (isUser) return { cleanContent: rawContent, references: [], richResponse: null }
    if (isStreaming) return { cleanContent: rawContent, references: [], richResponse: null }
    const rr = parseRichResponse(rawContent)
    if (rr) {
      const { cleanContent: refClean, references: refs } = parseReferences(rr.content)
      return { cleanContent: refClean, references: refs, richResponse: rr }
    }
    const { cleanContent: cc, references: refs } = parseReferences(rawContent)
    return { cleanContent: cc, references: refs, richResponse: null }
  }, [rawContent, isUser, isStreaming])

  return (
    <div className={cn('flex gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="flex-shrink-0 mt-0.5">
          <AiAvatar size={32} />
        </div>
      )}

      <div className={cn(
        'min-w-0',
        isUser ? 'order-1' : 'order-1',
        isUser ? 'max-w-[85%] sm:max-w-[75%]' : 'max-w-[88%] sm:max-w-[75%]'
      )}>
        <div
          className={cn(
            'rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5',
            isUser
              ? 'bg-blue-600 text-white rounded-br-sm'
              : richResponse
                ? 'bg-white dark:bg-gray-900 rounded-bl-sm shadow-sm border border-gray-200 dark:border-gray-800'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-sm'
          )}
        >
          {isUser ? (
            <p className="text-sm sm:text-base whitespace-pre-wrap break-words leading-relaxed">{cleanContent}</p>
          ) : (
            <div className={richResponse ? '' : 'text-sm sm:text-base leading-relaxed'}>
              {richResponse ? (
                <RichResponse data={richResponse} />
              ) : (
                <MarkdownRenderer content={cleanContent} />
              )}
              {!isStreaming && references.length > 0 && (
                <References references={references} />
              )}
              {isStreaming && (
                <span className="inline-block w-1.5 h-4 sm:h-5 bg-blue-500 dark:bg-blue-400 animate-pulse ml-0.5 align-text-bottom" />
              )}
            </div>
          )}
        </div>
      </div>

      {isUser && (
        <div className="flex-shrink-0 mt-0.5 h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
          <User className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-gray-600 dark:text-gray-300" />
        </div>
      )}
    </div>
  )
}
