import { NextResponse } from 'next/server'
import { createServerSupabase, isAdmin } from '@/lib/supabase/server'
import { getKeyStats } from '@/lib/ai/keys'

export async function GET() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !(await isAdmin(user.email))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: logs } = await supabase
    .from('provider_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10000)

  const providerStats: Record<string, {
    total: number
    success: number
    failed: number
    avgResponseTime: number
    lastUsed: string | null
    models: string[]
  }> = {}

  for (const log of logs || []) {
    if (!providerStats[log.provider]) {
      providerStats[log.provider] = { total: 0, success: 0, failed: 0, avgResponseTime: 0, lastUsed: null, models: [] }
    }
    const s = providerStats[log.provider]
    s.total++
    if (log.status === 'success' || log.success === true) s.success++
    else s.failed++
    if (log.response_time || log.response_time_ms) {
      s.avgResponseTime += (log.response_time || log.response_time_ms || 0)
    }
    if (!s.lastUsed && log.created_at) s.lastUsed = log.created_at
    if (log.model && !s.models.includes(log.model)) s.models.push(log.model)
  }

  for (const p of Object.keys(providerStats)) {
    const s = providerStats[p]
    s.avgResponseTime = s.total > 0 ? Math.round(s.avgResponseTime / s.total) : 0
  }

  const keyStats = getKeyStats()

  return NextResponse.json({
    provider_stats: providerStats,
    key_stats: keyStats,
    logs: logs || [],
  })
}
