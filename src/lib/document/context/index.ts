import type { ParserResult, BuiltContext, ContextOptions, DocumentAttachment } from '../types'
import { SYSTEM_PROMPT } from '@/lib/ai/system-prompt'
import { MemoryItem } from '@/lib/memory/types'
import { formatMemoriesForContext } from '@/lib/memory/retrieval'

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
  options?: Partial<ContextOptions>,
  relevantMemories?: MemoryItem[]
): BuiltContext {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  let documentContext = ''
  if (opts.includeDocuments && documentResults.length > 0) {
    documentContext = buildDocumentContext(documentResults, attachments)
  }

  let memoryContext = ''
  if (relevantMemories && relevantMemories.length > 0) {
    memoryContext = formatMemoriesForContext(relevantMemories)
  }

  let augmentedMessage = message

  const contextBlocks: string[] = []

  // Include recent conversation history for context
  if (opts.includeHistory && history.length > 0) {
    const recentHistory = history.slice(-4).map(h =>
      `${h.role === 'user' ? 'User' : 'AI'}: ${h.content.slice(0, 300)}`
    ).join('\n')
    contextBlocks.push(`Conversation History (recent messages):\n${recentHistory}`)
  }

  if (memoryContext) {
    contextBlocks.push(memoryContext)
  }

  if (documentContext) {
    const truncatedContext = truncateText(documentContext, opts.maxContextLength)
    contextBlocks.push(`Document Context (extracted from uploaded files):\n\n${truncatedContext}`)
  }

  if (contextBlocks.length > 0) {
    augmentedMessage = `${message}

---
${contextBlocks.join('\n\n---\n\n')}

---
Answer the user's question taking into account the conversation history, user's long-term memory, and document context above. If the question refers to a specific page, find the relevant content. If the answer is not in the documents or memory, say so clearly.`
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

function parseNumericString(str: string): number {
  const bengaliMap: Record<string, string> = {
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
    '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
  }
  const ascii = str.replace(/[০-৯]/g, d => bengaliMap[d] ?? d)
  return parseInt(ascii, 10)
}

export function extractPageNumberFromQuery(message: string): number | null {
  const patterns = [
    /page\s+(\d+|[০-৯]+)/i,
    /p\.\s*(\d+|[০-৯]+)/i,
    /পৃষ্ঠা\s*([০-৯]+|\d+)/,
    /পৃষ্ঠা\s*নম্বর\s*([০-৯]+|\d+)/,
  ]

  for (const pattern of patterns) {
    const match = message.match(pattern)
    if (match) {
      const num = parseNumericString(match[1])
      if (num > 0) return num
    }
  }

  return null
}

export function extractChapterFromQuery(message: string): number | null {
  const patterns = [
    /chapter\s+(\d+|[০-৯]+)/i,
    /ch\.\s*(\d+|[০-৯]+)/i,
    /অধ্যায়\s*([০-৯]+|\d+)/,
    /অধ্যায়\s*নম্বর\s*([০-৯]+|\d+)/,
  ]

  for (const pattern of patterns) {
    const match = message.match(pattern)
    if (match) {
      const num = parseNumericString(match[1])
      if (num > 0) return num
    }
  }

  return null
}
