import { SYSTEM_PROMPT as DEFAULT_PROMPT } from './system-prompt'

let cachedPrompt: string | null = null
let lastFetch = 0
const CACHE_TTL = 60_000

export async function loadSystemPrompt(): Promise<string> {
  const now = Date.now()
  if (cachedPrompt && now - lastFetch < CACHE_TTL) {
    return cachedPrompt
  }

  try {
    const { createServerSupabase } = await import('@/lib/supabase/server')
    const supabase = await createServerSupabase()
    const { data } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'system_prompt')
      .maybeSingle()

    if (data?.value && typeof data.value === 'string') {
      cachedPrompt = data.value
    } else {
      cachedPrompt = DEFAULT_PROMPT
    }
  } catch {
    cachedPrompt = DEFAULT_PROMPT
  }

  lastFetch = Date.now()
  return cachedPrompt!
}

export function resetPromptCache() {
  cachedPrompt = null
  lastFetch = 0
}

export function getDefaultPrompt(): string {
  return DEFAULT_PROMPT
}
