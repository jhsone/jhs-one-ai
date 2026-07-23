import { KeyHealth, CooldownReason } from './types'

const COOLDOWN_DURATIONS: Record<CooldownReason, number> = {
  rate_limit: 10 * 60 * 1000,
  quota_exceeded: 60 * 60 * 1000,
  auth_error: 30 * 60 * 1000,
  provider_error: 5 * 60 * 1000,
  timeout: 2 * 60 * 1000,
}

interface KeyEntry {
  key: string
  provider: string
  index: number
}

class KeyManager {
  private keys: Map<string, KeyEntry> = new Map()
  private health: Map<string, KeyHealth> = new Map()
  private roundRobinIndex: Map<string, number> = new Map()
  private providers: string[]

  constructor() {
    this.providers = []
    this.loadKeys()
  }

  private loadKeys() {
    const patterns: Record<string, string> = {
      gemini: 'GEMINI_KEY_',
      groq: 'GROQ_KEY_',
      openrouter: 'OPENROUTER_KEY_',
      simbanova: 'SIMBANOVA_KEY_',
      openai: 'OPENAI_KEY_',
    }

    for (const [provider, prefix] of Object.entries(patterns)) {
      let index = 0
      let hasKeys = false
      // Indexed keys: GEMINI_KEY_0, GEMINI_KEY_1, ...
      while (true) {
        const key = process.env[`${prefix}${index}`]
        if (!key) break
        const id = `${provider}-${index}`
        this.keys.set(id, { key, provider, index })
        this.health.set(id, {
          id,
          provider,
          index,
          isActive: true,
          cooldownUntil: null,
          lastUsed: null,
          successCount: 0,
          failureCount: 0,
          lastError: null,
          avgResponseTime: null,
          totalCalls: 0,
        })
        index++
        hasKeys = true
      }
      // Fallback to singular env var if no indexed keys found
      if (!hasKeys) {
        const singularKey = process.env[`${provider.toUpperCase()}_API_KEY`]
        if (singularKey) {
          const id = `${provider}-0`
          this.keys.set(id, { key: singularKey, provider, index: 0 })
          this.health.set(id, {
            id,
            provider,
            index: 0,
            isActive: true,
            cooldownUntil: null,
            lastUsed: null,
            successCount: 0,
            failureCount: 0,
            lastError: null,
            avgResponseTime: null,
            totalCalls: 0,
          })
          hasKeys = true
        }
      }
      if (hasKeys) {
        this.providers.push(provider)
        this.roundRobinIndex.set(provider, 0)
      }
    }
  }

  getNextKey(provider: string): { key: string; id: string } | null {
    const providerKeys = this.getKeysForProvider(provider)
    if (providerKeys.length === 0) return null

    const startIndex = this.roundRobinIndex.get(provider) ?? 0
    const now = Date.now()

    for (let i = 0; i < providerKeys.length; i++) {
      const idx = (startIndex + i) % providerKeys.length
      const keyId = providerKeys[idx]
      const h = this.health.get(keyId)
      if (!h || !h.isActive) continue
      if (h.cooldownUntil && h.cooldownUntil > now) continue
      if (h.cooldownUntil && h.cooldownUntil <= now) {
        h.cooldownUntil = null
      }
      this.roundRobinIndex.set(provider, (idx + 1) % providerKeys.length)
      return { key: this.keys.get(keyId)!.key, id: keyId }
    }

    let best: string | null = null
    let bestTime = Infinity
    for (const keyId of providerKeys) {
      const h = this.health.get(keyId)
      if (h && h.cooldownUntil && h.cooldownUntil < bestTime) {
        bestTime = h.cooldownUntil
        best = keyId
      }
    }

    if (best && bestTime <= now) {
      const h = this.health.get(best)!
      h.cooldownUntil = null
      return { key: this.keys.get(best)!.key, id: best }
    }

    return null
  }

  recordSuccess(id: string, responseTime: number) {
    const h = this.health.get(id)
    if (!h) return
    h.lastUsed = Date.now()
    h.successCount++
    h.totalCalls++
    if (h.avgResponseTime === null) {
      h.avgResponseTime = responseTime
    } else {
      h.avgResponseTime = Math.round(
        (h.avgResponseTime * (h.totalCalls - 1) + responseTime) / h.totalCalls
      )
    }
    h.lastError = null
  }

  recordFailure(id: string, errorMessage: string, reason?: CooldownReason) {
    const h = this.health.get(id)
    if (!h) return
    h.lastUsed = Date.now()
    h.failureCount++
    h.totalCalls++
    h.lastError = errorMessage
    if (reason) {
      const duration = COOLDOWN_DURATIONS[reason] ?? 5 * 60 * 1000
      h.cooldownUntil = Date.now() + duration
    }
  }

  getHealth(id: string): KeyHealth | null {
    return this.health.get(id) ?? null
  }

  getAllHealth(): KeyHealth[] {
    return Array.from(this.health.values())
  }

  getKeysForProvider(provider: string): string[] {
    const ids: string[] = []
    for (const [id] of this.keys) {
      if (id.startsWith(`${provider}-`)) {
        ids.push(id)
      }
    }
    ids.sort((a, b) => {
      const ai = parseInt(a.split('-')[1], 10)
      const bi = parseInt(b.split('-')[1], 10)
      return ai - bi
    })
    return ids
  }

  getProviders(): string[] {
    return [...this.providers]
  }

  classifyError(message: string): CooldownReason {
    const lower = message.toLowerCase()
    if (lower.includes('429') || lower.includes('rate limit') || lower.includes('too many requests')) {
      return 'rate_limit'
    }
    if (lower.includes('quota') || lower.includes('exceeded') || lower.includes('resource exhausted')) {
      return 'quota_exceeded'
    }
    if (lower.includes('401') || lower.includes('403') || lower.includes('unauthorized') || lower.includes('forbidden') || lower.includes('invalid key') || lower.includes('api key')) {
      return 'auth_error'
    }
    if (lower.includes('timeout') || lower.includes('timed out') || lower.includes('aborted')) {
      return 'timeout'
    }
    return 'provider_error'
  }

  getProviderKeyStats(provider: string) {
    const keys = this.getKeysForProvider(provider)
    const healths = keys.map(k => this.health.get(k)!).filter(Boolean)
    return {
      total: keys.length,
      active: healths.filter(h => h.isActive).length,
      successCount: healths.reduce((sum, h) => sum + h.successCount, 0),
      failureCount: healths.reduce((sum, h) => sum + h.failureCount, 0),
    }
  }

  getAllProviderStats() {
    const providers = this.getProviders()
    const stats: Record<string, { total: number; active: number }> = {}
    for (const p of providers) {
      const s = this.getProviderKeyStats(p)
      stats[p] = { total: s.total, active: s.active }
    }
    return stats
  }
}

export const keyManager = new KeyManager()
