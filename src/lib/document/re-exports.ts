export { documentEngine } from './index'
export type {
  ParserResult,
  ParsedPage,
  DocumentType,
  DocumentLogEntry,
  ContextOptions,
  BuiltContext,
  DocumentAttachment,
} from './types'
export {
  detectDocumentType,
  isImageType,
  isDocumentType,
  supportsOCR,
  supportsTextExtraction,
} from './types/detector'
export { extractTextFromImage } from './ocr'
export { extractTextFromPDF } from './pdf'
export { extractTextFromDOCX } from './docx'
export { extractTextFromFile } from './text'
export {
  buildFullContext,
  buildDocumentContext,
  buildPageContext,
  extractPageNumberFromQuery,
  extractChapterFromQuery,
} from './context'
