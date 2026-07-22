import type { ParserResult, ParsedPage } from '../types'

export async function extractTextFromDOCX(
  docxUrl: string
): Promise<ParserResult> {
  try {
    const response = await fetch(docxUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch DOCX: ${response.status}`)
    }
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    return await extractTextFromDOCXBuffer(buffer)
  } catch (err) {
    return {
      success: false,
      documentType: 'docx',
      pages: [],
      fullText: '',
      textLength: 0,
      pagesProcessed: 0,
      ocrUsed: false,
      parserUsed: 'mammoth',
      error: (err as Error).message,
    }
  }
}

export async function extractTextFromDOCXBuffer(
  buffer: Buffer
): Promise<ParserResult> {
  try {
    const mammoth = await import('mammoth')
    const result = await mammoth.convertToHtml({ buffer })

    const htmlText = result.value
    const fullText = convertHtmlToStructuredText(htmlText)

    const pages: ParsedPage[] = [{ pageNumber: 1, text: fullText }]

    return {
      success: true,
      documentType: 'docx',
      pages,
      fullText,
      textLength: fullText.length,
      pagesProcessed: 1,
      ocrUsed: false,
      parserUsed: 'mammoth',
    }
  } catch (err) {
    return {
      success: false,
      documentType: 'docx',
      pages: [],
      fullText: '',
      textLength: 0,
      pagesProcessed: 0,
      ocrUsed: false,
      parserUsed: 'mammoth',
      error: (err as Error).message,
    }
  }
}

function convertHtmlToStructuredText(html: string): string {
  let text = html

  text = text.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '\n# $1\n')
  text = text.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '\n## $1\n')
  text = text.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '\n### $1\n')
  text = text.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '\n#### $1\n')
  text = text.replace(/<h5[^>]*>(.*?)<\/h5>/gi, '\n##### $1\n')
  text = text.replace(/<h6[^>]*>(.*?)<\/h6>/gi, '\n###### $1\n')

  text = text.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
  text = text.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
  text = text.replace(/<br\s*\/?>/gi, '\n')

  text = text.replace(/<[^>]+>/g, '')

  text = text.replace(/&nbsp;/g, ' ')
  text = text.replace(/&amp;/g, '&')
  text = text.replace(/&lt;/g, '<')
  text = text.replace(/&gt;/g, '>')
  text = text.replace(/&quot;/g, '"')
  text = text.replace(/&#39;/g, "'")

  text = text.replace(/\n{3,}/g, '\n\n').trim()

  return text
}
