'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/shared/AuthProvider'
import { t } from '@/lib/i18n'
import { useAppStore, type Lang } from '@/store/app-store'
import { Check } from 'lucide-react'

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const { language, setLanguage } = useAppStore()
  const { session } = useAuth()

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

  const handleLanguageChange = async (lang: Lang) => {
    setLanguage(lang)
    if (session?.user) {
      const supabase = createClient()
      await supabase.from('profiles').upsert({
        id: session.user.id,
        preferred_lang: lang,
      })
    }
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
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('admin.settings')}</h2>
        {message && <Badge variant="success">{message}</Badge>}
      </div>

      <Card>
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('admin.ai_providers')}</h3>
        <p className="text-sm text-gray-500 mb-4">{t('admin.toggle_providers')}</p>
        <div className="space-y-3">
          {providers.map(p => {
            const isActive = activeProviders.includes(p.id)
            return (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.keys} {t('admin.api_keys_label')}</p>
                  </div>
                </div>
                <Button
                  variant={isActive ? 'danger' : 'primary'}
                  size="sm"
                  onClick={() => toggleProvider(p.id)}
                  disabled={saving}
                >
                  {isActive ? t('admin.disabled') : t('admin.enabled')}
                </Button>
              </div>
            )
          })}
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('language.select_language')}</h3>
        <p className="text-sm text-gray-500 mb-4">{t('language.change')}</p>
        <div className="flex gap-3">
          {(['en', 'bn'] as Lang[]).map((code) => (
            <button
              key={code}
              onClick={() => handleLanguageChange(code)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                language === code
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              {language === code && <Check className="h-4 w-4" />}
              <span className="text-sm font-medium">{code === 'en' ? t('language.en') : t('language.bn')}</span>
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('admin.admin_access')}</h3>
        <p className="text-sm text-gray-500 mb-2">{t('admin.admin_access_desc')}</p>
        <p className="text-sm text-gray-400">
          {t('admin.current_admins')} {(settings.admin_emails as string[] || []).join(', ') || t('admin.none_configured')}
        </p>
        <p className="text-xs text-gray-400 mt-2">
          {t('admin.update_admin_hint')}
        </p>
      </Card>
    </div>
  )
}
