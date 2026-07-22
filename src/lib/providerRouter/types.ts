export type ProviderName = 'gemini' | 'groq' | 'openrouter' | 'simbanova'

export type ProviderStatus = 'healthy' | 'degraded' | 'cooldown' | 'offline'

export interface ProviderHealth {
  provider: ProviderName
  status: ProviderStatus
  healthScore: number
  successRate: number
  failureRate: number
  avgResponseTime: number | null
  totalRequests: number
  successCount: number
  failureCount: number
  consecutiveFailures: number
  lastUsed: number | null
  lastSuccess: number | null
  lastFailure: number | null
  lastError: string | null
  isAvailable: boolean
}

export interface RouterResult {
  stream: ReadableStream
  usedProvider: ProviderName
  usedModel: string
  usedKeyIndex: number
  fallbackProvider: ProviderName | null
  retryCount: number
  healthScore: number
}

export interface ProviderRouterConfig {
  priority: ProviderName[]
}
