import { NextResponse } from 'next/server'
import { createServerSupabase as createClient } from '@/lib/supabase/server'
import { rateLimitMiddleware } from '@/lib/rate-limit'

export async function POST(request: Request) {
  const rateLimitResponse = rateLimitMiddleware(request, 10, 60_000)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { conversation_id } = await request.json()
    if (!conversation_id) {
      return NextResponse.json({ error: 'conversation_id required' }, { status: 400 })
    }

    // Verify ownership
    const { data: conv } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', conversation_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!conv) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })

    // Check if already shared
    const { data: existing } = await supabase
      .from('shared_conversations')
      .select('token, id')
      .eq('conversation_id', conversation_id)
      .eq('is_active', true)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({
        token: existing.token,
        url: `${process.env.NEXT_PUBLIC_SITE_URL || ''}/share/${existing.token}`,
      })
    }

    const { data, error } = await supabase
      .from('shared_conversations')
      .insert({ conversation_id, user_id: user.id })
      .select()
      .maybeSingle()

    if (error || !data) {
      return NextResponse.json({ error: 'Failed to create share link' }, { status: 500 })
    }

    return NextResponse.json({
      token: data.token,
      url: `${process.env.NEXT_PUBLIC_SITE_URL || ''}/share/${data.token}`,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const rateLimitResponse = rateLimitMiddleware(request, 10, 60_000)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { conversation_id } = await request.json()

    await supabase
      .from('shared_conversations')
      .update({ is_active: false })
      .eq('conversation_id', conversation_id)
      .eq('user_id', user.id)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
