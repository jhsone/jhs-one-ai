'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { createClient } from '@/lib/supabase/client'

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(d => { setSettings(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const toggleProvider = async (provider: string) => {
    const current: string[] = settings.active_providers || ['gemini', 'groq', 'openrouter', 'simbanova']
    const updated = current.includes(provider)
      ? current.filter(p => p !== provider)
      : [...current, provider]

    setSaving(true)
    await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'active_providers', value: updated }),
    })
    setSettings(prev => ({ ...prev, active_providers: updated }))
    setSaving(false)
    setMessage(`Provider ${provider} ${current.includes(provider) ? 'disabled' : 'enabled'}`)
    setTimeout(() => setMessage(''), 3000)
  }

  if (loading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64" /></div>

  const providers = [
    { id: 'gemini', name: 'Gemini', keys: 10 },
    { id: 'groq', name: 'Groq', keys: 10 },
    { id: 'openrouter', name: 'OpenRouter', keys: 5 },
    { id: 'simbanova', name: 'Simbanova', keys: 2 },
  ]

  const activeProviders: string[] = settings.active_providers || providers.map(p => p.id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h2>
        {message && <Badge variant="success">{message}</Badge>}
      </div>

      <Card>
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">AI Providers</h3>
        <p className="text-sm text-gray-500 mb-4">Toggle AI providers on/off. Disabled providers will be skipped during routing.</p>
        <div className="space-y-3">
          {providers.map(p => {
            const isActive = activeProviders.includes(p.id)
            return (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.keys} API keys</p>
                  </div>
                </div>
                <Button
                  variant={isActive ? 'danger' : 'primary'}
                  size="sm"
                  onClick={() => toggleProvider(p.id)}
                  disabled={saving}
                >
                  {isActive ? 'Disable' : 'Enable'}
                </Button>
              </div>
            )
          })}
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Admin Access</h3>
        <p className="text-sm text-gray-500 mb-2">Configure which email addresses have admin access.</p>
        <p className="text-sm text-gray-400">
          Current admins: {(settings.admin_emails as string[] || []).join(', ') || 'None configured'}
        </p>
        <p className="text-xs text-gray-400 mt-2">
          Update admin emails directly in the Supabase dashboard: app_settings table &gt; key: admin_emails
        </p>
      </Card>
    </div>
  )
}
