import { NextResponse } from 'next/server'
import { createServerSupabase, isAdmin } from '@/lib/supabase/server'
import { providerRouter } from '@/lib/providerRouter'

export async function GET() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !(await isAdmin(user.email))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const health = providerRouter.getHealth()

  return NextResponse.json({ providers: health })
}
