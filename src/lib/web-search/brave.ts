import type { WebSearchResponse, WebSearchResult } from './types'

const BRAVE_BASE = 'https://api.search.brave.com/res/v1/web/search'

export async function braveSearch(
  query: string,
  apiKey: string,
  count: number = 5
): Promise<WebSearchResponse> {
  const url = new URL(BRAVE_BASE)
  url.searchParams.set('q', query)
  url.searchParams.set('count', String(count))

  const res = await fetch(url.toString(), {
    headers: {
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip',
      'X-Subscription-Token': apiKey,
    },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Brave search failed (${res.status}): ${text.slice(0, 200)}`)
  }

  const data = await res.json()
  const web = data.web || {}
  const results: WebSearchResult[] = (web.results || []).map((r: any) => ({
    title: r.title || '',
    url: r.url || '',
    domain: new URL(r.url || '').hostname,
    snippet: r.description || '',
  }))

  return {
    results,
    query,
    totalResults: web.total_results ?? results.length,
  }
}
