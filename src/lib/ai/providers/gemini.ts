import { GoogleGenerativeAI } from '@google/generative-ai'
import { loadSystemPrompt } from '../system-prompt-loader'

const GEMINI_MODEL = 'gemini-2.0-flash'

export async function callGemini(
  apiKey: string,
  message: string,
  history: { role: 'user' | 'assistant'; content: string }[]
): Promise<{ stream: ReadableStream; model: string }> {
  const genAI = new GoogleGenerativeAI(apiKey)
  const systemPrompt = await loadSystemPrompt()
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: systemPrompt,
  })

  const chat = model.startChat({
    history: history.map(h => ({
      role: h.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: h.content }],
    })),
  })

  const result = await chat.sendMessageStream(message)

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
    model: GEMINI_MODEL,
  }
}
