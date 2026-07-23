import { NextResponse } from 'next/server'
import { createServerSupabase as createClient } from '@/lib/supabase/server'
import { rateLimitMiddleware } from '@/lib/rate-limit'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

function escapeCsv(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`
  }
  return val
}

async function generatePdf(conversations: any[]): Promise<Buffer> {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)

  for (const conv of conversations) {
    const page = doc.addPage([612, 792])
    const { width, height } = page.getSize()
    let y = height - 50

    page.drawText(`Chat: ${conv.title || 'Untitled'}`, { x: 50, y, size: 16, font: bold })
    y -= 25
    page.drawText(`Created: ${conv.created_at}`, { x: 50, y, size: 10, font })
    y -= 20

    const messages = (conv.messages as any[]) || []
    for (const msg of messages) {
      if (y < 80) {
        // New page
        const newPage = doc.addPage([612, 792])
        y = newPage.getSize().height - 50
      }

      const label = msg.role === 'user' ? 'User:' : 'AI:'
      page.drawText(label, { x: 50, y, size: 11, font: bold, color: msg.role === 'user' ? rgb(0.2, 0.4, 0.8) : rgb(0, 0.6, 0.3) })
      y -= 16

      // Word wrap text
      const words = msg.content.split(' ')
      let line = ''
      for (const word of words) {
        const test = line ? line + ' ' + word : word
        if (font.widthOfTextAtSize(test, 10) > width - 100) {
          page.drawText(line, { x: 55, y, size: 10, font })
          y -= 14
          line = word
        } else {
          line = test
        }
      }
      if (line) {
        page.drawText(line, { x: 55, y, size: 10, font })
        y -= 14
      }
      y -= 10
    }
  }

  return Buffer.from(await doc.save())
}

export async function GET(request: Request) {
  const rateLimitResponse = rateLimitMiddleware(request, 10, 60_000)
  if (rateLimitResponse) return rateLimitResponse
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const format = url.searchParams.get('format') || 'json'
    const conversationId = url.searchParams.get('conversation_id')

    let query = supabase
      .from('conversations')
      .select('id, title, created_at, messages(role, content, created_at)')
      .eq('user_id', user.id)

    if (conversationId) {
      query = query.eq('id', conversationId)
    }

    const { data: conversations, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!conversations || conversations.length === 0) {
      return NextResponse.json({ error: 'No conversations found' }, { status: 404 })
    }

    if (format === 'json') {
      return new NextResponse(JSON.stringify(conversations, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="jhs-one-ai-export-${Date.now()}.json"`,
        },
      })
    }

    if (format === 'markdown' || format === 'txt') {
      const mdLines: string[] = ['# JHS One AI — Conversation Export', `Exported at: ${new Date().toISOString()}`, '---', '']

      for (const conv of conversations) {
        mdLines.push(`## Chat: ${conv.title || 'Untitled'} (${conv.created_at})`)
        mdLines.push('')
        const messages = (conv.messages as any[]) || []
        for (const msg of messages) {
          const roleLabel = msg.role === 'user' ? '### User' : '### AI Assistant'
          mdLines.push(`${roleLabel} (${msg.created_at}):`)
          mdLines.push(msg.content)
          mdLines.push('')
        }
        mdLines.push('---', '')
      }

      const mime = format === 'markdown' ? 'text/markdown' : 'text/plain'
      const ext = format === 'markdown' ? 'md' : 'txt'

      return new NextResponse(mdLines.join('\n'), {
        headers: {
          'Content-Type': mime,
          'Content-Disposition': `attachment; filename="jhs-one-ai-export-${Date.now()}.${ext}"`,
        },
      })
    }

    if (format === 'csv') {
      const headers = ['Conversation Title', 'Created At', 'Role', 'Message', 'Message Time']
      const rows = conversations.flatMap((conv: any) =>
        (conv.messages || []).map((msg: any) => [
          conv.title || 'Untitled',
          conv.created_at,
          msg.role,
          msg.content,
          msg.created_at,
        ])
      )
      const csvContent = [
        headers.map(escapeCsv).join(','),
        ...rows.map((row: string[]) => row.map(escapeCsv).join(',')),
      ].join('\n')

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="jhs-one-ai-export-${Date.now()}.csv"`,
        },
      })
    }

    if (format === 'pdf') {
      const pdfBuffer = await generatePdf(conversations)
      return new NextResponse(new Uint8Array(pdfBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="jhs-one-ai-export-${Date.now()}.pdf"`,
        },
      })
    }

    return NextResponse.json({ error: 'Invalid format requested. Use json, markdown, txt, csv, or pdf.' }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
