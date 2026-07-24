import { NextRequest } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { routeAIRequest } from '@/lib/ai/router'
import { documentEngine, detectDocumentType, isImageType } from '@/lib/document'
import { transcribeAudio } from '@/lib/ocr/audio-transcription'
import { rateLimitMiddleware } from '@/lib/rate-limit'
import { searchWeb, formatWebResultsForContext } from '@/lib/web-search'
import type { ChatRequest, ProviderName } from '@/types'
import type { DocumentAttachment, ParserResult } from '@/lib/document'
import type { VisionAttachment } from '@/lib/vision'

export async function POST(req: NextRequest) {
  const rateLimitResponse = rateLimitMiddleware(req, 20, 60_000)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    const body: ChatRequest = await req.json()
    const { message, conversation_id, attachment_ids, web_search } = body

    if (!message || !conversation_id) {
      return new Response(JSON.stringify({ error: 'Message and conversation_id required' }), { status: 400 })
    }

    const { data: settings } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'active_providers')
      .maybeSingle()

    let activeProviders: ProviderName[] | undefined
    if (settings?.value) {
      activeProviders = (settings.value as unknown as string[]) as ProviderName[]
    }

    const history = body.history || []

    let routeOptions: Parameters<typeof routeAIRequest>[3] = {}
    let attachmentContext = ''

    // --- Fetch ALL attachments for this conversation ---
    const { data: convAttachments } = await supabase
      .from('attachments')
      .select('*')
      .eq('conversation_id', conversation_id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (convAttachments && convAttachments.length > 0) {
      const newIds = new Set(attachment_ids ?? [])
      const newRecords = convAttachments.filter(a => newIds.has(a.id))
      const existingRecords = convAttachments.filter(a => !newIds.has(a.id))

      const allDocAttachments: DocumentAttachment[] = []
      const documentResults: ParserResult[] = []
      const visionAttachments: VisionAttachment[] = []
      const audioContexts: string[] = []

      // --- Process NEW attachments ---
      for (const a of newRecords) {
        const docAtt: DocumentAttachment = {
          id: a.id,
          cloudinaryUrl: a.cloudinary_url,
          thumbnailUrl: a.thumbnail_url,
          mimeType: a.mime_type,
          fileType: a.file_type,
          fileName: a.file_name,
          fileSize: a.file_size,
          width: a.width,
          height: a.height,
        }

        const docType = detectDocumentType(docAtt.mimeType, docAtt.fileName)

        if (docAtt.mimeType.startsWith('audio/')) {
          // Transcribe audio and add to context
          const transcription = await transcribeAudio(docAtt.cloudinaryUrl)
          if (transcription) {
            audioContexts.push(`[Audio Transcription: ${docAtt.fileName}]\n${transcription}`)

            try { await supabase
              .from('attachments')
              .update({ context_text: transcription })
              .eq('id', a.id) } catch {}
          }
        } else if (isImageType(docType)) {
          visionAttachments.push(docAtt)

          const ocrResult = await documentEngine.processAttachment(docAtt)
          if (ocrResult.success && ocrResult.fullText) {
            documentResults.push(ocrResult)
            allDocAttachments.push(docAtt)

            try { await supabase
              .from('attachments')
              .update({ context_text: ocrResult.fullText, page_count: ocrResult.pagesProcessed })
              .eq('id', a.id) } catch {}
          } else {
            // Still track the image for vision even if OCR fails
            documentResults.push({
              success: true,
              documentType: 'image',
              pages: [],
              fullText: `[Image: ${docAtt.fileName}]`,
              textLength: 0,
              pagesProcessed: 0,
              ocrUsed: false,
              parserUsed: 'vision-only',
            })
          }

          try { await supabase.from('document_logs').insert({
            attachment_id: a.id,
            user_id: user.id,
            document_type: ocrResult.documentType,
            parser_used: ocrResult.parserUsed,
            ocr_used: ocrResult.ocrUsed,
            pages_processed: ocrResult.pagesProcessed,
            text_length: ocrResult.textLength,
            language: ocrResult.language,
            success: ocrResult.success,
            error_message: ocrResult.error,
          }) } catch {}
        } else {
          const result = await documentEngine.processAttachment(docAtt)
          documentResults.push(result)
          allDocAttachments.push(docAtt)

          if (result.success && result.fullText) {
            try { await supabase
              .from('attachments')
              .update({ context_text: result.fullText, page_count: result.pagesProcessed })
              .eq('id', a.id) } catch {}
          }

          try { await supabase.from('document_logs').insert({
            attachment_id: a.id,
            user_id: user.id,
            document_type: result.documentType,
            parser_used: result.parserUsed,
            ocr_used: result.ocrUsed,
            pages_processed: result.pagesProcessed,
            text_length: result.textLength,
            language: result.language,
            success: result.success,
            error_message: result.error,
          }) } catch {}
        }
      }

      // --- Load EXISTING attachments (use saved context_text) ---
      for (const a of existingRecords) {
        const docAtt: DocumentAttachment = {
          id: a.id,
          cloudinaryUrl: a.cloudinary_url,
          thumbnailUrl: a.thumbnail_url,
          mimeType: a.mime_type,
          fileType: a.file_type,
          fileName: a.file_name,
          fileSize: a.file_size,
          width: a.width,
          height: a.height,
        }

        const docType = detectDocumentType(docAtt.mimeType, docAtt.fileName)

        if (a.mime_type.startsWith('audio/') && a.context_text) {
          audioContexts.push(`[Audio Transcription: ${docAtt.fileName}]\n${a.context_text}`)
        } else if (isImageType(docType)) {
          visionAttachments.push(docAtt)

          if (a.context_text) {
            documentResults.push({
              success: true,
              documentType: 'image',
              pages: [{ pageNumber: 1, text: a.context_text }],
              fullText: a.context_text,
              textLength: a.context_text.length,
              pagesProcessed: 1,
              ocrUsed: true,
              parserUsed: 'cached-ocr',
            })
            allDocAttachments.push(docAtt)
          }
        } else {
          if (a.context_text) {
            documentResults.push({
              success: true,
              documentType: docType,
              pages: [{ pageNumber: 1, text: a.context_text }],
              fullText: a.context_text,
              textLength: a.context_text.length,
              pagesProcessed: a.page_count ?? 1,
              ocrUsed: false,
              parserUsed: 'cached',
            })
            allDocAttachments.push(docAtt)
          }
        }
      }

      // Build audio transcription context
      if (audioContexts.length > 0) {
        attachmentContext += '\n\n' + audioContexts.join('\n\n---\n\n')
      }

      // --- Decide routing ---
      const hasDocumentContext = documentResults.some(r => r.success && r.fullText)
      const hasImages = visionAttachments.length > 0

      if (hasDocumentContext && hasImages) {
        routeOptions = {
          documentAttachments: allDocAttachments,
          documentResults,
          attachments: visionAttachments,
          useVision: true,
        }
      } else if (hasDocumentContext) {
        routeOptions = {
          documentAttachments: allDocAttachments,
          documentResults,
          useVision: false,
        }
      } else if (hasImages) {
        routeOptions = {
          attachments: visionAttachments,
          useVision: true,
        }
      }
    }

    // --- Web Search ---
    let webContext: string | undefined
    if (web_search) {
      try {
        const searchResponse = await searchWeb(message, 5)
        webContext = formatWebResultsForContext(searchResponse)
      } catch (err: any) {
        console.warn('[chat] web search failed:', err.message)
      }
    }

    // Build augmented message with all context
    let augmentedMessage = message.trim()
    if (attachmentContext) {
      augmentedMessage += attachmentContext
    }
    if (webContext) {
      augmentedMessage = augmentedMessage
        ? `${webContext}\n\n---\n\nUser Question: ${augmentedMessage}\n\nUse the web search results above to answer the question. If the results don't contain enough information, say so clearly. Always cite sources using the <references> format.`
        : `${webContext}\n\n---\n\nUser Question: ${message}\n\nUse the web search results above to answer the question. If the results don't contain enough information, say so clearly. Always cite sources using the <references> format.`
    }

    const {
      stream,
      usedProvider,
      usedModel,
      usedKeyIndex,
      fallbackProvider,
      retryCount,
      healthScore,
      visionEnabled,
      documentEnabled,
      attachmentCount,
      pagesProcessed,
      textLength,
      ocrUsed,
      parserUsed,
    } = await routeAIRequest(augmentedMessage || message, history, activeProviders, routeOptions)

    const startTime = Date.now()

    const responseStream = new ReadableStream({
      async start(controller) {
        const reader = stream.getReader()
        let fullText = ''

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = new TextDecoder().decode(value)
            const lines = chunk.split('\n')

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const payload = line.slice(6).trim()
                if (!payload) continue
                try {
                  const data = JSON.parse(payload)
                  if (data.type === 'text') fullText += data.content
                } catch {}
              }
            }

            controller.enqueue(value)
          }

          const responseTime = Date.now() - startTime

          await supabase.from('provider_logs').insert({
            provider: usedProvider,
            model: usedModel,
            status: 'success',
            response_time: responseTime,
            user_id: user.id,
            api_key_index: usedKeyIndex,
            fallback_provider: fallbackProvider,
            retry_count: retryCount,
            health_score: healthScore,
            vision_enabled: visionEnabled,
            document_enabled: documentEnabled,
            attachment_count: attachmentCount,
            pages_processed: pagesProcessed,
            text_length: textLength,
            ocr_used: ocrUsed,
            parser_used: parserUsed,
          })

          controller.close()
        } catch (err) {
          const responseTime = Date.now() - startTime

          await supabase.from('provider_logs').insert({
            provider: usedProvider,
            model: usedModel,
            status: 'failed',
            response_time: responseTime,
            user_id: user.id,
            error_message: (err as Error).message,
            api_key_index: usedKeyIndex,
            fallback_provider: fallbackProvider,
            retry_count: retryCount,
            health_score: healthScore,
            vision_enabled: visionEnabled,
            document_enabled: documentEnabled,
            attachment_count: attachmentCount,
            pages_processed: pagesProcessed,
            text_length: textLength,
            ocr_used: ocrUsed,
            parser_used: parserUsed,
          })

          const encoder = new TextEncoder()
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'error', content: 'Failed to get response from AI' })}\n\n`)
          )
          controller.close()
        }
      },
    })

    return new Response(responseStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (err) {
    return new Response(
      JSON.stringify({ type: 'error', content: (err as Error).message || 'Something went wrong' }),
      { status: 500 }
    )
  }
}
