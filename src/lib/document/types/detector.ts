import type { DocumentType } from '../types'

export function detectDocumentType(mimeType: string, fileName: string): DocumentType {
  const ext = fileName.toLowerCase().split('.').pop() ?? ''
  const mime = mimeType.toLowerCase()

  if (mime === 'application/pdf' || ext === 'pdf') return 'pdf'
  if (
    mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    ext === 'docx'
  )
    return 'docx'
  if (mime === 'text/plain' || ext === 'txt') return 'txt'
  if (mime === 'text/markdown' || ext === 'md' || ext === 'markdown') return 'markdown'
  if (mime.startsWith('image/')) return 'image'
  return 'unknown'
}

export function isImageType(type: DocumentType): boolean {
  return type === 'image'
}

export function isDocumentType(type: DocumentType): boolean {
  return type === 'pdf' || type === 'docx' || type === 'txt' || type === 'markdown'
}

export function supportsOCR(type: DocumentType): boolean {
  return type === 'image'
}

export function supportsTextExtraction(type: DocumentType): boolean {
  return type === 'pdf' || type === 'docx' || type === 'txt' || type === 'markdown'
}
