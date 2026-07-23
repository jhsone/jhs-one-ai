import { NextResponse } from 'next/server'
import { createServerSupabase as createClient } from '@/lib/supabase/server'
import { uploadToCloudinary } from '@/lib/upload/upload'
import { rateLimitMiddleware } from '@/lib/rate-limit'

export async function POST(request: Request) {
  const rateLimitResponse = rateLimitMiddleware(request, 5, 60_000)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await uploadToCloudinary(buffer, `avatar-${user.id}`, file.type, user.id)

    await supabase.from('profiles').upsert({
      id: user.id,
      ai_avatar_url: result.secure_url,
    })

    return NextResponse.json({ url: result.secure_url })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data } = await supabase
      .from('profiles')
      .select('ai_avatar_url')
      .eq('id', user.id)
      .maybeSingle()

    return NextResponse.json({ url: data?.ai_avatar_url || null })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
