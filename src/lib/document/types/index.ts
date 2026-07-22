export type DocumentType = 'pdf' | 'docx' | 'txt' | 'markdown' | 'image' | 'unknown'

export interface ParsedPage {
  pageNumber: number
  text: string
  heading?: string
}

export interface ParserResult {
  success: boolean
  documentType: DocumentType
  pages: ParsedPage[]
  fullText: string
  textLength: number
  pagesProcessed: number
  ocrUsed: boolean
  parserUsed: string
  error?: string
  language?: string
}

export interface DocumentLogEntry {
  attachmentId: string
  userId: string
  documentType: DocumentType
  parserUsed: string
  ocrUsed: boolean
  pagesProcessed: number
  textLength: number
  language: string | null
  success: boolean
  errorMessage: string | null
  processingTime: number
}

export interface ContextOptions {
  includeHistory: boolean
  includeDocuments: boolean
  includeAttachments: boolean
  maxContextLength: number
}

export interface BuiltContext {
  systemPrompt: string
  augmentedMessage: string
  documentContext: string
  totalContextLength: number
}

export interface DocumentAttachment {
  id: string
  cloudinaryUrl: string
  thumbnailUrl: string | null
  mimeType: string
  fileType: string
  fileName: string
  fileSize: number
  width: number | null
  height: number | null
}
