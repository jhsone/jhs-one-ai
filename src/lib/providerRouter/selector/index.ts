import type { ProviderName, ProviderHealth, ProviderRouterConfig } from '../types'
import { healthTracker } from '../health'

const DEFAULT_PRIORITY: ProviderName[] = ['groq', 'gemini', 'openrouter', 'simbanova']

export function selectBestProvider(
  activeProviders?: ProviderName[],
  config?: ProviderRouterConfig
): ProviderName | null {
  const priority = config?.priority ?? DEFAULT_PRIORITY
  const allowed = activeProviders ?? priority

  const available = priority
    .filter(p => allowed.includes(p))
    .map(p => ({ provider: p, health: healthTracker.getHealth(p) }))
    .filter((entry): entry is { provider: ProviderName; health: ProviderHealth } =>
      entry.health !== null && entry.health.isAvailable
    )

  available.sort((a, b) => {
    const idxA = priority.indexOf(a.provider)
    const idxB = priority.indexOf(b.provider)
    if (idxA !== idxB) return idxA - idxB
    return b.health.healthScore - a.health.healthScore
  })

  return available.length > 0 ? available[0].provider : null
}

export function getFallbackOrder(
  failedProvider: ProviderName,
  activeProviders?: ProviderName[],
  config?: ProviderRouterConfig
): ProviderName[] {
  const priority = config?.priority ?? DEFAULT_PRIORITY
  const allowed = activeProviders ?? priority

  return priority.filter(p => p !== failedProvider && allowed.includes(p))
}
