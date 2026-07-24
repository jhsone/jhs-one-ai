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
  archived?: boolean
  message_count?: number
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
  fallback_provider: string | null
  retry_count: number | null
  health_score: number | null
  api_key_index: number | null
  vision_enabled: boolean | null
  document_enabled: boolean | null
  attachment_count: number | null
  pages_processed: number | null
  text_length: number | null
  ocr_used: boolean | null
  parser_used: string | null
  created_at: string
}

export interface DocumentLog {
  id: number
  attachment_id: string
  user_id: string
  document_type: string
  parser_used: string
  ocr_used: boolean
  pages_processed: number
  text_length: number
  language: string | null
  success: boolean
  error_message: string | null
  processing_time: number
  created_at: string
}

export type ProviderName = 'gemini' | 'groq' | 'openrouter' | 'simbanova'

export interface KeyHealth {
  id: string
  provider: string
  index: number
  isActive: boolean
  cooldownUntil: number | null
  lastUsed: number | null
  successCount: number
  failureCount: number
  lastError: string | null
  avgResponseTime: number | null
  totalCalls: number
}

export type CooldownReason = 'rate_limit' | 'quota_exceeded' | 'auth_error' | 'provider_error' | 'timeout'

export type ProviderStatus = 'healthy' | 'degraded' | 'cooldown' | 'offline'

export interface ProviderHealth {
  provider: ProviderName
  status: ProviderStatus
  healthScore: number
  successRate: number
  failureRate: number
  avgResponseTime: number | null
  totalRequests: number
  successCount: number
  failureCount: number
  consecutiveFailures: number
  lastUsed: number | null
  lastSuccess: number | null
  lastFailure: number | null
  lastError: string | null
  isAvailable: boolean
}

export interface ChatRequest {
  message: string
  conversation_id: string | null
  history: { role: 'user' | 'assistant'; content: string }[]
  attachment_ids?: string[]
  web_search?: boolean
}

export interface StreamChunk {
  type: 'text' | 'done' | 'error'
  content?: string
}

export interface Attachment {
  id: string
  user_id: string
  conversation_id: string
  message_id: number | null
  file_name: string
  file_type: string
  mime_type: string
  file_size: number
  cloudinary_public_id: string
  cloudinary_url: string
  thumbnail_url: string | null
  width: number | null
  height: number | null
  page_count: number | null
  context_text: string | null
  created_at: string
}

export interface Reference {
  title: string
  url: string
  domain: string
  label: string
  labelColor?: string
  snippet?: string
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
