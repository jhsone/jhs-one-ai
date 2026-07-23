export type FileType = 'image' | 'document' | 'audio' | 'other'

export interface AttachmentRecord {
  id: string
  user_id: string
  conversation_id: string
  message_id: number | null
  file_name: string
  file_type: FileType
  mime_type: string
  file_size: number
  cloudinary_public_id: string
  cloudinary_url: string
  thumbnail_url: string | null
  width: number | null
  height: number | null
  page_count: number | null
  context_text: string | null
  created_at: string
}

export interface PendingAttachment {
  id: string
  file: File
  previewUrl: string
  fileType: FileType
  mimeType: string
  progress: number
  status: 'pending' | 'uploading' | 'done' | 'error'
  error?: string
  result?: AttachmentRecord
}

export const SUPPORTED_TYPES: Record<string, FileType> = {
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/webp': 'image',
  'image/gif': 'image',
  'application/pdf': 'document',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'document',
  'text/plain': 'document',
  'text/markdown': 'document',
  'text/x-markdown': 'document',
  'audio/webm': 'audio',
  'audio/mp3': 'audio',
  'audio/mpeg': 'audio',
  'audio/wav': 'audio',
  'audio/ogg': 'audio',
}

export const MAX_FILE_SIZE = 20 * 1024 * 1024

export const ACCEPTED_MIME_TYPES = Object.keys(SUPPORTED_TYPES)
