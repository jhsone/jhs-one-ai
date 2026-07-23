import type { MemoryItem } from './types'
import { generateEmbedding, cosineSimilarity } from './embeddings'

/**
 * Enhanced Semantic & Hybrid Memory Retrieval:
 * Blends vector semantic cosine similarity with keyword matching and category weighting.
 */
export async function retrieveRelevantMemories(
  currentMessage: string,
  allMemories: MemoryItem[],
  maxMemoriesToInject: number = 5
): Promise<MemoryItem[]> {
  if (!allMemories || allMemories.length === 0) return []

  const lowerMsg = currentMessage.toLowerCase()
  const msgWords = new Set(lowerMsg.split(/\s+/).filter(w => w.length > 2))

  // Generate embedding for current query message for semantic search
  const queryEmbedding = await generateEmbedding(currentMessage)

  const scoredMemories = allMemories.map(mem => {
    let relevanceScore = 0
    const memText = `${mem.key} ${mem.value} ${mem.category_id}`.toLowerCase()

    // 1. Profile & preferences are always moderately relevant for personalization
    if (mem.category_id === 'profile' || mem.category_id === 'preference') {
      relevanceScore += 2.0
    }

    // 2. Keyword overlap score
    for (const word of msgWords) {
      if (memText.includes(word)) {
        relevanceScore += 1.5
      }
    }

    // 3. Semantic Vector Cosine Similarity score (if embedding exists on memory)
    if (queryEmbedding && (mem as any).embedding && Array.isArray((mem as any).embedding)) {
      const similarity = cosineSimilarity(queryEmbedding, (mem as any).embedding)
      relevanceScore += similarity * 3.0 // High weight for semantic meaning match
    }

    // 4. Boost confidence & access frequency
    relevanceScore += (mem.confidence || 1.0) * 0.5

    return { mem, score: relevanceScore }
  })

  // Sort by relevance score descending
  scoredMemories.sort((a, b) => b.score - a.score)

  // Filter out zero-relevance facts unless profile/preferences
  const relevant = scoredMemories
    .filter(item => item.score >= 1.5 || item.mem.category_id === 'profile' || item.mem.category_id === 'preference')
    .slice(0, maxMemoriesToInject)
    .map(item => item.mem)

  return relevant
}

/**
 * Formats retrieved memories into a clean markdown block for context injection.
 */
export function formatMemoriesForContext(memories: MemoryItem[]): string {
  if (!memories || memories.length === 0) return ''

  const lines: string[] = ['[User Long-Term Memory & Profile Context]:']
  
  const grouped: Record<string, MemoryItem[]> = {}
  for (const m of memories) {
    if (!grouped[m.category_id]) grouped[m.category_id] = []
    grouped[m.category_id].push(m)
  }

  for (const [category, items] of Object.entries(grouped)) {
    lines.push(`- Category: ${category.toUpperCase()}`)
    for (const item of items) {
      lines.push(`  • ${item.key}: ${item.value}`)
    }
  }

  return lines.join('\n')
}
