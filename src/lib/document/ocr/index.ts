import type { ParserResult } from '../types'

const OCR_LANGUAGES = 'eng+ben'

export async function extractTextFromImage(
  imageUrl: string,
  options?: { lang?: string }
): Promise<ParserResult> {
  const lang = options?.lang ?? OCR_LANGUAGES
  const startTime = Date.now()

  try {
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status}`)
    }
    const imageBuffer = await imageResponse.arrayBuffer()

    return await extractTextFromImageBuffer(Buffer.from(imageBuffer), 'image/*', { lang })
  } catch (err) {
    return {
      success: false,
      documentType: 'image',
      pages: [],
      fullText: '',
      textLength: 0,
      pagesProcessed: 0,
      ocrUsed: true,
      parserUsed: 'tesseract.js',
      error: (err as Error).message,
      language: lang,
    }
  }
}

export async function extractTextFromImageBuffer(
  buffer: Buffer,
  mimeType: string,
  options?: { lang?: string }
): Promise<ParserResult> {
  const lang = options?.lang ?? OCR_LANGUAGES

  try {
    const Tesseract = (await import('tesseract.js')).default
    const worker = await Tesseract.createWorker(lang, 1, {
      logger: () => {},
    })

    // Set parameters for enhanced OCR accuracy on documents & receipts
    await worker.setParameters({
      tessedit_char_whitelist: '',
      preserve_interword_spaces: '1',
    })

    const { data } = await worker.recognize(buffer)
    await worker.terminate()

    const text = cleanOCRText(data.text || '')

    return {
      success: true,
      documentType: 'image',
      pages: [{ pageNumber: 1, text }],
      fullText: text,
      textLength: text.length,
      pagesProcessed: 1,
      ocrUsed: true,
      parserUsed: 'tesseract.js',
      language: lang,
    }
  } catch (err) {
    return {
      success: false,
      documentType: 'image',
      pages: [],
      fullText: '',
      textLength: 0,
      pagesProcessed: 0,
      ocrUsed: true,
      parserUsed: 'tesseract.js',
      error: (err as Error).message,
      language: lang,
    }
  }
}

function cleanOCRText(text: string): string {
  if (!text) return ''
  return text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
