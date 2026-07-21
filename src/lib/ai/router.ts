import type { ProviderName } from '@/types'
import { getAllKeys, selectBestKey, recordKeyUsage } from './keys'
import { callGemini } from './providers/gemini'
import { callGroq } from './providers/groq'
import { callOpenRouter } from './providers/openrouter'
import { callSimbanova } from './providers/simbanova'

const providerCallbacks: Record<ProviderName, (key: string, msg: string, hist: { role: 'user' | 'assistant'; content: string }[]) => Promise<ReadableStream>> = {
  gemini: callGemini,
  groq: callGroq,
  openrouter: callOpenRouter,
  simbanova: callSimbanova,
}

const providerWeights: Record<ProviderName, number> = {
  gemini: 40,
  groq: 35,
  openrouter: 15,
  simbanova: 10,
}

function pickProvider(activeProviders: ProviderName[]): ProviderName {
  const totalWeight = activeProviders.reduce((sum, p) => sum + (providerWeights[p] ?? 0), 0)
  let random = Math.random() * totalWeight

  for (const provider of activeProviders) {
    random -= providerWeights[provider] ?? 0
    if (random <= 0) return provider
  }

  return activeProviders[activeProviders.length - 1]
}

const PROVIDER_TIMEOUT = 20000

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Provider timed out after ${ms}ms`)), ms)
    ),
  ])
}

const providerOrder: ProviderName[] = ['gemini', 'groq', 'openrouter', 'simbanova']

export async function routeAIRequest(
  message: string,
  history: { role: 'user' | 'assistant'; content: string }[],
  activeProviders?: ProviderName[]
): Promise<{ stream: ReadableStream; usedProvider: ProviderName }> {
  const providers = activeProviders ?? providerOrder
  const shuffled = [...providers].sort(() => Math.random() - 0.5)

  let lastError: Error | null = null

  for (const provider of shuffled) {
    try {
      const allKeys = getAllKeys()
      const providerKeys = allKeys[provider]
      const bestKey = selectBestKey(providerKeys)

      if (!bestKey) continue

      const stream = await withTimeout(
        providerCallbacks[provider](bestKey.key, message, history),
        PROVIDER_TIMEOUT
      )
      recordKeyUsage(`${provider}-${bestKey.index}`, true)

      return { stream, usedProvider: provider }
    } catch (err) {
      const providerKeys = getAllKeys()[provider]
      for (const k of providerKeys) {
        recordKeyUsage(`${provider}-${k.index}`, false)
      }
      lastError = err as Error
      continue
    }
  }

  throw lastError ?? new Error('No AI providers available')
}

export function getActiveProviders(): ProviderName[] {
  return providerOrder
}
