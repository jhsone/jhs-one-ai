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
    .limit(1000)

  const providerStats: Record<string, { total: number; success: number; failed: number; avgTime: number }> = {}

  for (const log of logs || []) {
    if (!providerStats[log.provider]) {
      providerStats[log.provider] = { total: 0, success: 0, failed: 0, avgTime: 0 }
    }
    providerStats[log.provider].total++
    if (log.success) providerStats[log.provider].success++
    else providerStats[log.provider].failed++
    providerStats[log.provider].avgTime += log.response_time_ms || 0
  }

  for (const p of Object.keys(providerStats)) {
    providerStats[p].avgTime = Math.round(providerStats[p].avgTime / providerStats[p].total)
  }

  const keyStats = getKeyStats()

  return NextResponse.json({ provider_stats: providerStats, key_stats: keyStats, logs: logs || [] })
}
