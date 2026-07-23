import { NextResponse } from 'next/server'
import { createServerSupabase as createClient } from '@/lib/supabase/server'
import { getDefaultPrompt, resetPromptCache } from '@/lib/ai/system-prompt-loader'
import { rateLimitMiddleware } from '@/lib/rate-limit'

export async function GET(request: Request) {
  const rateLimitResponse = rateLimitMiddleware(request, 30, 60_000)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const isAdmin = await supabase
      .from('admin_users')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()

    if (!isAdmin?.data) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { data } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'system_prompt')
      .maybeSingle()

    return NextResponse.json({
      prompt: data?.value || getDefaultPrompt(),
      isCustom: !!data?.value,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const rateLimitResponse = rateLimitMiddleware(request, 10, 60_000)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const isAdmin = await supabase
      .from('admin_users')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()

    if (!isAdmin?.data) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { prompt } = await request.json()
    if (typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Invalid prompt' }, { status: 400 })
    }

    if (prompt.trim().length < 10) {
      return NextResponse.json({ error: 'Prompt too short (min 10 chars)' }, { status: 400 })
    }

    await supabase.from('app_settings').upsert({
      key: 'system_prompt',
      value: prompt,
      updated_at: new Date().toISOString(),
    })

    resetPromptCache()

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const rateLimitResponse = rateLimitMiddleware(request, 5, 60_000)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const isAdmin = await supabase
      .from('admin_users')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()

    if (!isAdmin?.data) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    await supabase.from('app_settings').delete().eq('key', 'system_prompt')
    resetPromptCache()

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
