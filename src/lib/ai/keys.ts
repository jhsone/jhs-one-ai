import type { ApiKeyEntry, ProviderName } from '@/types'

export function getAllKeys(): Record<ProviderName, ApiKeyEntry[]> {
  const keys: Record<ProviderName, ApiKeyEntry[]> = {
    gemini: [],
    groq: [],
    openrouter: [],
    simbanova: [],
  }

  for (let i = 0; i < 10; i++) {
    const val = process.env[`GEMINI_KEY_${i}`]
    if (val) {
      keys.gemini.push({ key: val, provider: 'gemini', index: i, used: 0, lastUsed: null, isActive: true })
    }
  }

  for (let i = 0; i < 10; i++) {
    const val = process.env[`GROQ_KEY_${i}`]
    if (val) {
      keys.groq.push({ key: val, provider: 'groq', index: i, used: 0, lastUsed: null, isActive: true })
    }
  }

  for (let i = 0; i < 5; i++) {
    const val = process.env[`OPENROUTER_KEY_${i}`]
    if (val) {
      keys.openrouter.push({ key: val, provider: 'openrouter', index: i, used: 0, lastUsed: null, isActive: true })
    }
  }

  for (let i = 0; i < 2; i++) {
    const val = process.env[`SIMBANOVA_KEY_${i}`]
    if (val) {
      keys.simbanova.push({ key: val, provider: 'simbanova', index: i, used: 0, lastUsed: null, isActive: true })
    }
  }

  return keys
}

const keyUsage = new Map<string, { count: number; lastError: Date | null; errorCount: number }>()

export function recordKeyUsage(keyId: string, success: boolean) {
  const current = keyUsage.get(keyId) ?? { count: 0, lastError: null, errorCount: 0 }
  current.count++
  if (!success) {
    current.lastError = new Date()
    current.errorCount++
  }
  keyUsage.set(keyId, current)
}

export function selectBestKey(keys: ApiKeyEntry[]): ApiKeyEntry | null {
  const activeKeys = keys.filter(k => k.isActive)

  if (activeKeys.length === 0) return null

  const scored = activeKeys.map(k => {
    const usage = keyUsage.get(`${k.provider}-${k.index}`)
    let score = 0

    score -= (usage?.count ?? 0) * 10

    if (usage?.lastError) {
      const hoursSinceError = (Date.now() - usage.lastError.getTime()) / 3600000
      if (hoursSinceError < 1) score -= 1000
      else if (hoursSinceError < 6) score -= 100
    }

    return { key: k, score }
  })

  scored.sort((a, b) => b.score - a.score)

  return scored[0].key
}

export function getKeyStats() {
  const allKeys = getAllKeys()
  const stats: Record<string, { total: number; active: number }> = {}

  for (const [provider, keys] of Object.entries(allKeys)) {
    stats[provider] = {
      total: keys.length,
      active: keys.filter(k => k.isActive).length,
    }
  }

  return stats
}
