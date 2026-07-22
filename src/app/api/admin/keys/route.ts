import { NextResponse } from 'next/server'
import { createServerSupabase, isAdmin } from '@/lib/supabase/server'
import { keyManager } from '@/lib/keyManager'

export async function GET() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !(await isAdmin(user.email))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const allHealth = keyManager.getAllHealth()
  const providerStats = keyManager.getAllProviderStats()

  return NextResponse.json({
    keys: allHealth,
    provider_stats: providerStats,
  })
}
