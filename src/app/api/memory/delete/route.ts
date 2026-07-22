import { NextResponse } from 'next/server'
import { createServerSupabase as createClient } from '@/lib/supabase/server'

// DELETE /api/memory/delete - Delete a specific memory item
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const id = url.searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Memory ID is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('memories')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await supabase.from('memory_usage_logs').insert({
      user_id: user.id,
      memory_id: id,
      action: 'deleted',
      details: `Deleted memory ID ${id}`,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
