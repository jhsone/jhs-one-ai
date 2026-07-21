import { NextResponse } from 'next/server'
import { createServerSupabase, isAdmin } from '@/lib/supabase/server'
import { getAllKeys } from '@/lib/ai/keys'

export async function GET() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !(await isAdmin(user.email))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
  const { count: totalMessages } = await supabase.from('messages').select('*', { count: 'exact', head: true })
  const { count: totalConversations } = await supabase.from('conversations').select('*', { count: 'exact', head: true })

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { count: activeToday } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', today.toISOString())

  const { count: messagesToday } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', today.toISOString())
    .eq('role', 'user')

  const { data: settings } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'active_providers')
    .single()
  const activeProviders: string[] = (settings?.value as string[]) || []
  const providerCount = activeProviders.length || 4

  const totalKeys = Object.values(getAllKeys()).reduce((sum, arr) => sum + arr.length, 0)

  return NextResponse.json({
    total_users: totalUsers || 0,
    total_messages: totalMessages || 0,
    total_conversations: totalConversations || 0,
    active_today: activeToday || 0,
    messages_today: messagesToday || 0,
    provider_count: providerCount,
    total_keys: totalKeys,
  })
}
