'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Paperclip, Camera, Image, FileText, Globe, X, Loader2 } from 'lucide-react'
import { useChatStore } from '@/store/chat-store'
import { useChat } from '@/lib/hooks/useChat'
import { FileProcessor } from '@/lib/upload/file-processor'
import { ACCEPTED_MIME_TYPES } from '@/lib/upload/types'
import { AttachmentPreview } from './AttachmentPreview'
import { t } from '@/lib/i18n'
import { createPortal } from 'react-dom'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}

function BottomSheet({ isOpen, onClose, children }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  if (!isOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="attachment-sheet-title"
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
      <div
        ref={sheetRef}
        className="relative w-full bg-white dark:bg-gray-950 rounded-t-2xl shadow-xl max-h-[85vh] flex flex-col animate-slide-up"
      >
        {/* Handle */}
        <div className="flex justify-center pt-3">
          <div className="w-8 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h2 id="attachment-sheet-title" className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {t('chat.add_attachment') || 'Add Attachment'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors touch-target"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}

function AttachmentOption({
  icon: Icon,
  label,
  onClick,
  disabled = false,
}: {
  icon: typeof Image
  label: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors touch-target disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
        <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
      </div>
      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</span>
    </button>
  )
}

export function ChatInput() {
  const [input, setInput] = useState('')
  const [webSearch, setWebSearch] = useState(false)
  const [showAttachmentSheet, setShowAttachmentSheet] = useState(false)
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

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      const newHeight = Math.min(textareaRef.current.scrollHeight, 144) // 6 lines * 24px
      textareaRef.current.style.height = `${newHeight}px`
    }
  }, [input])

  useEffect(() => {
    adjustTextareaHeight()
  }, [input, adjustTextareaHeight])

  const handleAttachFiles = async (files: FileList | null) => {
    if (!files) return
    setShowAttachmentSheet(false)

    const fileArray = Array.from(files).slice(0, 10)
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
  const canSend = (input.trim() || pendingAttachments.length > 0) && !isStreaming && !anyUploading

  return (
    <>
      {/* Composer - Fixed to bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-40 pb-safe px-3 sm:px-4">
        <div className="w-full max-w-3xl mx-auto">
          {/* Attachment Previews */}
          {pendingAttachments.length > 0 && (
            <div className="mb-2 animate-slide-up" role="list" aria-label="Attachments">
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

          {/* Main Composer Container */}
          <div className="relative">
            <div className="bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl shadow-black/5 p-2 flex items-end gap-2 transition-all duration-200">
              {/* Attachment Button */}
              <button
                type="button"
                onClick={() => setShowAttachmentSheet(true)}
                className="p-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all duration-200 flex-shrink-0 touch-target"
                aria-label={t('chat.attach_file') || 'Attach file'}
              >
                <Paperclip className="h-5.5 w-5.5" />
              </button>

              {/* Camera Button */}
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="p-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all duration-200 flex-shrink-0 touch-target"
                aria-label={t('chat.take_photo') || 'Take photo'}
              >
                <Camera className="h-5.5 w-5.5" />
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

              {/* Textarea - Auto growing */}
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('chat.placeholder') || 'Message JHS One AI...'}
                className="flex-1 min-h-[44px] max-h-[144px] px-4 py-3 bg-transparent border-none resize-none focus:ring-0 focus:outline-none text-sm sm:text-base leading-relaxed text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                rows={1}
                disabled={isStreaming || anyUploading}
                style={{ minHeight: '44px', maxHeight: '144px' }}
              />

              {/* Web Search Indicator */}
              {webSearch && (
                <div className="flex-shrink-0 flex items-center justify-center w-10 h-10">
                  <Globe className="h-5 w-5 text-blue-500" />
                </div>
              )}

              {/* Send Button */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSend}
                className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white flex items-center justify-center hover:from-blue-700 hover:to-blue-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 touch-target"
                aria-label={t('chat.send') || 'Send message'}
              >
                {isStreaming ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </button>

              {/* Stop Streaming Button */}
              {isStreaming && stopStreaming && (
                <button
                  type="button"
                  onClick={stopStreaming}
                  className="flex-shrink-0 w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors touch-target"
                  aria-label={t('chat.stop') || 'Stop generating'}
                >
                  <X className="h-5 w-5" />
                </button>
              )}

              {/* Web Search Toggle */}
              <button
                type="button"
                onClick={() => setWebSearch(!webSearch)}
                className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 touch-target ${
                  webSearch
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                aria-label={webSearch
                  ? t('chat.disable_web_search') || 'Disable web search'
                  : t('chat.enable_web_search') || 'Enable web search'}
                aria-pressed={webSearch}
              >
                <Globe className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Attachment Bottom Sheet */}
      <BottomSheet isOpen={showAttachmentSheet} onClose={() => setShowAttachmentSheet(false)}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <AttachmentOption
            icon={Camera}
            label={t('chat.camera') || 'Camera'}
            onClick={() => {
              setShowAttachmentSheet(false)
              cameraInputRef.current?.click()
            }}
          />
          <AttachmentOption
            icon={Image}
            label={t('chat.gallery') || 'Gallery'}
            onClick={() => {
              setShowAttachmentSheet(false)
              fileInputRef.current?.click()
            }}
          />
          <AttachmentOption
            icon={FileText}
            label={t('chat.documents') || 'Documents'}
            onClick={() => {
              setShowAttachmentSheet(false)
              fileInputRef.current?.click()
            }}
          />
        </div>
      </BottomSheet>
    </>
  )
}