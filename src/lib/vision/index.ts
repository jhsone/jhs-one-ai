import type { ProviderName } from '@/types'
import type { VisionAttachment, VisionAdapterResult } from './types'
import { getVisionCapableProviders } from './visionCapabilities'
import { selectVisionProvider } from './visionRouter'
import { getVisionAdapter } from './visionAdapter'
import { keyManager } from '@/lib/keyManager'
import { SYSTEM_PROMPT } from '@/lib/ai/system-prompt'

class VisionEngine {
  async process(
    message: string,
    history: { role: 'user' | 'assistant'; content: string }[],
    attachments: VisionAttachment[],
    activeProviders?: ProviderName[]
  ): Promise<{
    result: VisionAdapterResult
    usedProvider: ProviderName
    usedKeyIndex: number
    fallbackProvider: ProviderName | null
    retryCount: number
  }> {
    const visionProviders = getVisionCapableProviders()
    const allowed = activeProviders ?? visionProviders

    const initialProvider = selectVisionProvider(allowed)
    if (!initialProvider) {
      throw new Error('No vision-capable AI providers available')
    }

    let lastError: Error | null = null
    let fallbackProvider: ProviderName | null = null
    let retryCount = 0

    for (const provider of [initialProvider, ...allowed.filter(p => p !== initialProvider && p !== initialProvider)]) {
      if (!provider) continue

      for (let attempt = 0; attempt < 3; attempt++) {
        const keyEntry = keyManager.getNextKey(provider)
        if (!keyEntry) break

        try {
          const adapter = getVisionAdapter(provider)
          if (!adapter) {
            retryCount++
            continue
          }

          const result = await adapter({
            apiKey: keyEntry.key,
            message,
            history,
            attachments,
            systemPrompt: SYSTEM_PROMPT,
          })

          const index = parseInt(keyEntry.id.split('-')[1], 10)

          return {
            result,
            usedProvider: provider,
            usedKeyIndex: index,
            fallbackProvider,
            retryCount,
          }
        } catch (err) {
          retryCount++
          lastError = err as Error
        }
      }

      if (!fallbackProvider) fallbackProvider = provider
    }

    throw lastError ?? new Error('No vision-capable AI providers available')
  }
}

export const visionEngine = new VisionEngine()
export type { VisionAttachment, ProviderCapabilities, VisionAdapterResult } from './types'
export { getVisionCapableProviders, providerSupportsVision } from './visionCapabilities'
export { selectVisionProvider, hasImageAttachments } from './visionRouter'
