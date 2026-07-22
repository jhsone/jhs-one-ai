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

    const Tesseract = (await import('tesseract.js')).default
    const worker = await Tesseract.createWorker(lang, 1, {
      logger: () => {},
    })

    const { data } = await worker.recognize(Buffer.from(imageBuffer))
    await worker.terminate()

    const text = data.text.trim()
    const processingTime = Date.now() - startTime

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
      error: undefined,
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

    const { data } = await worker.recognize(buffer)
    await worker.terminate()

    const text = data.text.trim()

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
