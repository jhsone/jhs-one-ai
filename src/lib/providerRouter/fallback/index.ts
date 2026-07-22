import type { ProviderName, RouterResult } from '../types'
import { keyManager } from '@/lib/keyManager'
import { healthTracker } from '../health'
import { selectBestProvider, getFallbackOrder } from '../selector'
import { callGemini } from '@/lib/ai/providers/gemini'
import { callGroq } from '@/lib/ai/providers/groq'
import { callOpenRouter } from '@/lib/ai/providers/openrouter'
import { callSimbanova } from '@/lib/ai/providers/simbanova'

type ProviderResult = { stream: ReadableStream; model: string }

const providerCallbacks: Record<ProviderName, (key: string, msg: string, hist: { role: 'user' | 'assistant'; content: string }[]) => Promise<ProviderResult>> = {
  gemini: callGemini,
  groq: callGroq,
  openrouter: callOpenRouter,
  simbanova: callSimbanova,
}

const PROVIDER_TIMEOUT = 8000

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Provider timed out after ${ms}ms`)), ms)
    ),
  ])
}

export interface FallbackResult {
  stream: ReadableStream
  usedProvider: ProviderName
  usedModel: string
  usedKeyIndex: number
  fallbackProvider: ProviderName | null
  retryCount: number
  healthScore: number
}

export async function executeWithFallback(
  message: string,
  history: { role: 'user' | 'assistant'; content: string }[],
  initialProvider: ProviderName,
  activeProviders: ProviderName[]
): Promise<FallbackResult> {
  const tried = new Set<ProviderName>()

  let currentProvider: ProviderName | null = initialProvider
  let fallbackProvider: ProviderName | null = null
  let retryCount = 0
  let lastError: Error | null = null

  while (currentProvider) {
    tried.add(currentProvider)

    for (let attempt = 0; attempt < 3; attempt++) {
      const keyEntry = keyManager.getNextKey(currentProvider)
      if (!keyEntry) break

      const startTime = Date.now()

      try {
        const result = await withTimeout(
          providerCallbacks[currentProvider](keyEntry.key, message, history),
          PROVIDER_TIMEOUT
        )

        const responseTime = Date.now() - startTime
        keyManager.recordSuccess(keyEntry.id, responseTime)
        healthTracker.recordSuccess(currentProvider, responseTime)

        const index = parseInt(keyEntry.id.split('-')[1], 10)
        const health = healthTracker.getHealth(currentProvider)

        return {
          stream: result.stream,
          usedProvider: currentProvider,
          usedModel: result.model,
          usedKeyIndex: index,
          fallbackProvider,
          retryCount,
          healthScore: health?.healthScore ?? 100,
        }
      } catch (err) {
        const responseTime = Date.now() - startTime
        const errorMessage = (err as Error).message
        const reason = keyManager.classifyError(errorMessage)
        keyManager.recordFailure(keyEntry.id, errorMessage, reason)
        healthTracker.recordFailure(currentProvider, errorMessage)

        retryCount++
        lastError = err as Error
      }
    }

    if (!fallbackProvider) {
      fallbackProvider = currentProvider
    }

    const fallbackOrder = getFallbackOrder(currentProvider, activeProviders)
    currentProvider = null
    for (const p of fallbackOrder) {
      if (!tried.has(p)) {
        currentProvider = p
        break
      }
    }
  }

  throw lastError ?? new Error('No AI providers available')
}
