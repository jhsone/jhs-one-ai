import { NextResponse } from 'next/server'
import { createServerSupabase as createClient } from '@/lib/supabase/server'
import { extractMemoriesFromMessage, scoreAndFilterMemories } from '@/lib/memory/extractor'
import { rateLimitMiddleware } from '@/lib/rate-limit'

// GET /api/memory - List user memories or search
export async function GET(request: Request) {
  const rateLimitResponse = rateLimitMiddleware(request as Request, 30, 60_000)
  if (rateLimitResponse) return rateLimitResponse
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const search = url.searchParams.get('q')
    const category = url.searchParams.get('category')

    let query = supabase
      .from('memories')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (category && category !== 'all') {
      query = query.eq('category_id', category)
    }

    if (search) {
      query = query.or(`key.ilike.%${search}%,value.ilike.%${search}%`)
    }

    const { data: memories, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ memories: memories || [] })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

// POST /api/memory - Add or extract memory manually / automatically
export async function POST(request: Request) {
  const rateLimitResponse = rateLimitMiddleware(request, 20, 60_000)
  if (rateLimitResponse) return rateLimitResponse
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, message, category_id, key, value } = body

    if (action === 'extract' && message) {
      const rawExtracted = extractMemoriesFromMessage(message)
      const validMemories = scoreAndFilterMemories(rawExtracted)

      const saved = []
      for (const mem of validMemories) {
        // Upsert by user_id and key
        const { data, error } = await supabase
          .from('memories')
          .upsert(
            {
              user_id: user.id,
              category_id: mem.category,
              key: mem.key,
              value: mem.value,
              confidence: mem.confidence,
              source: 'extracted',
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,key' }
          )
          .select()
          .single()

        if (!error && data) {
          saved.push(data)
          await supabase.from('memory_usage_logs').insert({
            user_id: user.id,
            memory_id: data.id,
            action: 'created',
            details: `Extracted memory: ${mem.key}`,
          })
        }
      }

      return NextResponse.json({ success: true, saved })
    }

    // Manual add/update memory
    if (!key || !value) {
      return NextResponse.json({ error: 'Key and value are required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('memories')
      .upsert(
        {
          user_id: user.id,
          category_id: category_id || 'fact',
          key: key.trim(),
          value: value.trim(),
          confidence: 1.0,
          source: 'user_explicit',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,key' }
      )
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await supabase.from('memory_usage_logs').insert({
      user_id: user.id,
      memory_id: data.id,
      action: 'updated',
      details: `User added/updated memory: ${key}`,
    })

    return NextResponse.json({ success: true, memory: data })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
