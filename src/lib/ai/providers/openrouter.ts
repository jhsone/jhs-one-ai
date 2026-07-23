import OpenAI from 'openai'
import { loadSystemPrompt } from '../system-prompt-loader'

const OPENROUTER_MODEL = 'openai/gpt-4o-mini'

export async function callOpenRouter(
  apiKey: string,
  message: string,
  history: { role: 'user' | 'assistant'; content: string }[]
): Promise<{ stream: ReadableStream; model: string }> {
  const client = new OpenAI({
    apiKey,
    baseURL: 'https://openrouter.ai/api/v1',
  })

  const systemPrompt = await loadSystemPrompt()

  const stream = await client.chat.completions.create({
    model: OPENROUTER_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
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
    model: OPENROUTER_MODEL,
  }
}
