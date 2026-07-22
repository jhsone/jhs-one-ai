import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { deleteFromCloudinary } from '@/lib/upload/upload'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { attachment_id } = await req.json()

    if (!attachment_id) {
      return NextResponse.json({ error: 'attachment_id required' }, { status: 400 })
    }

    const { data: attachment, error: fetchError } = await supabase
      .from('attachments')
      .select('*')
      .eq('id', attachment_id)
      .single()

    if (fetchError || !attachment) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 })
    }

    if (attachment.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await deleteFromCloudinary(attachment.cloudinary_public_id)

    const { error: deleteError } = await supabase
      .from('attachments')
      .delete()
      .eq('id', attachment_id)

    if (deleteError) {
      return NextResponse.json({ error: 'Failed to delete attachment' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || 'Delete failed' },
      { status: 500 }
    )
  }
}
