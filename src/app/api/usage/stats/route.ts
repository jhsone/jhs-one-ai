import { NextResponse } from 'next/server'
import { createServerSupabase as createClient } from '@/lib/supabase/server'
import { rateLimitMiddleware } from '@/lib/rate-limit'

export async function GET(request: Request) {
  const rateLimitResponse = rateLimitMiddleware(request, 20, 60_000)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const thisWeek = new Date(today)
    thisWeek.setDate(thisWeek.getDate() - thisWeek.getDay())

    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1)

    const [convTotal, convToday, convWeek, convMonth, msgTotal, msgToday, msgWeek, msgMonth] =
      await Promise.all([
        supabase.from('conversations').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('conversations').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', today.toISOString()),
        supabase.from('conversations').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', thisWeek.toISOString()),
        supabase.from('conversations').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', thisMonth.toISOString()),
        supabase.from('messages').select('id', { count: 'exact', head: true }),
        supabase.from('messages').select('id', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
        supabase.from('messages').select('id', { count: 'exact', head: true }).gte('created_at', thisWeek.toISOString()),
        supabase.from('messages').select('id', { count: 'exact', head: true }).gte('created_at', thisMonth.toISOString()),
      ])

    // Count user's messages via conversation ownership
    const { data: userConvs } = await supabase
      .from('conversations')
      .select('id')
      .eq('user_id', user.id)

    const convIds = (userConvs || []).map(c => c.id)

    let userMsgTotal = 0
    let userMsgToday = 0
    let userMsgWeek = 0
    let userMsgMonth = 0

    if (convIds.length > 0) {
      const [mTotal, mToday, mWeek, mMonth] = await Promise.all([
        supabase.from('messages').select('id', { count: 'exact', head: true }).in('conversation_id', convIds),
        supabase.from('messages').select('id', { count: 'exact', head: true }).in('conversation_id', convIds).gte('created_at', today.toISOString()),
        supabase.from('messages').select('id', { count: 'exact', head: true }).in('conversation_id', convIds).gte('created_at', thisWeek.toISOString()),
        supabase.from('messages').select('id', { count: 'exact', head: true }).in('conversation_id', convIds).gte('created_at', thisMonth.toISOString()),
      ])
      userMsgTotal = mTotal.count || 0
      userMsgToday = mToday.count || 0
      userMsgWeek = mWeek.count || 0
      userMsgMonth = mMonth.count || 0
    }

    return NextResponse.json({
      conversations: {
        total: convTotal.count || 0,
        today: convToday.count || 0,
        thisWeek: convWeek.count || 0,
        thisMonth: convMonth.count || 0,
      },
      messages: {
        total: userMsgTotal,
        today: userMsgToday,
        thisWeek: userMsgWeek,
        thisMonth: userMsgMonth,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
