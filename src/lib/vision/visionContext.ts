import type { VisionAttachment, VisionContext } from './types'

export function buildVisionContext(
  text: string,
  attachments: VisionAttachment[]
): VisionContext {
  return {
    text,
    attachments,
  }
}

export function buildImageContextText(attachments: VisionAttachment[]): string {
  if (attachments.length === 0) return ''

  const parts = attachments.map((att, i) => {
    const dims = att.width && att.height ? ` (${att.width}x${att.height})` : ''
    return `[Image ${i + 1}: ${att.fileName}${dims}]`
  })

  return `\n\nAttached images:\n${parts.join('\n')}`
}
