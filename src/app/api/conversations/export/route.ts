import { NextResponse } from 'next/server'
import { createServerSupabase as createClient } from '@/lib/supabase/server'

// GET /api/conversations/export?format=json|markdown|txt&conversation_id=...
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const format = url.searchParams.get('format') || 'json'
    const conversationId = url.searchParams.get('conversation_id')

    let query = supabase
      .from('conversations')
      .select('id, title, created_at, messages(role, content, created_at)')
      .eq('user_id', user.id)

    if (conversationId) {
      query = query.eq('id', conversationId)
    }

    const { data: conversations, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!conversations || conversations.length === 0) {
      return NextResponse.json({ error: 'No conversations found' }, { status: 404 })
    }

    if (format === 'json') {
      return new NextResponse(JSON.stringify(conversations, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="jhs-one-ai-export-${Date.now()}.json"`,
        },
      })
    }

    if (format === 'markdown' || format === 'txt') {
      const mdLines: string[] = ['# JHS One AI — Conversation Export', `Exported at: ${new Date().toISOString()}`, '---', '']

      for (const conv of conversations) {
        mdLines.push(`## Chat: ${conv.title || 'Untitled'} (${conv.created_at})`)
        mdLines.push('')
        const messages = (conv.messages as any[]) || []
        for (const msg of messages) {
          const roleLabel = msg.role === 'user' ? '### User' : '### AI Assistant'
          mdLines.push(`${roleLabel} (${msg.created_at}):`)
          mdLines.push(msg.content)
          mdLines.push('')
        }
        mdLines.push('---', '')
      }

      const mime = format === 'markdown' ? 'text/markdown' : 'text/plain'
      const ext = format === 'markdown' ? 'md' : 'txt'

      return new NextResponse(mdLines.join('\n'), {
        headers: {
          'Content-Type': mime,
          'Content-Disposition': `attachment; filename="jhs-one-ai-export-${Date.now()}.${ext}"`,
        },
      })
    }

    return NextResponse.json({ error: 'Invalid format requested. Use json, markdown, or txt.' }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
