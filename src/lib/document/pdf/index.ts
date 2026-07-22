import type { ParserResult, ParsedPage } from '../types'

export async function extractTextFromPDF(
  pdfUrl: string
): Promise<ParserResult> {
  try {
    const response = await fetch(pdfUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.status}`)
    }
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    return await extractTextFromPDFBuffer(buffer)
  } catch (err) {
    return {
      success: false,
      documentType: 'pdf',
      pages: [],
      fullText: '',
      textLength: 0,
      pagesProcessed: 0,
      ocrUsed: false,
      parserUsed: 'pdf-parse',
      error: (err as Error).message,
    }
  }
}

export async function extractTextFromPDFBuffer(
  buffer: Buffer
): Promise<ParserResult> {
  try {
    const pdfParseModule = await import('pdf-parse')
    const pdfParse = (pdfParseModule as any).default ?? pdfParseModule
    const data = await pdfParse(buffer)

    const fullText = data.text.trim()
    const numPages = data.numpages || 1

    const pages: ParsedPage[] = []
    const pageTexts = fullText.split(/\f/)

    for (let i = 0; i < pageTexts.length; i++) {
      const pageText = pageTexts[i].trim()
      if (pageText) {
        pages.push({ pageNumber: i + 1, text: pageText })
      }
    }

    if (pages.length === 0 && fullText) {
      pages.push({ pageNumber: 1, text: fullText })
    }

    return {
      success: true,
      documentType: 'pdf',
      pages,
      fullText,
      textLength: fullText.length,
      pagesProcessed: pages.length,
      ocrUsed: false,
      parserUsed: 'pdf-parse',
    }
  } catch (err) {
    return {
      success: false,
      documentType: 'pdf',
      pages: [],
      fullText: '',
      textLength: 0,
      pagesProcessed: 0,
      ocrUsed: false,
      parserUsed: 'pdf-parse',
      error: (err as Error).message,
    }
  }
}
