import type { ProviderName } from '@/types'
import { providerRouter } from '@/lib/providerRouter'
import { visionEngine, hasImageAttachments } from '@/lib/vision'
import type { VisionAttachment } from '@/lib/vision'

export async function routeAIRequest(
  message: string,
  history: { role: 'user' | 'assistant'; content: string }[],
  activeProviders?: ProviderName[],
  attachments?: VisionAttachment[]
): Promise<{
  stream: ReadableStream
  usedProvider: ProviderName
  usedModel: string
  usedKeyIndex: number
  fallbackProvider: ProviderName | null
  retryCount: number
  healthScore: number
  visionEnabled: boolean
  attachmentCount: number
}> {
  if (attachments && attachments.length > 0 && hasImageAttachments(attachments)) {
    const visionResult = await visionEngine.process(message, history, attachments, activeProviders)

    const usedProvider = visionResult.usedProvider as ProviderName

    return {
      stream: visionResult.result.stream,
      usedProvider,
      usedModel: visionResult.result.model,
      usedKeyIndex: visionResult.usedKeyIndex,
      fallbackProvider: visionResult.fallbackProvider,
      retryCount: visionResult.retryCount,
      healthScore: 100,
      visionEnabled: true,
      attachmentCount: attachments.length,
    }
  }

  const result = await providerRouter.route(message, history, activeProviders)

  return {
    stream: result.stream,
    usedProvider: result.usedProvider,
    usedModel: result.usedModel,
    usedKeyIndex: result.usedKeyIndex,
    fallbackProvider: result.fallbackProvider,
    retryCount: result.retryCount,
    healthScore: result.healthScore,
    visionEnabled: false,
    attachmentCount: attachments?.length ?? 0,
  }
}

export function getActiveProviders(): ProviderName[] {
  return providerRouter.getPriority()
}
