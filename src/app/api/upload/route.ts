import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { uploadToCloudinary } from '@/lib/upload/upload'
import { FileProcessor } from '@/lib/upload/file-processor'
import { SUPPORTED_TYPES } from '@/lib/upload/types'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const conversationId = formData.get('conversation_id') as string | null

    if (!file || !conversationId) {
      return NextResponse.json({ error: 'File and conversation_id required' }, { status: 400 })
    }

    const validation = FileProcessor.validate(file)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const metadata = FileProcessor.identify(file)
    const buffer = Buffer.from(await file.arrayBuffer())

    const cloudinaryResult = await uploadToCloudinary(buffer, metadata.fileName, metadata.mimeType, user.id)

    const { data: attachment, error } = await supabase
      .from('attachments')
      .insert({
        user_id: user.id,
        conversation_id: conversationId,
        file_name: metadata.fileName,
        file_type: metadata.fileType,
        mime_type: metadata.mimeType,
        file_size: cloudinaryResult.bytes,
        cloudinary_public_id: cloudinaryResult.public_id,
        cloudinary_url: cloudinaryResult.secure_url,
        thumbnail_url: cloudinaryResult.thumbnail_url,
        width: cloudinaryResult.width,
        height: cloudinaryResult.height,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to save attachment' }, { status: 500 })
    }

    return NextResponse.json({ attachment })
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || 'Upload failed' },
      { status: 500 }
    )
  }
}
