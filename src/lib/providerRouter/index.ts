import type { ProviderRouterConfig, RouterResult, ProviderName } from './types'
import { healthTracker } from './health'
import { selectBestProvider } from './selector'
import { executeWithFallback } from './fallback'

const DEFAULT_PRIORITY: ProviderName[] = ['groq', 'gemini', 'openrouter', 'simbanova']

class ProviderRouter {
  private config: ProviderRouterConfig

  constructor(priority?: ProviderName[]) {
    this.config = { priority: priority ?? DEFAULT_PRIORITY }
  }

  setPriority(priority: ProviderName[]) {
    this.config.priority = priority
  }

  getPriority(): ProviderName[] {
    return [...this.config.priority]
  }

  async route(
    message: string,
    history: { role: 'user' | 'assistant'; content: string }[],
    activeProviders?: ProviderName[]
  ): Promise<RouterResult> {
    const providers = activeProviders ?? this.config.priority

    const initialProvider = selectBestProvider(providers, this.config)
    if (!initialProvider) {
      throw new Error('No AI providers available')
    }

    const result = await executeWithFallback(message, history, initialProvider, providers)

    return result
  }

  getHealth() {
    return healthTracker.getAllHealth()
  }

  getProviderHealth(provider: ProviderName) {
    return healthTracker.getHealth(provider)
  }
}

export const providerRouter = new ProviderRouter()
export { healthTracker } from './health'
export type { ProviderRouterConfig, RouterResult, ProviderHealth, ProviderStatus, ProviderName } from './types'
