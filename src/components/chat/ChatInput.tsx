'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Paperclip, Camera, Globe, Radio, X } from 'lucide-react'
import { useChatStore } from '@/store/chat-store'
import { useChat } from '@/lib/hooks/useChat'
import { FileProcessor } from '@/lib/upload/file-processor'
import { ACCEPTED_MIME_TYPES } from '@/lib/upload/types'
import { AttachmentPreview } from './AttachmentPreview'
import { t } from '@/lib/i18n'

export function ChatInput() {
  const [input, setInput] = useState('')
  const [showAttach, setShowAttach] = useState(false)
  const [webSearch, setWebSearch] = useState(false)
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

    const fileArray = Array.from(files).slice(0, 10) // Max 10 files
    if (fileArray.length === 0) return

    let convId = currentConversationId
    if (!convId) {
      convId = await createConversation()
      if (!convId) return
    }

    const uploads = fileArray.map(async (file) => {
      const validation = FileProcessor.validate(file)
      if (!validation.valid) return

      const metadata = FileProcessor.identify(file)
      const previewUrl = FileProcessor.generatePreviewUrl(file)

      const id = `att-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      addPendingAttachment({
        id, file, previewUrl,
        fileType: metadata.fileType,
        fileName: metadata.fileName,
        fileSize: metadata.fileSize,
        progress: 0,
        status: 'pending',
      })

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

        updatePendingAttachment(id, { status: 'done', progress: 100, result: result.attachment })
      } catch (err: any) {
        updatePendingAttachment(id, { status: 'error', error: err.message || 'Upload failed' })
      }
    })

    await Promise.all(uploads)
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

    try {
      await sendMessage(trimmed || ' ', attachmentIds?.length ? attachmentIds : undefined, webSearch)
    } finally {
      setWebSearch(false)
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
              <AttachmentPreview
                key={att.id}
                id={att.id}
                fileName={att.fileName}
                fileType={att.fileType}
                previewUrl={att.previewUrl || ''}
                fileSize={att.fileSize}
                progress={att.progress}
                status={att.status}
                error={att.error}
                result={att.result}
                onRemove={removeAttachment}
              />
            ))}
          </div>
        )}

        <div className="flex items-end gap-2 bg-gray-50 dark:bg-gray-900 rounded-lg p-2 shadow-sm border border-gray-200 dark:border-gray-700">
          {/* Attachment button */}
          <button
            type="button"
            onClick={() => setShowAttach(true)}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            aria-label="Attach file"
          >
            <Paperclip className="h-5 w-5" />
          </button>

          {/* Camera button (for images) */}
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            aria-label="Take photo"
          >
            <Camera className="h-5 w-5" />
          </button>

          {/* Hidden file inputs */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={Object.keys(ACCEPTED_MIME_TYPES).join(',')}
            className="hidden"
            onChange={(e) => handleAttachFiles(e.target.files)}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => handleAttachFiles(e.target.files)}
          />

          {/* Text area */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('chatInput.placeholder')}
            className="flex-1 min-h-[40px] max-h-[120px] px-3 py-2 bg-transparent border-none resize-none focus:ring-0 focus:outline-none text-sm sm:text-base"
            rows={1}
            disabled={isStreaming || anyUploading}
          />

          {/* Web search */}
          {webSearch && (
            <Globe className="h-4 w-4 text-blue-500" />
          )}

          {/* Send button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!input.trim() && pendingAttachments.length === 0 || isStreaming || anyUploading}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="h-5 w-5" />
          </button>

          {/* Stop streaming */}
          {isStreaming && stopStreaming && (
            <button
              type="button"
              onClick={stopStreaming}
              className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}

          {/* Radio for web search (if available) */}
          <button
            type="button"
            onClick={() => setWebSearch(!webSearch)}
            className={`p-2 rounded-lg transition-colors ${webSearch ? 'text-blue-500' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'}`}
            aria-label="Toggle web search"
          >
            <Radio className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
