import { NextRequest } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { routeAIRequest } from '@/lib/ai/router'
import { documentEngine } from '@/lib/document'
import { detectDocumentType, isImageType } from '@/lib/document'
import type { ChatRequest, ProviderName } from '@/types'
import type { DocumentAttachment } from '@/lib/document'
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

    if (attachment_ids && attachment_ids.length > 0) {
      const { data: attRecords } = await supabase
        .from('attachments')
        .select('*')
        .in('id', attachment_ids)
        .eq('user_id', user.id)

      if (attRecords && attRecords.length > 0) {
        const allAttachments: DocumentAttachment[] = attRecords.map(a => ({
          id: a.id,
          cloudinaryUrl: a.cloudinary_url,
          thumbnailUrl: a.thumbnail_url,
          mimeType: a.mime_type,
          fileType: a.file_type,
          fileName: a.file_name,
          fileSize: a.file_size,
          width: a.width,
          height: a.height,
        }))

        const documentAttachments = allAttachments.filter(a => {
          const type = detectDocumentType(a.mimeType, a.fileName)
          return !isImageType(type)
        })

        const imageAttachments = allAttachments.filter(a => {
          const type = detectDocumentType(a.mimeType, a.fileName)
          return isImageType(type)
        })

        const visionAttachments: VisionAttachment[] = imageAttachments

        const useDocumentEngine = documentEngine.hasDocuments(documentAttachments) ||
          (imageAttachments.length > 0 && documentAttachments.length > 0)

        if (useDocumentEngine) {
          const docsToProcess = documentAttachments.length > 0
            ? documentAttachments
            : imageAttachments

          const documentResults = await documentEngine.processAttachments(docsToProcess)

          for (let i = 0; i < documentResults.length; i++) {
            const result = documentResults[i]
            const attachment = docsToProcess[i]

            if (result.success && result.fullText) {
              await supabase
                .from('attachments')
                .update({
                  context_text: result.fullText,
                  page_count: result.pagesProcessed,
                })
                .eq('id', attachment.id)
            }

            await supabase.from('document_logs').insert({
              attachment_id: attachment.id,
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

          routeOptions = {
            documentAttachments: docsToProcess,
            documentResults,
            attachments: visionAttachments.length > 0 ? visionAttachments : undefined,
            useVision: visionAttachments.length > 0 && documentAttachments.length === 0,
          }
        } else if (imageAttachments.length > 0) {
          routeOptions = {
            attachments: visionAttachments,
            useVision: true,
          }
        }
      }
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
    } = await routeAIRequest(message, history, activeProviders, routeOptions)

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
