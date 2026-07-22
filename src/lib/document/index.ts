import type { ParserResult, DocumentAttachment, DocumentLogEntry } from './types'
import { detectDocumentType, supportsTextExtraction, supportsOCR } from './types/detector'
import { extractTextFromImage } from './ocr'
import { extractTextFromPDF } from './pdf'
import { extractTextFromDOCX } from './docx'
import { extractTextFromFile } from './text'
import { buildFullContext, buildPageContext, extractPageNumberFromQuery } from './context'
import type { BuiltContext } from './types'

class DocumentEngine {
  async processAttachment(attachment: DocumentAttachment): Promise<ParserResult> {
    const docType = detectDocumentType(attachment.mimeType, attachment.fileName)

    switch (docType) {
      case 'pdf':
        return extractTextFromPDF(attachment.cloudinaryUrl)

      case 'docx':
        return extractTextFromDOCX(attachment.cloudinaryUrl)

      case 'txt':
        return extractTextFromFile(attachment.cloudinaryUrl, false)

      case 'markdown':
        return extractTextFromFile(attachment.cloudinaryUrl, true)

      case 'image':
        return extractTextFromImage(attachment.cloudinaryUrl)

      default:
        return {
          success: false,
          documentType: 'unknown',
          pages: [],
          fullText: '',
          textLength: 0,
          pagesProcessed: 0,
          ocrUsed: false,
          parserUsed: 'none',
          error: `Unsupported file type: ${attachment.mimeType}`,
        }
    }
  }

  async processAttachments(attachments: DocumentAttachment[]): Promise<ParserResult[]> {
    const results: ParserResult[] = []

    for (const attachment of attachments) {
      const result = await this.processAttachment(attachment)
      results.push(result)
    }

    return results
  }

  hasDocuments(attachments: DocumentAttachment[]): boolean {
    return attachments.some(a => {
      const type = detectDocumentType(a.mimeType, a.fileName)
      return supportsTextExtraction(type) || supportsOCR(type)
    })
  }

  hasImages(attachments: DocumentAttachment[]): boolean {
    return attachments.some(a => {
      const type = detectDocumentType(a.mimeType, a.fileName)
      return type === 'image'
    })
  }

  hasOnlyImages(attachments: DocumentAttachment[]): boolean {
    return attachments.length > 0 && attachments.every(a => {
      const type = detectDocumentType(a.mimeType, a.fileName)
      return type === 'image'
    })
  }

  buildContext(
    message: string,
    history: { role: 'user' | 'assistant'; content: string }[],
    documentResults: ParserResult[],
    attachments: DocumentAttachment[]
  ): BuiltContext {
    const requestedPage = extractPageNumberFromQuery(message)

    if (requestedPage !== null) {
      const pageResults = documentResults.filter(r => r.success)
      if (pageResults.length > 0) {
        const pageContext = buildPageContext(pageResults, requestedPage)
        if (pageContext) {
          return {
            systemPrompt: buildSystemPromptWithPageContext(requestedPage),
            augmentedMessage: `${message}

---
Content from Page ${requestedPage}:

${pageContext}`,
            documentContext: pageContext,
            totalContextLength: message.length + pageContext.length,
          }
        }
      }
    }

    return buildFullContext(message, history, documentResults, attachments)
  }

  buildLogEntries(
    results: ParserResult[],
    attachments: DocumentAttachment[],
    userId: string
  ): DocumentLogEntry[] {
    const entries: DocumentLogEntry[] = []

    for (let i = 0; i < results.length; i++) {
      const result = results[i]
      const attachment = attachments[i]

      entries.push({
        attachmentId: attachment?.id ?? 'unknown',
        userId,
        documentType: result.documentType,
        parserUsed: result.parserUsed,
        ocrUsed: result.ocrUsed,
        pagesProcessed: result.pagesProcessed,
        textLength: result.textLength,
        language: result.language ?? null,
        success: result.success,
        errorMessage: result.error ?? null,
        processingTime: 0,
      })
    }

    return entries
  }

  getSummary(results: ParserResult[]): {
    totalDocuments: number
    successful: number
    failed: number
    totalPages: number
    totalTextLength: number
    ocrUsed: boolean
    parsersUsed: string[]
  } {
    const successful = results.filter(r => r.success)
    const totalPages = successful.reduce((sum, r) => sum + r.pagesProcessed, 0)
    const totalTextLength = successful.reduce((sum, r) => sum + r.textLength, 0)
    const parsersUsed = [...new Set(results.map(r => r.parserUsed))].filter(p => p !== 'none')

    return {
      totalDocuments: results.length,
      successful: successful.length,
      failed: results.filter(r => !r.success).length,
      totalPages,
      totalTextLength,
      ocrUsed: results.some(r => r.ocrUsed),
      parsersUsed,
    }
  }
}

function buildSystemPromptWithPageContext(pageNumber: number): string {
  return `You are JHS One Ai, an intelligent AI assistant by JH Soft Corporation. The user is asking about content from page ${pageNumber} of an uploaded document. Use the provided page content to answer their question accurately. If the page content does not contain the answer, say so clearly.`
}

export const documentEngine = new DocumentEngine()
export { detectDocumentType, isImageType, isDocumentType, supportsOCR, supportsTextExtraction } from './types/detector'
export type { ParserResult, ParsedPage, DocumentType, DocumentLogEntry, ContextOptions, BuiltContext, DocumentAttachment } from './types'
export { extractTextFromImage } from './ocr'
export { extractTextFromPDF } from './pdf'
export { extractTextFromDOCX } from './docx'
export { extractTextFromFile } from './text'
export { buildFullContext, buildDocumentContext, buildPageContext, extractPageNumberFromQuery, extractChapterFromQuery } from './context'
