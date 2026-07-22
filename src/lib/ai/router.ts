import type { ProviderName } from '@/types'
import { providerRouter } from '@/lib/providerRouter'

export async function routeAIRequest(
  message: string,
  history: { role: 'user' | 'assistant'; content: string }[],
  activeProviders?: ProviderName[]
): Promise<{ stream: ReadableStream; usedProvider: ProviderName; usedModel: string; usedKeyIndex: number; fallbackProvider: ProviderName | null; retryCount: number; healthScore: number }> {
  const result = await providerRouter.route(message, history, activeProviders)

  return {
    stream: result.stream,
    usedProvider: result.usedProvider,
    usedModel: result.usedModel,
    usedKeyIndex: result.usedKeyIndex,
    fallbackProvider: result.fallbackProvider,
    retryCount: result.retryCount,
    healthScore: result.healthScore,
  }
}

export function getActiveProviders(): ProviderName[] {
  return providerRouter.getPriority()
}
