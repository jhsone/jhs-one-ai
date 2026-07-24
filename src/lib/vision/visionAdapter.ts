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
  console.log(`[Vision fetchImageAsBase64] Attempting to fetch: ${url}`)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30000)
  try {
    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok) {
      throw new Error(`Cloudinary download returned HTTP status ${response.status}: ${response.statusText}`)
    }
    const buffer = await response.arrayBuffer()
    const mimeType = response.headers.get('content-type') || 'image/jpeg'
    const base64 = Buffer.from(buffer).toString('base64')
    
    console.log(`[Vision fetchImageAsBase64] Success:
  - MIME type: ${mimeType}
  - Buffer size: ${buffer.byteLength} bytes
  - Base64 length: ${base64.length} characters`)
    
    return { mimeType, data: base64 }
  } catch (err: any) {
    console.error(`[Vision fetchImageAsBase64] Error occurred while downloading from ${url}:`, err.message)
    throw err
  } finally {
    clearTimeout(timeout)
  }
}

const geminiAdapter: AdapterFunction = async ({ apiKey, message, history, attachments, systemPrompt }) => {
  const modelName = 'gemini-2.0-flash'
  console.log(`[geminiAdapter] Executing with model ${modelName}`)
  console.log(`[geminiAdapter] Prompt: "${message.slice(0, 100)}${message.length > 100 ? '...' : ''}"`)
  console.log(`[geminiAdapter] Attachments list:`, JSON.stringify(attachments.map(a => ({ id: a.id, fileType: a.fileType, mimeType: a.mimeType }))))

  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    const genAI = new GoogleGenerativeAI(apiKey)
    
    console.log('[geminiAdapter] Building model with system instruction...')
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: systemPrompt,
    })

    console.log(`[geminiAdapter] Creating chat session with ${history.length} history messages.`)
    const chat = model.startChat({
      history: history.map(h => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }],
      })),
    })

    const parts: any[] = [{ text: message }]

    for (const att of attachments) {
      if (att.mimeType.startsWith('image/')) {
        console.log(`[geminiAdapter] Processing image attachment:
  - id: ${att.id}
  - url: ${att.cloudinaryUrl}
  - mime_type: ${att.mimeType}
  - image_size (metadata): ${att.fileSize}`)

        try {
          const imageData = await fetchImageAsBase64(att.cloudinaryUrl)
          
          console.log(`[geminiAdapter] Adding image to prompt parts:
  - attachment_id: ${att.id}
  - image_url: ${att.cloudinaryUrl}
  - mime_type: ${imageData.mimeType}
  - image_size (downloaded): ${imageData.data.length * 0.75} bytes
  - base64_length: ${imageData.data.length}`)

          parts.push({
            inlineData: {
              mimeType: imageData.mimeType,
              data: imageData.data,
            },
          })
        } catch (fetchErr: any) {
          console.error(`[geminiAdapter] Failed processing image for attachment ${att.id}:`, fetchErr.message)
          throw new Error(`Failed to fetch and process attachment ${att.id} (${att.fileName}): ${fetchErr.message}`)
        }
      }
    }

    console.log('[geminiAdapter] Calling sendMessageStream...')
    const result = await chat.sendMessageStream(parts)
    console.log('[geminiAdapter] sendMessageStream call successful, stream initiated.')

    const encoder = new TextEncoder()

    return {
      stream: new ReadableStream({
        async start(controller) {
          try {
            console.log('[geminiAdapter stream] Reading chunks from Gemini stream...')
            for await (const chunk of result.stream) {
              const text = chunk.text()
              if (text) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text', content: text })}\n\n`))
              }
            }
            console.log('[geminiAdapter stream] Gemini stream completed successfully.')
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`))
          } catch (err: any) {
            console.error(`[geminiAdapter stream] Error encountered during streaming:
  - Gemini model: ${modelName}
  - Gemini API error: ${err.message}
  - Stack: ${err.stack}`)
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'error', content: `Gemini stream error: ${err.message}` })}\n\n`)
            )
          }
          controller.close()
        },
      }),
      model: modelName,
    }
  } catch (adapterErr: any) {
    console.error(`[geminiAdapter] Immediate error during initialization/request:
  - Gemini model: ${modelName}
  - Error: ${adapterErr.message}
  - Stack: ${adapterErr.stack}`)
    throw adapterErr
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
