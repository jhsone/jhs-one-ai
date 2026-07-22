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

    let fullText = ''
    let pages: ParsedPage[] = []

    if ((pdfParseModule as any).PDFParse) {
      // v2 class API
      const { PDFParse } = pdfParseModule as any
      const parser = new PDFParse({ data: buffer })
      const data = await parser.getText()

      fullText = (data.text || '').trim()

      if (Array.isArray(data.pages) && data.pages.length > 0) {
        pages = data.pages.map((p: { text: string; num: number }) => ({
          pageNumber: p.num,
          text: (p.text || '').trim(),
        }))
      }
      await parser.destroy?.()
    } else {
      // v1 function API
      const pdfParse = (pdfParseModule as any).default ?? pdfParseModule
      const data = await pdfParse(buffer)
      fullText = (data.text || '').trim()

      const pageTexts = fullText.split(/\f/)
      for (let i = 0; i < pageTexts.length; i++) {
        const pageText = pageTexts[i].trim()
        if (pageText) {
          pages.push({ pageNumber: i + 1, text: pageText })
        }
      }
    }

    if (pages.length === 0 && fullText) {
      pages.push({ pageNumber: 1, text: fullText })
    }

    console.log('[pdf] parsed successfully, pages:', pages.length, 'textLen:', fullText.length, 'preview:', fullText.slice(0, 100))

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
    console.error('[pdf] extraction failed:', (err as Error).message)
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
