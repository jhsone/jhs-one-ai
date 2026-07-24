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
    const visionAllowed = allowed.filter(p => visionProviders.includes(p))

    console.log(`[VisionEngine] Processing request:
  - Message: "${message.slice(0, 60)}${message.length > 60 ? '...' : ''}"
  - History turns: ${history.length}
  - Attachments count: ${attachments.length}
  - Active providers requested: ${activeProviders ? JSON.stringify(activeProviders) : 'none'}
  - Vision capable providers: ${JSON.stringify(visionProviders)}
  - Allowed vision providers: ${JSON.stringify(visionAllowed)}`)

    const initialProvider = selectVisionProvider(visionAllowed)
    console.log(`[VisionEngine] Selected initial vision provider: ${initialProvider}`)

    if (!initialProvider) {
      console.error('[VisionEngine] Error: No vision-capable AI providers available.')
      throw new Error('No vision-capable AI providers available')
    }

    let lastError: Error | null = null
    let fallbackProvider: ProviderName | null = null
    let retryCount = 0

    // Try starting with initialProvider, then fallback to others
    const tryProviders = [initialProvider, ...visionAllowed.filter(p => p !== initialProvider)]
    console.log('[VisionEngine] Order of providers to try:', JSON.stringify(tryProviders))

    for (const provider of tryProviders) {
      if (!provider) continue

      console.log(`[VisionEngine] Trying provider: ${provider}`)

      for (let attempt = 0; attempt < 3; attempt++) {
        const keyEntry = keyManager.getNextKey(provider)
        if (!keyEntry) {
          console.warn(`[VisionEngine] No keys remaining/available for provider: ${provider}`)
          break
        }

        const index = parseInt(keyEntry.id.split('-')[1], 10)
        console.log(`[VisionEngine] Attempt ${attempt + 1}/3 using key index: ${index} (key id: ${keyEntry.id})`)

        try {
          const adapter = getVisionAdapter(provider)
          if (!adapter) {
            console.warn(`[VisionEngine] No adapter found for provider: ${provider}`)
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

          console.log(`[VisionEngine] Success! Chosen provider: ${provider}, model: ${result.model}, key index: ${index}`)

          return {
            result,
            usedProvider: provider,
            usedKeyIndex: index,
            fallbackProvider,
            retryCount,
          }
        } catch (err: any) {
          console.error(`[VisionEngine] Attempt ${attempt + 1} failed for provider ${provider} using key index ${index}:
  - Error: ${err.message}
  - Stack: ${err.stack}`)
          retryCount++
          lastError = err as Error
        }
      }

      if (!fallbackProvider) {
        fallbackProvider = provider
        console.log(`[VisionEngine] Fallback provider set to: ${fallbackProvider}`)
      }
    }

    console.error('[VisionEngine] All provider attempts failed. Last error:', lastError?.message)
    throw lastError ?? new Error('No vision-capable AI providers available')
  }
}

export const visionEngine = new VisionEngine()
export type { VisionAttachment, ProviderCapabilities, VisionAdapterResult } from './types'
export { getVisionCapableProviders, providerSupportsVision } from './visionCapabilities'
export { selectVisionProvider, hasImageAttachments } from './visionRouter'
