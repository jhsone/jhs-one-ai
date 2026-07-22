export interface Profile {
  id: string
  display_name: string | null
  avatar_url: string | null
  preferred_lang: 'en' | 'bn'
  theme: 'light' | 'dark'
  created_at: string
}

export interface Conversation {
  id: string
  user_id: string
  title: string
  created_at: string
  updated_at: string
}

export interface Message {
  id: number
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface AdminUser {
  id: string
  role: 'admin' | 'superadmin'
}

export interface AppSettings {
  active_providers: string[]
  admin_emails: string[]
  provider_weights: Record<string, number>
}

export interface ApiKeyEntry {
  key: string
  provider: string
  index: number
  used: number
  lastUsed: Date | null
  isActive: boolean
}

export interface ProviderLog {
  id: number
  provider: string
  user_id: string | null
  model: string | null
  status: 'success' | 'failed'
  response_time: number | null
  response_time_ms: number | null
  tokens_used: number | null
  error_message: string | null
  created_at: string
}

export type ProviderName = 'gemini' | 'groq' | 'openrouter' | 'simbanova'

export interface ChatRequest {
  message: string
  conversation_id: string | null
  history: { role: 'user' | 'assistant'; content: string }[]
}

export interface StreamChunk {
  type: 'text' | 'done' | 'error'
  content?: string
}

export interface DashboardStats {
  total_users: number
  total_messages: number
  total_conversations: number
  active_today: number
  messages_today: number
  provider_count?: number
  total_keys?: number
}
