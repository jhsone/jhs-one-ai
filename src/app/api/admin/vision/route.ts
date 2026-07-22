import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: adminCheck } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'admin_emails')
      .single()

    const adminEmails: string[] = adminCheck?.value as unknown as string[] ?? []
    if (!adminEmails.includes(user.email ?? '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const url = new URL(req.url)
    const days = parseInt(url.searchParams.get('days') || '7', 10)

    const since = new Date()
    since.setDate(since.getDate() - days)

    const { data: visionLogs } = await supabase
      .from('provider_logs')
      .select('*')
      .gte('created_at', since.toISOString())
      .eq('vision_enabled', true)
      .order('created_at', { ascending: false })

    const { data: totalVision } = await supabase
      .from('provider_logs')
      .select('*', { count: 'exact', head: true })
      .eq('vision_enabled', true)
      .gte('created_at', since.toISOString())

    const { data: successVision } = await supabase
      .from('provider_logs')
      .select('*', { count: 'exact', head: true })
      .eq('vision_enabled', true)
      .eq('status', 'success')
      .gte('created_at', since.toISOString())

    const { data: failedVision } = await supabase
      .from('provider_logs')
      .select('*', { count: 'exact', head: true })
      .eq('vision_enabled', true)
      .eq('status', 'failed')
      .gte('created_at', since.toISOString())

    const totalCount = totalVision?.length ?? 0
    const successCount = successVision?.length ?? 0
    const failedCount = failedVision?.length ?? 0

    const providerBreakdown: Record<string, { total: number; success: number; failed: number }> = {}
    if (visionLogs) {
      for (const log of visionLogs) {
        if (!providerBreakdown[log.provider]) {
          providerBreakdown[log.provider] = { total: 0, success: 0, failed: 0 }
        }
        providerBreakdown[log.provider].total++
        if (log.status === 'success') providerBreakdown[log.provider].success++
        else providerBreakdown[log.provider].failed++
      }
    }

    const avgResponseTime = visionLogs && visionLogs.length > 0
      ? visionLogs.filter(l => l.status === 'success').reduce((sum, l) => sum + (l.response_time || 0), 0) /
        Math.max(visionLogs.filter(l => l.status === 'success').length, 1)
      : 0

    return NextResponse.json({
      total: totalCount,
      success: successCount,
      failed: failedCount,
      successRate: totalCount > 0 ? Math.round((successCount / totalCount) * 100) : 0,
      avgResponseTime: Math.round(avgResponseTime),
      providerBreakdown,
      recentLogs: visionLogs?.slice(0, 50) ?? [],
      days,
    })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch vision stats' }, { status: 500 })
  }
}
