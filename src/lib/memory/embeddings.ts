import { GoogleGenerativeAI } from '@google/generative-ai'
import OpenAI from 'openai'

/**
 * Provider-independent embedding generator using available AI API keys (Gemini or OpenAI).
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
  if (!text || text.trim().length === 0) return null

  // 1. Try Gemini embedding-001 or text-embedding-004
  const geminiKey = process.env.GEMINI_API_KEY
  if (geminiKey) {
    try {
      const ai = new GoogleGenerativeAI(geminiKey)
      const model = ai.getGenerativeModel({ model: 'text-embedding-004' })
      const result = await model.embedContent(text)
      if (result.embedding?.values) {
        return Array.from(result.embedding.values)
      }
    } catch (err) {
      console.warn('[embedding] Gemini embedding failed, trying fallback:', (err as Error).message)
    }
  }

  // 2. Try OpenAI embedding model text-embedding-3-small
  const openAiKey = process.env.OPENAI_API_KEY
  if (openAiKey) {
    try {
      const openai = new OpenAI({ apiKey: openAiKey })
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
      })
      if (response.data[0]?.embedding) {
        return response.data[0].embedding
      }
    } catch (err) {
      console.warn('[embedding] OpenAI embedding failed:', (err as Error).message)
    }
  }

  // 3. Fallback: lightweight deterministic pseudo-embedding vector for offline / mock testing (768 dimensions)
  return generateDeterministicPseudoEmbedding(text, 768)
}

function generateDeterministicPseudoEmbedding(text: string, dimensions: number): number[] {
  const vector = new Array(dimensions).fill(0)
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i)
    const index = (charCode * (i + 1)) % dimensions
    vector[index] += Math.sin(charCode + i)
  }
  // Normalize vector magnitude to 1.0 (unit vector)
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0))
  if (magnitude === 0) return vector
  return vector.map(val => val / magnitude)
}

/**
 * Calculates cosine similarity between two numeric vectors.
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0
  let dotProduct = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i]
    normA += vecA[i] * vecA[i]
    normB += vecB[i] * vecB[i]
  }
  if (normA === 0 || normB === 0) return 0
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}
