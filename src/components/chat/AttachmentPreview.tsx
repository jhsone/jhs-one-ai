'use client'

import { FileText, X, Loader2, AlertCircle, Music } from 'lucide-react'
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

  const icon = isImage ? null : isAudio ? <Music className="h-5 w-5 text-gray-500 dark:text-gray-400" /> : <FileText className="h-5 w-5 text-gray-500 dark:text-gray-400" />

  return (
    <div className="flex items-center gap-3 p-2 pr-3 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 group relative overflow-hidden">
      {status === 'uploading' && (
        <div
          className="absolute inset-0 bg-blue-500/10 dark:bg-blue-400/10 transition-all"
          style={{ width: `${progress}%` }}
        />
      )}

      {/* Thumbnail / Icon */}
      <div className="relative shrink-0 w-10 h-10 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
        {isImage && previewUrl ? (
          <img src={previewUrl} alt={fileName} className="w-full h-full object-cover" />
        ) : (
          icon
        )}
        {status === 'uploading' && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Loader2 className="h-4 w-4 text-white animate-spin" />
          </div>
        )}
        {status === 'error' && (
          <div className="absolute inset-0 bg-red-500/40 flex items-center justify-center">
            <AlertCircle className="h-4 w-4 text-white" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 z-10">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
          {fileName}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {status === 'uploading'
            ? `Uploading... ${progress}%`
            : status === 'error'
              ? error || 'Upload failed'
              : formatSize(fileSize)}
        </p>
        {isAudio && status === 'done' && result?.cloudinary_url && (
          <audio controls className="w-full mt-1 h-8" src={result.cloudinary_url} preload="none">
            Your browser does not support audio playback.
          </audio>
        )}
      </div>

      {/* Remove */}
      <button
        onClick={() => onRemove(id)}
        className="shrink-0 z-10 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Remove attachment"
      >
        <X className="h-3.5 w-3.5 text-gray-500" />
      </button>
    </div>
  )
}
