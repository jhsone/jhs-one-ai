import { braveSearch } from './brave'
import type { WebSearchResponse, WebSearchProvider } from './types'

function getConfig() {
  const provider = (process.env.WEB_SEARCH_PROVIDER || 'brave') as WebSearchProvider
  return {
    provider,
    braveApiKey: process.env.BRAVE_SEARCH_API_KEY,
    googleApiKey: process.env.GOOGLE_SEARCH_API_KEY,
    googleCx: process.env.GOOGLE_SEARCH_CX,
  }
}

export async function searchWeb(
  query: string,
  count: number = 5
): Promise<WebSearchResponse> {
  const config = getConfig()
  const errors: string[] = []

  // Try Brave first
  if (config.provider === 'brave' || config.provider === undefined) {
    if (config.braveApiKey) {
      try {
        return await braveSearch(query, config.braveApiKey, count)
      } catch (err: any) {
        errors.push(`Brave: ${err.message}`)
      }
    }
  }

  // Try Google as fallback
  if (config.googleApiKey && config.googleCx) {
    try {
      return await googleSearch(query, config.googleApiKey, config.googleCx, count)
    } catch (err: any) {
      errors.push(`Google: ${err.message}`)
    }
  }

  throw new Error(
    `Web search failed. ${errors.length ? errors.join('; ') : 'No search API configured.'}`
  )
}

async function googleSearch(
  query: string,
  apiKey: string,
  cx: string,
  count: number = 5
): Promise<WebSearchResponse> {
  const url = new URL('https://www.googleapis.com/customsearch/v1')
  url.searchParams.set('q', query)
  url.searchParams.set('key', apiKey)
  url.searchParams.set('cx', cx)
  url.searchParams.set('num', String(Math.min(count, 10)))

  const res = await fetch(url.toString())

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Google search failed (${res.status}): ${text.slice(0, 200)}`)
  }

  const data = await res.json()
  const results = (data.items || []).map((r: any) => ({
    title: r.title || '',
    url: r.link || '',
    domain: new URL(r.link || '').hostname,
    snippet: r.snippet || '',
  }))

  return {
    results,
    query,
    totalResults: data.searchInformation?.totalResults ?? results.length,
  }
}

export function formatWebResultsForContext(results: WebSearchResponse): string {
  if (!results.results.length) return ''

  const lines = results.results.map(
    (r, i) =>
      `[${i + 1}] ${r.title}\n    URL: ${r.url}\n    ${r.snippet}`
  )

  return [
    `Web Search Results for "${results.query}":`,
    ...lines,
  ].join('\n\n')
}
