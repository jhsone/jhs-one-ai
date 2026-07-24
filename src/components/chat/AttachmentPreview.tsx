'use client'

import { FileText, X, Loader2, AlertCircle, Image, FileText as FileTextIcon, Music } from 'lucide-react'
import type { Attachment } from '@/types'

interface AttachmentPreviewProps {
  id: string
  fileName: string
  fileType: string
  previewUrl: string
  fileSize: number
  progress: number
  status: 'pending' | 'uploading' | 'done' | 'error'
  error?: string
  result?: Attachment
  onRemove: (id: string) => void
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

export function AttachmentPreview({
  id,
  fileName,
  fileType,
  previewUrl,
  fileSize,
  progress,
  status,
  error,
  result,
  onRemove,
}: AttachmentPreviewProps) {
  const isImage = fileType === 'image'
  const isAudio = fileType === 'audio'
  const isDocument = !isImage && !isAudio

  const icon = isImage ? null : isAudio ? (
    <Music className="h-4 w-4 text-gray-500 dark:text-gray-400" />
  ) : isDocument ? (
    <FileTextIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
  ) : (
    <FileText className="h-4 w-4 text-gray-500 dark:text-gray-400" />
  )

  const statusColors = {
    uploading: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    done: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
    error: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
    pending: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700',
  }

  const getStatusLabel = () => {
    switch (status) {
      case 'uploading': return `Uploading... ${progress}%`
      case 'done': return formatSize(fileSize)
      case 'error': return error || 'Upload failed'
      default: return 'Preparing...'
    }
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-200 group relative min-w-0" role="listitem">
      {/* Thumbnail / Icon */}
      <div className="relative flex-shrink-0 w-8 h-8 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        {isImage && previewUrl ? (
          <img src={previewUrl} alt={fileName} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          icon
        )}
        {status === 'uploading' && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Loader2 className="h-3 w-3 text-white animate-spin" />
          </div>
        )}
        {status === 'error' && (
          <div className="absolute inset-0 bg-red-500/40 flex items-center justify-center">
            <AlertCircle className="h-3 w-3 text-white" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate max-w-[180px]">
          {fileName}
        </p>
        <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate max-w-[180px]">
          {getStatusLabel()}
        </p>
      </div>

      {/* Status Badge */}
      <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium border ${statusColors[status]}`}>
        {status === 'uploading' && (
          <>
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
            {progress}%
          </>
        )}
        {status === 'done' && 'Ready'}
        {status === 'error' && 'Failed'}
        {status === 'pending' && 'Pending'}
      </span>

      {/* Remove Button */}
      <button
        onClick={() => onRemove(id)}
        className="flex-shrink-0 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Remove attachment"
      >
        <X className="h-3.5 w-3.5 text-gray-500" />
      </button>
    </div>
  )
}