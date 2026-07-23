import { createClient } from '@/lib/supabase/client'

export async function logAudit(
  action: string,
  entityType: string,
  entityId?: string,
  details?: Record<string, unknown>
) {
  try {
    await fetch('/api/admin/audit-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, entity_type: entityType, entity_id: entityId, details }),
    })
  } catch {}
}

export async function logAuditServer(
  action: string,
  entityType: string,
  entityId?: string,
  details?: Record<string, unknown>
) {
  const { createServerSupabase } = await import('@/lib/supabase/server')
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('audit_logs').insert({
    user_id: user.id,
    action,
    entity_type: entityType,
    entity_id: entityId || null,
    details: details || null,
  })
}
