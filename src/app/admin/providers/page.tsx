'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { t } from '@/lib/i18n'
import { formatDate } from '@/lib/utils/format'

const providerIcons: Record<string, string> = {
  gemini: '🔵', groq: '🟢', openrouter: '🟣', simbanova: '🟠',
}

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

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('admin.ai_providers')}</h2>

      {/* Provider stat cards */}
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
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-900">
                <p className="text-gray-500 text-xs">{t('admin.total_messages')}</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100">{stats.total}</p>
              </div>
              <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-900">
                <p className="text-gray-500 text-xs">{t('admin.provider_status')}</p>
                <p className="font-semibold text-green-600">{stats.success}</p>
              </div>
              <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-900">
                <p className="text-gray-500 text-xs">{t('admin.errors')}</p>
                <p className="font-semibold text-red-600">{stats.failed}</p>
              </div>
              <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-900">
                <p className="text-gray-500 text-xs">Avg Response</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100">{stats.avgResponseTime}ms</p>
              </div>
            </div>
            {stats.lastUsed && (
              <p className="text-xs text-gray-400 mt-2">
                Last used: {formatDate(stats.lastUsed)}
              </p>
            )}
            {stats.models.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {stats.models.map((m: string) => (
                  <span key={m} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500">
                    {m}
                  </span>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Key summary */}
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

      {/* Detailed logs table */}
      <Card>
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Recent Activity</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="text-left py-3 px-3 text-gray-500">Date</th>
                <th className="text-left py-3 px-3 text-gray-500">Provider</th>
                <th className="text-left py-3 px-3 text-gray-500">Model</th>
                <th className="text-left py-3 px-3 text-gray-500">Status</th>
                <th className="text-left py-3 px-3 text-gray-500">Time</th>
                <th className="text-left py-3 px-3 text-gray-500">Error</th>
              </tr>
            </thead>
            <tbody>
              {(data?.logs || []).slice(0, 50).map((log: any) => (
                <tr key={log.id} className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-900/50">
                  <td className="py-2.5 px-3 text-gray-500 whitespace-nowrap text-xs">{formatDate(log.created_at)}</td>
                  <td className="py-2.5 px-3 capitalize">{log.provider}</td>
                  <td className="py-2.5 px-3 text-gray-600 dark:text-gray-400 text-xs font-mono">{log.model || '—'}</td>
                  <td className="py-2.5 px-3">
                    <Badge variant={log.status === 'success' || log.success ? 'success' : 'danger'} className="text-[10px]">
                      {log.status || (log.success ? 'success' : 'failed')}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-3 text-gray-600 dark:text-gray-400 text-xs">
                    {log.response_time || log.response_time_ms || '—'}ms
                  </td>
                  <td className="py-2.5 px-3 text-red-500 text-xs max-w-[200px] truncate">
                    {log.error_message || '—'}
                  </td>
                </tr>
              ))}
              {(data?.logs || []).length === 0 && (
                <tr><td colSpan={6} className="py-8 text-center text-gray-400">No logs yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
