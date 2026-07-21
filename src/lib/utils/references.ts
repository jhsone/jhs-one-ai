import type { Reference } from '@/components/chat/References'

const REFERENCE_REGEX = /<references>\s*(\[[\s\S]*?\])\s*<\/references>/i

export function parseReferences(content: string): { cleanContent: string; references: Reference[] } {
  const match = content.match(REFERENCE_REGEX)
  if (!match) {
    return { cleanContent: content, references: [] }
  }

  try {
    const parsed = JSON.parse(match[1])
    if (!Array.isArray(parsed)) {
      return { cleanContent: content.replace(match[0], '').trim(), references: [] }
    }

    const references: Reference[] = parsed
      .filter((r: any) => r && r.title && r.url && r.domain)
      .slice(0, 5)
      .map((r: any) => ({
        title: r.title,
        url: r.url,
        domain: r.domain,
        label: r.label || 'Knowledge Base',
      }))

    const cleanContent = content.replace(match[0], '').trim()

    return { cleanContent, references }
  } catch {
    return { cleanContent: content.replace(match[0], '').trim(), references: [] }
  }
}
