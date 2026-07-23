import { NextResponse } from 'next/server'
import { createServerSupabase as createClient } from '@/lib/supabase/server'
import { retrieveRelevantMemories } from '@/lib/memory/retrieval'
import { rateLimitMiddleware } from '@/lib/rate-limit'

export async function POST(request: Request) {
  const rateLimitResponse = rateLimitMiddleware(request, 30, 60_000)
  if (rateLimitResponse) return rateLimitResponse
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { message } = body

    const { data: allMemories, error } = await supabase
      .from('memories')
      .select('*')
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const relevant = retrieveRelevantMemories(message || '', allMemories || [])

    return NextResponse.json({ success: true, memories: relevant })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
