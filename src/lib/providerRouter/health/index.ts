import type { ProviderName, ProviderHealth, ProviderStatus } from '../types'

const HEALTHY_THRESHOLD = 70
const DEGRADED_THRESHOLD = 30

class ProviderHealthTracker {
  private health: Map<ProviderName, ProviderHealth> = new Map()

  constructor(providers: ProviderName[]) {
    for (const p of providers) {
      this.health.set(p, {
        provider: p,
        status: 'healthy',
        healthScore: 100,
        successRate: 100,
        failureRate: 0,
        avgResponseTime: null,
        totalRequests: 0,
        successCount: 0,
        failureCount: 0,
        consecutiveFailures: 0,
        lastUsed: null,
        lastSuccess: null,
        lastFailure: null,
        lastError: null,
        isAvailable: true,
      })
    }
  }

  addProvider(provider: ProviderName) {
    if (!this.health.has(provider)) {
      this.health.set(provider, {
        provider,
        status: 'healthy',
        healthScore: 100,
        successRate: 100,
        failureRate: 0,
        avgResponseTime: null,
        totalRequests: 0,
        successCount: 0,
        failureCount: 0,
        consecutiveFailures: 0,
        lastUsed: null,
        lastSuccess: null,
        lastFailure: null,
        lastError: null,
        isAvailable: true,
      })
    }
  }

  recordSuccess(provider: ProviderName, responseTime: number) {
    const h = this.health.get(provider)
    if (!h) return

    const now = Date.now()
    h.totalRequests++
    h.successCount++
    h.consecutiveFailures = 0
    h.lastUsed = now
    h.lastSuccess = now
    h.lastError = null

    if (h.avgResponseTime === null) {
      h.avgResponseTime = responseTime
    } else {
      h.avgResponseTime = Math.round(
        (h.avgResponseTime * (h.totalRequests - 1) + responseTime) / h.totalRequests
      )
    }

    this.recalculate(provider)
  }

  recordFailure(provider: ProviderName, errorMessage: string) {
    const h = this.health.get(provider)
    if (!h) return

    const now = Date.now()
    h.totalRequests++
    h.failureCount++
    h.consecutiveFailures++
    h.lastUsed = now
    h.lastFailure = now
    h.lastError = errorMessage

    this.recalculate(provider)
  }

  private recalculate(provider: ProviderName) {
    const h = this.health.get(provider)
    if (!h || h.totalRequests === 0) return

    h.successRate = Math.round((h.successCount / h.totalRequests) * 100)
    h.failureRate = Math.round((h.failureCount / h.totalRequests) * 100)

    const successScore = h.successRate * 0.4

    let latencyScore = 0
    if (h.avgResponseTime !== null) {
      if (h.avgResponseTime < 2000) latencyScore = 100
      else if (h.avgResponseTime < 5000) latencyScore = 50
      else if (h.avgResponseTime < 10000) latencyScore = 25
    }
    latencyScore *= 0.3

    const consecutivePenalty = 100 * (1 / (1 + h.consecutiveFailures))
    const consecutiveScore = consecutivePenalty * 0.2

    const hoursSinceFailure = h.lastFailure
      ? (Date.now() - h.lastFailure) / 3600000
      : 24
    const uptimeScore = Math.min(100, (hoursSinceFailure / 24) * 100) * 0.1

    h.healthScore = Math.round(successScore + latencyScore + consecutiveScore + uptimeScore)

    if (h.healthScore >= HEALTHY_THRESHOLD) h.status = 'healthy'
    else if (h.healthScore >= DEGRADED_THRESHOLD) h.status = 'degraded'
    else if (h.healthScore > 0) h.status = 'cooldown'
    else h.status = 'offline'

    h.isAvailable = h.status !== 'offline' && h.status !== 'cooldown'
  }

  getHealth(provider: ProviderName): ProviderHealth | null {
    return this.health.get(provider) ?? null
  }

  getAllHealth(): ProviderHealth[] {
    return Array.from(this.health.values())
  }

  getAvailableProviders(): ProviderName[] {
    const available: ProviderName[] = []
    for (const [provider, h] of this.health) {
      if (h.isAvailable) available.push(provider)
    }
    return available
  }
}

export const healthTracker = new ProviderHealthTracker(['gemini', 'groq', 'openrouter', 'simbanova'])
