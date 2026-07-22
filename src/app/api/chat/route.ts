import { NextRequest } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { routeAIRequest } from '@/lib/ai/router'
import { documentEngine } from '@/lib/document'
import { detectDocumentType, isImageType } from '@/lib/document'
import type { ChatRequest, ProviderName } from '@/types'
import type { DocumentAttachment, ParserResult } from '@/lib/document'
import type { VisionAttachment } from '@/lib/vision'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    const body: ChatRequest = await req.json()
    const { message, conversation_id, attachment_ids } = body

    console.log('[chat] message:', message.slice(0, 100), 'conv:', conversation_id, 'att_ids:', attachment_ids)

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

    // --- Fetch ALL attachments for this conversation (persistence fix) ---
    const { data: convAttachments } = await supabase
      .from('attachments')
      .select('*')
      .eq('conversation_id', conversation_id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (convAttachments && convAttachments.length > 0) {
      console.log('[chat] conv attachments:', convAttachments.length, 'new:', attachment_ids?.length ?? 0)
      const newIds = new Set(attachment_ids ?? [])
      const newRecords = convAttachments.filter(a => newIds.has(a.id))
      const existingRecords = convAttachments.filter(a => !newIds.has(a.id))

      const allDocAttachments: DocumentAttachment[] = []
      const documentResults: ParserResult[] = []
      const visionAttachments: VisionAttachment[] = []

      // --- Process NEW attachments (extract text, save to DB) ---
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

        if (isImageType(docType)) {
          // Images go to vision engine
          visionAttachments.push(docAtt)
          // Also OCR the image for text context (so follow-up text questions work)
          const ocrResult = await documentEngine.processAttachment(docAtt)
          documentResults.push(ocrResult)
          allDocAttachments.push(docAtt)

          if (ocrResult.success && ocrResult.fullText) {
            await supabase
              .from('attachments')
              .update({ context_text: ocrResult.fullText, page_count: ocrResult.pagesProcessed })
              .eq('id', a.id)
          }

          await supabase.from('document_logs').insert({
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
          })
        } else {
          // Documents (PDF/DOCX/TXT/MD) — extract text
          const result = await documentEngine.processAttachment(docAtt)
          documentResults.push(result)
          allDocAttachments.push(docAtt)

          if (result.success && result.fullText) {
            await supabase
              .from('attachments')
              .update({ context_text: result.fullText, page_count: result.pagesProcessed })
              .eq('id', a.id)
          }

          await supabase.from('document_logs').insert({
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
          })
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

        if (isImageType(docType)) {
          // Add to vision attachments for potential visual processing
          visionAttachments.push(docAtt)

          // Use saved OCR text if available
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
          // Use saved document text if available
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

      // --- Decide routing ---
      const hasDocumentContext = documentResults.some(r => r.success && r.fullText)
      const hasImages = visionAttachments.length > 0

      console.log('[chat] docContext:', hasDocumentContext, 'images:', hasImages, 'results:', documentResults.length)
      for (const r of documentResults) {
        console.log('[chat] result:', r.documentType, r.parserUsed, 'len:', r.textLength, 'success:', r.success, r.error ?? '')
      }

      if (hasDocumentContext && hasImages) {
        // Both: use document engine for text context, also pass images to vision
        routeOptions = {
          documentAttachments: allDocAttachments,
          documentResults,
          attachments: visionAttachments,
          useVision: true,
        }
      } else if (hasDocumentContext) {
        // Documents only: use any provider with extracted text
        routeOptions = {
          documentAttachments: allDocAttachments,
          documentResults,
          useVision: false,
        }
      } else if (hasImages) {
        // Images only: use vision engine
        routeOptions = {
          attachments: visionAttachments,
          useVision: true,
        }
      }
    }

    console.log('[chat] routeOptions:', JSON.stringify({
      hasDocs: !!routeOptions.documentAttachments,
      hasVision: !!routeOptions.attachments,
      useVision: routeOptions.useVision,
    }))

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
    } = await routeAIRequest(message, history, activeProviders, routeOptions)

    console.log('[chat] routed to:', usedProvider, 'model:', usedModel, 'vision:', visionEnabled, 'doc:', documentEnabled)

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
                try {
                  const data = JSON.parse(line.slice(6))
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
