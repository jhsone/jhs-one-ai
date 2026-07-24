import type { ParserResult } from '@/lib/document/types'

const OCR_TIMEOUT = 60_000
const HF_API_URL = 'https://api-inference.huggingface.co/models/baidu/Unlimited-OCR'

function getConfig() {
  return {
    endpoint: process.env.UNLIMITED_OCR_ENDPOINT,
    apiToken: process.env.HF_API_TOKEN,
  }
}

function isConfigured(): boolean {
  const c = getConfig()
  return !!(c.endpoint || c.apiToken)
}

async function tryCustomEndpoint(imageUrl: string): Promise<string | null> {
  const endpoint = getConfig().endpoint
  if (!endpoint) return null

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), OCR_TIMEOUT)

  try {
    const res = await fetch(`${endpoint.replace(/\/+$/, '')}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'Unlimited-OCR',
        messages: [{
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: imageUrl } },
            { type: 'text', text: '<image>Extract and format all text from this document.' },
          ],
        }],
        temperature: 0,
        max_tokens: 8192,
      }),
      signal: controller.signal,
    })

    if (!res.ok) return null

    const data = await res.json()
    return data.choices?.[0]?.message?.content || null
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

async function tryHFInferenceAPI(imageBuffer: Buffer): Promise<string | null> {
  const token = getConfig().apiToken
  if (!token) return null

  const base64 = imageBuffer.toString('base64')
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), OCR_TIMEOUT)

  try {
    const res = await fetch(HF_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: {
          image: `data:image/jpeg;base64,${base64}`,
          text: '<image>document parsing.',
        },
        parameters: {
          max_new_tokens: 4096,
          no_repeat_ngram_size: 35,
        },
      }),
      signal: controller.signal,
    })

    if (!res.ok) return null

    const data = await res.json()
    if (typeof data === 'string') return data
    if (data.generated_text) return data.generated_text
    if (Array.isArray(data) && data[0]?.generated_text) return data[0].generated_text
    if (data[0]) return typeof data[0] === 'string' ? data[0] : JSON.stringify(data[0])
    return null
  } catch {
    return null
  } finally {
    clearTimeout(timer)
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

export async function extractWithUnlimitedOCR(
  imageUrl: string,
  imageBuffer: Buffer
): Promise<ParserResult | null> {
  if (!isConfigured()) return null

  let text = await tryCustomEndpoint(imageUrl)
  if (!text) {
    text = await tryHFInferenceAPI(imageBuffer)
  }

  if (!text || text.length < 10) return null

  const cleaned = cleanOCRText(text)

  return {
    success: true,
    documentType: 'image',
    pages: [{ pageNumber: 1, text: cleaned }],
    fullText: cleaned,
    textLength: cleaned.length,
    pagesProcessed: 1,
    ocrUsed: true,
    parserUsed: 'unlimited-ocr',
    language: 'eng+ben',
  }
}
