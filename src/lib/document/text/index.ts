import type { ParserResult, ParsedPage } from '../types'

export async function extractTextFromFile(
  fileUrl: string,
  isMarkdown: boolean = false
): Promise<ParserResult> {
  try {
    const response = await fetch(fileUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.status}`)
    }
    const text = await response.text()

    return buildTextResult(text, isMarkdown)
  } catch (err) {
    return {
      success: false,
      documentType: isMarkdown ? 'markdown' : 'txt',
      pages: [],
      fullText: '',
      textLength: 0,
      pagesProcessed: 0,
      ocrUsed: false,
      parserUsed: 'direct-read',
      error: (err as Error).message,
    }
  }
}

export function extractTextFromString(
  text: string,
  isMarkdown: boolean = false
): ParserResult {
  return buildTextResult(text, isMarkdown)
}

function buildTextResult(text: string, isMarkdown: boolean): ParserResult {
  const trimmed = text.trim()
  const documentType = isMarkdown ? 'markdown' : 'txt'
  const pages: ParsedPage[] = [{ pageNumber: 1, text: trimmed }]

  return {
    success: true,
    documentType,
    pages,
    fullText: trimmed,
    textLength: trimmed.length,
    pagesProcessed: 1,
    ocrUsed: false,
    parserUsed: 'direct-read',
  }
}
