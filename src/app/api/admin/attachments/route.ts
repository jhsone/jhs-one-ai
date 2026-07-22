import { NextResponse } from 'next/server'
import { createServerSupabase, isAdmin } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !(await isAdmin(user.email))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { count: totalFiles } = await supabase
    .from('attachments')
    .select('*', { count: 'exact', head: true })

  const { data: sizeData } = await supabase
    .from('attachments')
    .select('file_size')

  const totalStorage = (sizeData || []).reduce((sum, a) => sum + (a.file_size || 0), 0)

  const { data: typeData } = await supabase
    .from('attachments')
    .select('file_type')

  const typeCounts: Record<string, number> = {}
  for (const a of typeData || []) {
    typeCounts[a.file_type] = (typeCounts[a.file_type] || 0) + 1
  }

  const { data: recent } = await supabase
    .from('attachments')
    .select('*, profiles!attachments_user_id_fkey(display_name)')
    .order('created_at', { ascending: false })
    .limit(20)

  return NextResponse.json({
    total_files: totalFiles || 0,
    total_storage: totalStorage,
    type_counts: typeCounts,
    recent: recent || [],
  })
}
