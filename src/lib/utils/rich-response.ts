const RICH_RESPONSE_REGEX = /<rich-response\s+title="([^"]*)"\s*>([\s\S]*?)<\/rich-response>/i

export interface RichResponseData {
  title: string
  content: string
}

export function parseRichResponse(content: string): RichResponseData | null {
  const match = content.match(RICH_RESPONSE_REGEX)
  if (!match) return null
  return {
    title: match[1] || 'Document',
    content: match[2].trim(),
  }
}
