'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Square, Paperclip, Camera, Image, File as FileIcon, X } from 'lucide-react'
import { useChatStore } from '@/store/chat-store'
import { useChat } from '@/lib/hooks/useChat'
import { FileProcessor } from '@/lib/upload/file-processor'
import { ACCEPTED_MIME_TYPES } from '@/lib/upload/types'
import { AttachmentPreview } from './AttachmentPreview'
import { t } from '@/lib/i18n'

export function ChatInput() {
  const [input, setInput] = useState('')
  const [showAttach, setShowAttach] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const isStreaming = useChatStore((s) => s.isStreaming)
  const pendingAttachments = useChatStore((s) => s.pendingAttachments)
  const addPendingAttachment = useChatStore((s) => s.addPendingAttachment)
  const updatePendingAttachment = useChatStore((s) => s.updatePendingAttachment)
  const removePendingAttachment = useChatStore((s) => s.removePendingAttachment)
  const clearPendingAttachments = useChatStore((s) => s.clearPendingAttachments)
  const currentConversationId = useChatStore((s) => s.currentConversationId)
  const { sendMessage, stopStreaming, createConversation } = useChat()

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px'
    }
  }, [input])

  const handleAttachFiles = async (files: FileList | null) => {
    if (!files) return
    setShowAttach(false)

    for (const file of Array.from(files)) {
      const validation = FileProcessor.validate(file)
      if (!validation.valid) continue

      const metadata = FileProcessor.identify(file)
      const previewUrl = FileProcessor.generatePreviewUrl(file)

      const id = `att-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      addPendingAttachment({
        id,
        file,
        previewUrl,
        fileType: metadata.fileType,
        fileName: metadata.fileName,
        fileSize: metadata.fileSize,
        progress: 0,
        status: 'pending',
      })

      let convId = currentConversationId
      if (!convId) {
        convId = await createConversation()
        if (!convId) {
          removePendingAttachment(id)
          return
        }
      }

      updatePendingAttachment(id, { status: 'uploading' })

      const formData = new FormData()
      formData.append('file', file)
      formData.append('conversation_id', convId)

      try {
        const xhr = new XMLHttpRequest()
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            updatePendingAttachment(id, { progress: Math.round((e.loaded / e.total) * 100) })
          }
        })

        const result = await new Promise<any>((resolve, reject) => {
          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(JSON.parse(xhr.responseText))
            } else {
              reject(new Error(xhr.responseText || 'Upload failed'))
            }
          })
          xhr.addEventListener('error', () => reject(new Error('Network error')))
          xhr.open('POST', '/api/upload')
          xhr.send(formData)
        })

        updatePendingAttachment(id, {
          status: 'done',
          progress: 100,
          result: result.attachment,
        })
      } catch (err: any) {
        updatePendingAttachment(id, {
          status: 'error',
          error: err.message || 'Upload failed',
        })
      }
    }
  }

  const handleSubmit = async () => {
    const trimmed = input.trim()

    const hasPending = pendingAttachments.some(a => a.status === 'uploading')
    if (isStreaming || hasPending) return

    if (!trimmed && pendingAttachments.length === 0) return

    let convId = currentConversationId
    if (!convId) {
      convId = await createConversation()
      if (!convId) return
    }

    const attachmentIds = pendingAttachments
      .filter(a => a.status === 'done' && a.result)
      .map(a => a.result!.id)

    setInput('')
    clearPendingAttachments()

    if (trimmed) {
      try { await sendMessage(trimmed) } catch {}
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const removeAttachment = (id: string) => {
    const att = pendingAttachments.find(a => a.id === id)
    if (att) FileProcessor.revokePreviewUrl(att.previewUrl)
    removePendingAttachment(id)
  }

  const anyUploading = pendingAttachments.some(a => a.status === 'uploading')

  return (
    <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 safe-pb">
      <div className="w-full max-w-3xl mx-auto px-3 sm:px-4 py-2 sm:py-3">
        {/* Attachment previews */}
        {pendingAttachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {pendingAttachments.map((att) => (
              <div key={att.id} className="w-full sm:w-auto min-w-0 sm:min-w-[200px] max-w-full">
                <AttachmentPreview
                  id={att.id}
                  fileName={att.fileName}
                  fileType={att.fileType}
                  previewUrl={att.previewUrl}
                  fileSize={att.fileSize}
                  progress={att.progress}
                  status={att.status}
                  error={att.error}
                  onRemove={removeAttachment}
                />
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2 bg-gray-100 dark:bg-gray-900 rounded-2xl px-3 sm:px-4 py-2 border border-gray-200 dark:border-gray-800 focus-within:border-blue-500 dark:focus-within:border-blue-400 transition-colors">
          {/* Attachment button */}
          <div className="relative">
            <button
              onClick={() => setShowAttach(!showAttach)}
              className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Attach file"
              disabled={isStreaming}
            >
              <Paperclip className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </button>

            {/* Bottom sheet (mobile) / Popover (desktop) */}
            {showAttach && (
              <>
                <div className="fixed inset-0 z-40 sm:fixed" onClick={() => setShowAttach(false)} />
                <div className="absolute bottom-full mb-2 left-0 z-50 sm:left-0 sm:bottom-full sm:mb-2">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden min-w-[180px]">
                    <button
                      onClick={() => { cameraInputRef.current?.click() }}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Camera className="h-4 w-4" />
                      <span>Camera</span>
                    </button>
                    <button
                      onClick={() => { fileInputRef.current?.click() }}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Image className="h-4 w-4" />
                      <span>Gallery</span>
                    </button>
                    <button
                      onClick={() => { fileInputRef.current?.click() }}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <FileIcon className="h-4 w-4" />
                      <span>Files</span>
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Hidden file inputs */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => handleAttachFiles(e.target.files)}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_MIME_TYPES.join(',')}
              multiple
              className="hidden"
              onChange={(e) => handleAttachFiles(e.target.files)}
            />
          </div>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('chat.placeholder')}
            rows={1}
            className="flex-1 bg-transparent resize-none outline-none text-sm sm:text-base text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 py-1.5 max-h-[120px] leading-5"
            disabled={isStreaming}
          />
          {isStreaming ? (
            <button
              onClick={stopStreaming}
              className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
            >
              <Square className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-gray-600 dark:text-gray-300" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!input.trim() && pendingAttachments.length === 0}
              className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none transition-colors"
            >
              <Send className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-white" />
            </button>
          )}
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-1.5">
          {t('chat.disclaimer')}
        </p>
      </div>
    </div>
  )
}
