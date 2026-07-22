import type { ProviderName } from '@/types'

export interface VisionAttachment {
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

export interface ProviderCapabilities {
  supportsVision: boolean
  supportsDocuments: boolean
  supportsOCR: boolean
  supportsStreaming: boolean
  supportedMimeTypes: string[]
}

export interface VisionAdapterResult {
  stream: ReadableStream
  model: string
}

export interface VisionContext {
  text: string
  attachments: VisionAttachment[]
}
