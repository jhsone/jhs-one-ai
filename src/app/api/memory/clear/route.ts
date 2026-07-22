import { NextResponse } from 'next/server'
import { createServerSupabase as createClient } from '@/lib/supabase/server'

// POST /api/memory/clear - Clear all memories for the user
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabase
      .from('memories')
      .delete()
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await supabase.from('memory_usage_logs').insert({
      user_id: user.id,
      action: 'cleared',
      details: 'Cleared all user memories',
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
