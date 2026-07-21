'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { t } from '@/lib/i18n'

export default function AdminProvidersPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/providers')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64" /></div>

  const providerIcons: Record<string, string> = {
    gemini: '🔵', groq: '🟢', openrouter: '🟣', simbanova: '🟠'
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('admin.ai_providers')}</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {data?.provider_stats && Object.entries(data.provider_stats).map(([name, stats]: [string, any]) => (
          <Card key={name}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{providerIcons[name] || '🤖'}</span>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 capitalize">{name}</h3>
              </div>
              <Badge variant={stats.failed > stats.total * 0.1 ? 'danger' : 'success'}>
                {stats.success}/{stats.total} {t('admin.enabled')}
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <p className="text-gray-500">{t('admin.provider_status')}</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">{stats.success}</p>
              </div>
              <div>
                <p className="text-gray-500">{t('admin.errors')}</p>
                <p className="font-medium text-red-600">{stats.failed}</p>
              </div>
              <div>
                <p className="text-gray-500">{t('admin.rate_limits')}</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">{stats.avgTime}ms</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">{t('admin.key_summary')}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {data?.key_stats && Object.entries(data.key_stats).map(([name, stats]: [string, any]) => (
            <div key={name} className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
              <p className="text-sm text-gray-500 capitalize">{name}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{stats.active}/{stats.total}</p>
              <p className="text-xs text-gray-400">{t('admin.keys_active')}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
