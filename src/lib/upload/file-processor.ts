import type { FileType } from './types'
import { SUPPORTED_TYPES } from './types'

export interface FileMetadata {
  fileType: FileType
  mimeType: string
  fileName: string
  fileSize: number
  previewUrl?: string
}

export class FileProcessor {
  static identify(file: File): FileMetadata {
    const mimeType = file.type || 'application/octet-stream'
    const fileType = SUPPORTED_TYPES[mimeType] || 'other'

    return {
      fileType,
      mimeType,
      fileName: file.name,
      fileSize: file.size,
    }
  }

  static validate(file: File): { valid: boolean; error?: string } {
    const mimeType = file.type || 'application/octet-stream'
    const fileType = SUPPORTED_TYPES[mimeType]

    if (!fileType) {
      return { valid: false, error: `Unsupported file type: ${mimeType}` }
    }

    if (file.size > 20 * 1024 * 1024) {
      return { valid: false, error: 'File size exceeds 20MB limit' }
    }

    return { valid: true }
  }

  static generatePreviewUrl(file: File): string {
    return URL.createObjectURL(file)
  }

  static revokePreviewUrl(url: string) {
    URL.revokeObjectURL(url)
  }
}
