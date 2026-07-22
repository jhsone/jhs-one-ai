import type { ParserResult, BuiltContext, ContextOptions, DocumentAttachment } from '../types'
import { SYSTEM_PROMPT } from '@/lib/ai/system-prompt'

const DEFAULT_OPTIONS: ContextOptions = {
  includeHistory: true,
  includeDocuments: true,
  includeAttachments: true,
  maxContextLength: 12000,
}

export function buildDocumentContext(
  results: ParserResult[],
  attachments: DocumentAttachment[]
): string {
  if (results.length === 0) return ''

  const parts: string[] = []

  for (let i = 0; i < results.length; i++) {
    const result = results[i]
    const attachment = attachments[i]

    if (!result.success || !result.fullText) continue

    let header: string
    if (result.documentType === 'image') {
      header = `[OCR Text from Image: ${attachment?.fileName ?? 'image'}]`
    } else if (result.documentType === 'pdf') {
      header = `[Document Content: ${attachment?.fileName ?? 'PDF'} — ${result.pagesProcessed} pages]`
    } else if (result.documentType === 'docx') {
      header = `[Document Content: ${attachment?.fileName ?? 'DOCX'}]`
    } else {
      header = `[File Content: ${attachment?.fileName ?? 'text file'}]`
    }

    parts.push(`${header}\n${result.fullText}`)
  }

  return parts.join('\n\n---\n\n')
}

export function buildPageContext(
  results: ParserResult[],
  pageNumber: number
): string {
  const parts: string[] = []

  for (const result of results) {
    if (!result.success) continue
    const page = result.pages.find(p => p.pageNumber === pageNumber)
    if (page) {
      parts.push(`[Page ${pageNumber}]\n${page.text}`)
    }
  }

  return parts.join('\n\n')
}

export function buildFullContext(
  message: string,
  history: { role: 'user' | 'assistant'; content: string }[],
  documentResults: ParserResult[],
  attachments: DocumentAttachment[],
  options?: Partial<ContextOptions>
): BuiltContext {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  let documentContext = ''
  if (opts.includeDocuments && documentResults.length > 0) {
    documentContext = buildDocumentContext(documentResults, attachments)
  }

  let augmentedMessage = message

  if (documentContext) {
    const truncatedContext = truncateText(documentContext, opts.maxContextLength)

    augmentedMessage = `${message}

---
Document Context (extracted from uploaded files):

${truncatedContext}

---
Answer the user's question based on the document context above. If the question refers to a specific page, find the relevant content. If the answer is not in the documents, say so clearly.`
  }

  return {
    systemPrompt: SYSTEM_PROMPT,
    augmentedMessage,
    documentContext,
    totalContextLength: augmentedMessage.length,
  }
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text

  const half = Math.floor(maxLength / 2)
  const start = text.slice(0, half)
  const end = text.slice(text.length - half)

  return `${start}\n\n[...content truncated...]\n\n${end}`
}

export function extractPageNumberFromQuery(message: string): number | null {
  const patterns = [
    /page\s+(\d+)/i,
    /p\.\s*(\d+)/i,
    /পৃষ্ঠা\s*(\d+)/,
    /পৃষ্ঠা\s*নম্বর\s*(\d+)/,
  ]

  for (const pattern of patterns) {
    const match = message.match(pattern)
    if (match) {
      const num = parseInt(match[1], 10)
      if (num > 0) return num
    }
  }

  return null
}

export function extractChapterFromQuery(message: string): number | null {
  const patterns = [
    /chapter\s+(\d+)/i,
    /ch\.\s*(\d+)/i,
    /অধ্যায়\s*(\d+)/,
    /অধ্যায়\s*নম্বর\s*(\d+)/,
  ]

  for (const pattern of patterns) {
    const match = message.match(pattern)
    if (match) {
      const num = parseInt(match[1], 10)
      if (num > 0) return num
    }
  }

  return null
}
