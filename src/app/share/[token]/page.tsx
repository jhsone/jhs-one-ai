import { createServerSupabase as createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Message } from '@/types'

export default async function SharedConversationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createClient()

  const { data: share } = await supabase
    .from('shared_conversations')
    .select('conversation_id, is_active, expires_at')
    .eq('token', token)
    .maybeSingle()

  if (!share || !share.is_active || (share.expires_at && new Date(share.expires_at) < new Date())) {
    notFound()
  }

  const { data: conv } = await supabase
    .from('conversations')
    .select('title')
    .eq('id', share.conversation_id)
    .maybeSingle()

  const { data: messages } = await supabase
    .from('messages')
    .select('role, content, created_at')
    .eq('conversation_id', share.conversation_id)
    .order('created_at', { ascending: true })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {conv?.title || 'Shared Conversation'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Shared via JHS One AI
          </p>
        </div>

        <div className="space-y-4">
          {(messages || []).map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-blue-200' : 'text-gray-400'}`}>
                  {new Date(msg.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
