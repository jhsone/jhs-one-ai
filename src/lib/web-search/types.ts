export interface WebSearchResult {
  title: string
  url: string
  domain: string
  snippet: string
}

export interface WebSearchResponse {
  results: WebSearchResult[]
  query: string
  totalResults: number
}

export type WebSearchProvider = 'brave' | 'google'

export interface WebSearchConfig {
  provider: WebSearchProvider
  braveApiKey?: string
  googleApiKey?: string
  googleCx?: string
}
