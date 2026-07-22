import type { ProviderName } from '@/types'
import { providerRouter } from '@/lib/providerRouter'
import { visionEngine, hasImageAttachments } from '@/lib/vision'
import type { VisionAttachment } from '@/lib/vision'
import type { DocumentAttachment, ParserResult } from '@/lib/document'
import { documentEngine } from '@/lib/document'

export interface RouteOptions {
  attachments?: VisionAttachment[]
  documentAttachments?: DocumentAttachment[]
  documentResults?: ParserResult[]
  useVision?: boolean
}

export async function routeAIRequest(
  message: string,
  history: { role: 'user' | 'assistant'; content: string }[],
  activeProviders?: ProviderName[],
  options?: RouteOptions
): Promise<{
  stream: ReadableStream
  usedProvider: ProviderName
  usedModel: string
  usedKeyIndex: number
  fallbackProvider: ProviderName | null
  retryCount: number
  healthScore: number
  visionEnabled: boolean
  documentEnabled: boolean
  attachmentCount: number
  pagesProcessed: number
  textLength: number
  ocrUsed: boolean
  parserUsed: string
}> {
  const attachments = options?.attachments
  const documentAttachments = options?.documentAttachments
  const documentResults = options?.documentResults
  const useVision = options?.useVision ?? true

  const hasDocContext = documentAttachments && documentResults && documentAttachments.length > 0
  const hasVisionImages = attachments && attachments.length > 0 && hasImageAttachments(attachments) && useVision

  if (hasDocContext && hasVisionImages) {
    // Both document text + images: use vision engine with augmented message
    const context = documentEngine.buildContext(message, history, documentResults!, documentAttachments!)
    const summary = documentEngine.getSummary(documentResults!)

    console.log('[router] doc+vision path, contextLen:', context.totalContextLength, 'augmentedMsgLen:', context.augmentedMessage.length)

    const visionResult = await visionEngine.process(context.augmentedMessage, history, attachments!, activeProviders)

    return {
      stream: visionResult.result.stream,
      usedProvider: visionResult.usedProvider as ProviderName,
      usedModel: visionResult.result.model,
      usedKeyIndex: visionResult.usedKeyIndex,
      fallbackProvider: visionResult.fallbackProvider,
      retryCount: visionResult.retryCount,
      healthScore: 100,
      visionEnabled: true,
      documentEnabled: true,
      attachmentCount: documentAttachments!.length + attachments!.length,
      pagesProcessed: summary.totalPages,
      textLength: summary.totalTextLength,
      ocrUsed: summary.ocrUsed,
      parserUsed: summary.parsersUsed.join(','),
    }
  }

  if (hasDocContext) {
    // Documents only: use any provider with extracted text
    const context = documentEngine.buildContext(message, history, documentResults!, documentAttachments!)
    const summary = documentEngine.getSummary(documentResults!)

    console.log('[router] doc-only path, contextLen:', context.totalContextLength, 'augmentedMsgLen:', context.augmentedMessage.length, 'augmentedPreview:', context.augmentedMessage.slice(0, 200))

    const result = await providerRouter.route(context.augmentedMessage, history, activeProviders)

    return {
      stream: result.stream,
      usedProvider: result.usedProvider,
      usedModel: result.usedModel,
      usedKeyIndex: result.usedKeyIndex,
      fallbackProvider: result.fallbackProvider,
      retryCount: result.retryCount,
      healthScore: result.healthScore,
      visionEnabled: false,
      documentEnabled: true,
      attachmentCount: documentAttachments!.length,
      pagesProcessed: summary.totalPages,
      textLength: summary.totalTextLength,
      ocrUsed: summary.ocrUsed,
      parserUsed: summary.parsersUsed.join(','),
    }
  }

  if (hasVisionImages) {
    // Images only: use vision engine
    console.log('[router] vision-only path')
    const visionResult = await visionEngine.process(message, history, attachments!, activeProviders)

    return {
      stream: visionResult.result.stream,
      usedProvider: visionResult.usedProvider as ProviderName,
      usedModel: visionResult.result.model,
      usedKeyIndex: visionResult.usedKeyIndex,
      fallbackProvider: visionResult.fallbackProvider,
      retryCount: visionResult.retryCount,
      healthScore: 100,
      visionEnabled: true,
      documentEnabled: false,
      attachmentCount: attachments!.length,
      pagesProcessed: 0,
      textLength: 0,
      ocrUsed: false,
      parserUsed: '',
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
    documentEnabled: false,
    attachmentCount: attachments?.length ?? 0,
    pagesProcessed: 0,
    textLength: 0,
    ocrUsed: false,
    parserUsed: '',
  }
}

export function getActiveProviders(): ProviderName[] {
  return providerRouter.getPriority()
}
