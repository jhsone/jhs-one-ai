import type { ProviderName } from '@/types'
import type { VisionAttachment } from './types'
import { providerSupportsVision } from './visionCapabilities'
import { healthTracker } from '@/lib/providerRouter/health'

const VISION_PRIORITY: ProviderName[] = ['gemini', 'openrouter']

export function selectVisionProvider(
  activeProviders?: ProviderName[]
): ProviderName | null {
  const allowed = activeProviders ?? VISION_PRIORITY

  const available = VISION_PRIORITY
    .filter(p => allowed.includes(p) && providerSupportsVision(p))
    .map(p => ({ provider: p, health: healthTracker.getHealth(p) }))
    .filter(e => e.health !== null && e.health.isAvailable)

    available.sort((a, b) => {
      const idxA = VISION_PRIORITY.indexOf(a.provider)
      const idxB = VISION_PRIORITY.indexOf(b.provider)
      if (idxA !== idxB) return idxA - idxB
      return (b.health?.healthScore ?? 0) - (a.health?.healthScore ?? 0)
    })

  return available.length > 0 ? available[0].provider : null
}

export function hasImageAttachments(attachments: VisionAttachment[]): boolean {
  return attachments.some(a => a.mimeType.startsWith('image/'))
}
