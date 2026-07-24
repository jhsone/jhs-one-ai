'use client'

import { useState, useCallback, useMemo } from 'react'
import { cn } from '@/lib/utils/cn'
import { User, Pencil, RefreshCw, Check, X, GitBranch, Image as ImageIcon } from 'lucide-react'
import { MarkdownRenderer } from './MarkdownRenderer'
import { References } from './References'
import { RichResponse } from './RichResponse'
import { AiAvatar } from '@/components/shared/AiAvatar'
import { parseReferences } from '@/lib/utils/references'
import { parseRichResponse } from '@/lib/utils/rich-response'
import { useChat } from '@/lib/hooks/useChat'
import { useChatStore } from '@/store/chat-store'
import type { Message } from '@/types'

interface MessageBubbleProps {
  message: Message
  isStreaming?: boolean
  streamingContent?: string
}

export function MessageBubble({ message, isStreaming, streamingContent }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState('')
  const { editAndResend, regenerateResponse, forkConversation } = useChat()
  const conversationAttachments = useChatStore((s) => s.conversationAttachments)

  const imageAttachments = useMemo(() => {
    if (!isUser) return []
    
    console.log('MessageBubble debug:', {
      userMsgId: message.id,
      userMsgContent: message.content.substring(0, 50) + '...',
      conversationAttachmentsCount: conversationAttachments.length,
      conversationAttachmentIds: conversationAttachments.map(a => ({ id: a.id, messageId: a.messageId })),
    })
    
    return conversationAttachments.filter(att => att.fileType === 'image' || att.mimeType.startsWith('image/'))
  }, [isUser, message.id, conversationAttachments])

  console.log('MessageBubble render - image attachments for message:', message.id, {
    isUser,
    imageCount: imageAttachments.length,
    images: imageAttachments.map(a => ({ id: a.id, cloudinaryUrl: a.cloudinaryUrl, messageId: a.messageId, fileName: a.fileName }))
  })

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

  const handleStartEdit = useCallback(() => {
    setEditContent(message.content)
    setEditing(true)
  }, [message.content])

  const handleCancelEdit = useCallback(() => {
    setEditing(false)
    setEditContent('')
  }, [])

  const handleSaveEdit = useCallback(() => {
    const trimmed = editContent.trim()
    if (!trimmed || trimmed === message.content) {
      setEditing(false)
      return
    }
    setEditing(false)
    editAndResend(message, trimmed)
  }, [editContent, message, editAndResend])

  const handleRegenerate = useCallback(() => {
    regenerateResponse(message)
  }, [message, regenerateResponse])

  const handleFork = useCallback(() => {
    forkConversation(message.id)
  }, [message.id, forkConversation])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSaveEdit()
    }
    if (e.key === 'Escape') {
      handleCancelEdit()
    }
  }

  return (
    <div className={cn('group flex gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="flex-shrink-0 mt-0.5">
          <AiAvatar size={32} />
        </div>
      )}

      <div className={cn(
        'min-w-0',
        isUser ? 'max-w-[85%] sm:max-w-[75%]' : 'max-w-[88%] sm:max-w-[75%]'
      )}>
        <div
          className={cn(
            'rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5',
            isUser
              ? editing
                ? 'bg-white dark:bg-gray-900 border-2 border-blue-500 shadow-sm'
                : 'bg-blue-600 text-white rounded-br-sm'
              : richResponse
                ? 'bg-white dark:bg-gray-900 rounded-bl-sm shadow-sm border border-gray-200 dark:border-gray-800'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-sm'
          )}
        >
          {isUser && editing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-2 text-sm text-gray-900 dark:text-gray-100 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                autoFocus
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={handleCancelEdit}
                  className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  title="Cancel"
                >
                  <X className="h-4 w-4" />
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  title="Save & Resend"
                >
                  <Check className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : isUser ? (
            <>
              {imageAttachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {imageAttachments.map((att) => (
                    <a
                      key={att.id}
                      href={att.cloudinaryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-32 h-32 sm:w-40 sm:h-40 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600 hover:opacity-90 transition-opacity bg-gray-100 dark:bg-gray-800"
                    >
                      <img
                        src={att.thumbnailUrl || att.cloudinaryUrl}
                        alt={att.fileName}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </a>
                  ))}
                </div>
              )}
              <p className="text-sm sm:text-base whitespace-pre-wrap break-words leading-relaxed">{cleanContent}</p>
            </>
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

        {/* Edit / Re-gen buttons (only for non-streaming messages) */}
        {!isStreaming && (
          <div className={cn(
            'flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity',
            isUser ? 'justify-end' : 'justify-start'
          )}>
            {isUser && (
              <button
                onClick={handleStartEdit}
                className="p-1 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                title="Edit message"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
            {!isUser && (
              <>
                <button
                  onClick={handleRegenerate}
                  className="p-1 rounded-md text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                  title="Regenerate response"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              </>
            )}
            <button
              onClick={handleFork}
              className="p-1 rounded-md text-gray-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/40 transition-colors"
              title="Fork conversation from here"
            >
              <GitBranch className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {isUser && (
        <div className="flex-shrink-0 mt-0.5 h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
          <User className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-gray-600 dark:text-gray-300" />
        </div>
      )}
    </div>
  )
}
