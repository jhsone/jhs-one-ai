import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('id, title, created_at, messages(content)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const stats = (conversations || []).map((conv) => {
      const msgs = (conv.messages as { content: string }[] | null) || []
      const totalMessages = msgs.length
      const totalWords = msgs.reduce((sum, m) => sum + (m.content?.split(/\s+/).filter(Boolean).length || 0), 0)
      const avgWordsPerMessage = totalMessages > 0 ? Math.round(totalWords / totalMessages) : 0

      const date = new Date(conv.created_at)
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' })
      const hourOfDay = date.getHours()
      const timeOfDay = hourOfDay < 12 ? 'morning' : hourOfDay < 17 ? 'afternoon' : 'evening'

      return {
        id: conv.id,
        title: conv.title,
        created_at: conv.created_at,
        totalMessages,
        totalWords,
        avgWordsPerMessage,
        dayOfWeek,
        hourOfDay,
        timeOfDay,
      }
    })

    const totalConversations = stats.length
    const totalMessagesAll = stats.reduce((sum, s) => sum + s.totalMessages, 0)
    const totalWordsAll = stats.reduce((sum, s) => sum + s.totalWords, 0)
    const avgMessagesPerConversation = totalConversations > 0 ? Math.round(totalMessagesAll / totalConversations) : 0
    const avgWordsPerConversation = totalConversations > 0 ? Math.round(totalWordsAll / totalConversations) : 0

    const dayDistribution: Record<string, number> = {}
    const timeDistribution: Record<string, number> = {}
    const dateDistribution: Record<string, number> = {}

    stats.forEach((s) => {
      dayDistribution[s.dayOfWeek] = (dayDistribution[s.dayOfWeek] || 0) + 1
      timeDistribution[s.timeOfDay] = (timeDistribution[s.timeOfDay] || 0) + 1
      const dateKey = s.created_at.slice(0, 10)
      dateDistribution[dateKey] = (dateDistribution[dateKey] || 0) + s.totalMessages
    })

    const topConversations = [...stats].sort((a, b) => b.totalMessages - a.totalMessages).slice(0, 10)

    return NextResponse.json({
      summary: {
        totalConversations,
        totalMessages: totalMessagesAll,
        totalWords: totalWordsAll,
        avgMessagesPerConversation,
        avgWordsPerConversation,
      },
      dayDistribution,
      timeDistribution,
      dateDistribution,
      topConversations,
      conversations: stats,
    })
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
