import OpenAI from 'openai'
import { SYSTEM_PROMPT } from '../system-prompt'

const GROQ_MODEL = 'llama-3.3-70b-versatile'

export async function callGroq(
  apiKey: string,
  message: string,
  history: { role: 'user' | 'assistant'; content: string }[]
): Promise<{ stream: ReadableStream; model: string }> {
  const client = new OpenAI({
    apiKey,
    baseURL: 'https://api.groq.com/openai/v1',
  })

  const stream = await client.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.map(h => ({ role: h.role as 'user' | 'assistant', content: h.content })),
      { role: 'user', content: message },
    ],
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
    model: GROQ_MODEL,
  }
}
