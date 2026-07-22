export interface KeyHealth {
  id: string
  provider: string
  index: number
  isActive: boolean
  cooldownUntil: number | null
  lastUsed: number | null
  successCount: number
  failureCount: number
  lastError: string | null
  avgResponseTime: number | null
  totalCalls: number
}

export type CooldownReason = 'rate_limit' | 'quota_exceeded' | 'auth_error' | 'provider_error' | 'timeout'
