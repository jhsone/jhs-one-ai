import type { MemoryItem } from './types'

/**
 * Memory Retrieval: Selects only relevant memories based on the user's current message.
 * Does not inject unrelated memories.
 */
export function retrieveRelevantMemories(
  currentMessage: string,
  allMemories: MemoryItem[],
  maxMemoriesToInject: number = 5
): MemoryItem[] {
  if (!allMemories || allMemories.length === 0) return []

  const lowerMsg = currentMessage.toLowerCase()
  const msgWords = new Set(lowerMsg.split(/\s+/).filter(w => w.length > 2))

  // Score each memory for relevance to the current message
  const scoredMemories = allMemories.map(mem => {
    let relevanceScore = 0
    const memText = `${mem.key} ${mem.value} ${mem.category_id}`.toLowerCase()

    // Profile & preferences are always moderately relevant for personalization
    if (mem.category_id === 'profile' || mem.category_id === 'preference') {
      relevanceScore += 2.0
    }

    // Check keyword overlap with message
    for (const word of msgWords) {
      if (memText.includes(word)) {
        relevanceScore += 1.5
      }
    }

    // Boost recently accessed or high confidence memories
    relevanceScore += mem.confidence * 0.5

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
