import { keyManager } from '@/lib/keyManager'

const TIMEOUT = 30_000

export async function transcribeAudio(audioUrl: string): Promise<string | null> {
  const keyEntry = keyManager.getNextKey('gemini')
  if (!keyEntry) return null

  let audioBuffer: ArrayBuffer
  let mimeType: string
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT)
    const res = await fetch(audioUrl, { signal: controller.signal })
    clearTimeout(timer)
    if (!res.ok) return null
    audioBuffer = await res.arrayBuffer()
    mimeType = res.headers.get('content-type') || 'audio/webm'
  } catch {
    return null
  }

  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    const genAI = new GoogleGenerativeAI(keyEntry.key)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const result = await model.generateContent([
      { text: 'Transcribe the speech in this audio exactly as spoken. Return only the transcribed text, no explanations or timestamps.' },
      { inlineData: { mimeType, data: Buffer.from(audioBuffer).toString('base64') } },
    ])

    const text = result.response.text()
    if (!text || text.length < 2) return null
    return text
  } catch {
    return null
  }
}
