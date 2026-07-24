import type { ParserResult } from '@/lib/document/types'
import { keyManager } from '@/lib/keyManager'

const OCR_TIMEOUT = 30_000

async function fetchImageBase64(url: string): Promise<{ mimeType: string; data: string }> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), OCR_TIMEOUT)
  try {
    const res = await fetch(url, { signal: controller.signal })
    const buf = await res.arrayBuffer()
    const mimeType = res.headers.get('content-type') || 'image/jpeg'
    return { mimeType, data: Buffer.from(buf).toString('base64') }
  } finally {
    clearTimeout(timer)
  }
}

export async function extractWithGemini(imageUrl: string): Promise<ParserResult | null> {
  const keyEntry = keyManager.getNextKey('gemini')
  if (!keyEntry) return null

  let imageData: { mimeType: string; data: string }
  try {
    imageData = await fetchImageBase64(imageUrl)
  } catch {
    return null
  }

  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    const genAI = new GoogleGenerativeAI(keyEntry.key)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const result = await model.generateContent([
      { text: 'Extract all text from this image exactly as written. Preserve the original formatting, paragraphs, and structure. Return only the extracted text, no explanations.' },
      { inlineData: { mimeType: imageData.mimeType, data: imageData.data } },
    ])

    const text = result.response.text()
    if (!text || text.length < 5) return null

    return {
      success: true,
      documentType: 'image',
      pages: [{ pageNumber: 1, text }],
      fullText: text,
      textLength: text.length,
      pagesProcessed: 1,
      ocrUsed: true,
      parserUsed: 'gemini-vision',
      language: 'eng+ben',
    }
  } catch {
    return null
  }
}
