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

    const { data: docLogs } = await supabase
      .from('document_logs')
      .select('*')
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false })

    const { count: totalDocs } = await supabase
      .from('document_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', since.toISOString())

    const { count: successDocs } = await supabase
      .from('document_logs')
      .select('*', { count: 'exact', head: true })
      .eq('success', true)
      .gte('created_at', since.toISOString())

    const { count: ocrDocs } = await supabase
      .from('document_logs')
      .select('*', { count: 'exact', head: true })
      .eq('ocr_used', true)
      .gte('created_at', since.toISOString())

    const typeBreakdown: Record<string, number> = {}
    const parserBreakdown: Record<string, number> = {}
    let totalPages = 0
    let totalTextLength = 0

    if (docLogs) {
      for (const log of docLogs) {
        typeBreakdown[log.document_type] = (typeBreakdown[log.document_type] || 0) + 1
        parserBreakdown[log.parser_used] = (parserBreakdown[log.parser_used] || 0) + 1
        totalPages += log.pages_processed || 0
        totalTextLength += log.text_length || 0
      }
    }

    return NextResponse.json({
      total: totalDocs ?? 0,
      successful: successDocs ?? 0,
      failed: (totalDocs ?? 0) - (successDocs ?? 0),
      ocrUsed: ocrDocs ?? 0,
      successRate: totalDocs && totalDocs > 0 ? Math.round(((successDocs ?? 0) / totalDocs) * 100) : 0,
      totalPages,
      totalTextLength,
      typeBreakdown,
      parserBreakdown,
      recentLogs: docLogs?.slice(0, 50) ?? [],
      days,
    })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch document stats' }, { status: 500 })
  }
}
