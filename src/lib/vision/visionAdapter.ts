import type { ProviderName } from '@/types'
import type { VisionAttachment, VisionAdapterResult } from './types'

export interface AdapterInput {
  apiKey: string
  message: string
  history: { role: 'user' | 'assistant'; content: string }[]
  attachments: VisionAttachment[]
  systemPrompt: string
}

type AdapterFunction = (input: AdapterInput) => Promise<VisionAdapterResult>

async function fetchImageAsBase64(url: string): Promise<{ mimeType: string; data: string }> {
  const response = await fetch(url)
  const buffer = await response.arrayBuffer()
  const mimeType = response.headers.get('content-type') || 'image/jpeg'
  const base64 = Buffer.from(buffer).toString('base64')
  return { mimeType, data: base64 }
}

const geminiAdapter: AdapterFunction = async ({ apiKey, message, history, attachments, systemPrompt }) => {
  const { GoogleGenerativeAI } = await import('@google/generative-ai')
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: systemPrompt,
  })

  const chat = model.startChat({
    history: history.map(h => ({
      role: h.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: h.content }],
    })),
  })

  const parts: any[] = [{ text: message }]

  for (const att of attachments) {
    if (att.mimeType.startsWith('image/')) {
      const imageData = await fetchImageAsBase64(att.cloudinaryUrl)
      parts.push({
        inlineData: {
          mimeType: imageData.mimeType,
          data: imageData.data,
        },
      })
    }
  }

  const result = await chat.sendMessageStream(parts)
  const encoder = new TextEncoder()

  return {
    stream: new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text()
            if (text) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text', content: text })}\n\n`))
            }
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`))
        } catch (err) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'error', content: (err as Error).message })}\n\n`)
          )
        }
        controller.close()
      },
    }),
    model: 'gemini-2.0-flash',
  }
}

const openaiCompatibleAdapter: AdapterFunction = async ({ apiKey, message, history, attachments, systemPrompt }) => {
  const OpenAI = (await import('openai')).default
  const client = new OpenAI({ apiKey, baseURL: 'https://openrouter.ai/api/v1' })

  const messages: any[] = [
    { role: 'system', content: systemPrompt },
    ...history.map(h => ({ role: h.role as 'user' | 'assistant', content: h.content })),
  ]

  const contentParts: any[] = [{ type: 'text', text: message }]

  for (const att of attachments) {
    if (att.mimeType.startsWith('image/')) {
      contentParts.push({
        type: 'image_url',
        image_url: { url: att.cloudinaryUrl },
      })
    }
  }

  messages.push({ role: 'user', content: contentParts })

  const stream = await client.chat.completions.create({
    model: 'openai/gpt-4o-mini',
    messages,
    stream: true,
  })

  const encoder = new TextEncoder()

  return {
    stream: new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || ''
            if (text) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text', content: text })}\n\n`))
            }
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`))
        } catch (err) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'error', content: (err as Error).message })}\n\n`)
          )
        }
        controller.close()
      },
    }),
    model: 'openai/gpt-4o-mini',
  }
}

export const visionAdapters: Record<string, AdapterFunction> = {
  gemini: geminiAdapter,
  openrouter: openaiCompatibleAdapter,
}

export function getVisionAdapter(provider: ProviderName): AdapterFunction | null {
  return visionAdapters[provider] ?? null
}
