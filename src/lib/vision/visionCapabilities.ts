import type { ProviderName } from '@/types'
import type { ProviderCapabilities } from './types'

export const PROVIDER_CAPABILITIES: Record<ProviderName, ProviderCapabilities> = {
  gemini: {
    supportsVision: true,
    supportsDocuments: false,
    supportsOCR: false,
    supportsStreaming: true,
    supportedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  },
  groq: {
    supportsVision: false,
    supportsDocuments: false,
    supportsOCR: false,
    supportsStreaming: true,
    supportedMimeTypes: [],
  },
  openrouter: {
    supportsVision: true,
    supportsDocuments: false,
    supportsOCR: false,
    supportsStreaming: true,
    supportedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  },
  simbanova: {
    supportsVision: false,
    supportsDocuments: false,
    supportsOCR: false,
    supportsStreaming: true,
    supportedMimeTypes: [],
  },
}

export function getVisionCapableProviders(): ProviderName[] {
  const capable: ProviderName[] = []
  for (const [provider, caps] of Object.entries(PROVIDER_CAPABILITIES)) {
    if (caps.supportsVision) capable.push(provider as ProviderName)
  }
  return capable
}

export function providerSupportsVision(provider: ProviderName): boolean {
  return PROVIDER_CAPABILITIES[provider]?.supportsVision ?? false
}

export function providerSupportsMimeType(provider: ProviderName, mimeType: string): boolean {
  const caps = PROVIDER_CAPABILITIES[provider]
  if (!caps) return false
  return caps.supportedMimeTypes.includes(mimeType)
}
