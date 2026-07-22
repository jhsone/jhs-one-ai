export type MemoryCategory = 'profile' | 'preference' | 'fact' | 'conversation' | 'project'

export interface MemoryItem {
  id: string
  user_id: string
  category_id: MemoryCategory
  key: string
  value: string
  confidence: number
  source: 'extracted' | 'user_explicit' | 'system'
  access_count: number
  last_accessed_at: string
  created_at: string
  updated_at: string
}

export interface ExtractedMemory {
  category: MemoryCategory
  key: string
  value: string
  confidence: number
}
