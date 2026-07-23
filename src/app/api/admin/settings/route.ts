import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, isAdmin } from '@/lib/supabase/server'
import { logAuditServer } from '@/lib/audit'

export async function GET() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !(await isAdmin(user.email))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data } = await supabase.from('app_settings').select('*')
  const settings: Record<string, any> = {}
  for (const row of data || []) {
    settings[row.key] = row.value
  }

  return NextResponse.json(settings)
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !(await isAdmin(user.email))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { key, value } = body

  if (!key) return NextResponse.json({ error: 'Key required' }, { status: 400 })

  await supabase.from('app_settings').upsert({ key, value, updated_at: new Date().toISOString() })

  await logAuditServer('update', 'app_settings', key, { value })

  return NextResponse.json({ success: true })
}
