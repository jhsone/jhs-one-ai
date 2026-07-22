'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { Key, CheckCircle, XCircle, Clock, Activity } from 'lucide-react'
import { t } from '@/lib/i18n'
import { formatDate } from '@/lib/utils/format'
import type { KeyHealth } from '@/types'

export default function AdminKeysPage() {
  const [data, setData] = useState<{ keys: KeyHealth[]; provider_stats: Record<string, { total: number; active: number }> } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/keys')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64" /></div>

  const providers = data?.provider_stats ? Object.keys(data.provider_stats) : []

  function formatCooldown(ms: number | null): string {
    if (!ms || ms <= 0) return '—'
    const mins = Math.ceil(ms / 60000)
    if (mins < 60) return `${mins}m`
    const hours = Math.floor(mins / 60)
    const rem = mins % 60
    return `${hours}h ${rem}m`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">API Key Monitor</h2>
        <p className="text-sm text-gray-500">
          {data?.keys.length || 0} keys · {providers.length} providers
        </p>
      </div>

      {/* Provider summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {providers.map(provider => {
          const stats = data?.provider_stats?.[provider] || { total: 0, active: 0 }
          return (
            <Card key={provider}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 capitalize">{provider}</h3>
                <Badge variant={stats.active === stats.total ? 'success' : 'warning'}>
                  {stats.active}/{stats.total} active
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Key className="h-4 w-4" />
                <span>{stats.total} key{stats.total !== 1 ? 's' : ''} configured</span>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Detailed key table */}
      <Card>
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Key Health Details</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="text-left py-3 px-3 text-gray-500">Provider</th>
                <th className="text-left py-3 px-3 text-gray-500">Key Index</th>
                <th className="text-left py-3 px-3 text-gray-500">Status</th>
                <th className="text-left py-3 px-3 text-gray-500">Last Used</th>
                <th className="text-left py-3 px-3 text-gray-500">Success</th>
                <th className="text-left py-3 px-3 text-gray-500">Failed</th>
                <th className="text-left py-3 px-3 text-gray-500">Cooldown</th>
                <th className="text-left py-3 px-3 text-gray-500">Avg Response</th>
                <th className="text-left py-3 px-3 text-gray-500">Last Error</th>
              </tr>
            </thead>
            <tbody>
              {data?.keys.map((key) => {
                const now = Date.now()
                const cooldownRemaining = key.cooldownUntil ? Math.max(0, key.cooldownUntil - now) : null
                const isCooling = cooldownRemaining !== null && cooldownRemaining > 0
                return (
                  <tr key={key.id} className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-900/50">
                    <td className="py-2.5 px-3 capitalize font-medium text-gray-900 dark:text-gray-100">{key.provider}</td>
                    <td className="py-2.5 px-3 font-mono text-xs text-gray-600 dark:text-gray-400">
                      #{key.index}
                    </td>
                    <td className="py-2.5 px-3">
                      {isCooling ? (
                        <span className="inline-flex items-center gap-1 text-yellow-600 dark:text-yellow-400 text-xs font-medium">
                          <Clock className="h-3 w-3" /> Cooldown
                        </span>
                      ) : key.failureCount > 0 && key.successCount === 0 ? (
                        <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 text-xs font-medium">
                          <XCircle className="h-3 w-3" /> Failed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 text-xs font-medium">
                          <CheckCircle className="h-3 w-3" /> Active
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-gray-500 text-xs">{key.lastUsed ? formatDate(new Date(key.lastUsed)) : 'Never'}</td>
                    <td className="py-2.5 px-3 text-green-600 text-xs font-medium">{key.successCount}</td>
                    <td className="py-2.5 px-3 text-red-600 text-xs font-medium">{key.failureCount}</td>
                    <td className="py-2.5 px-3 text-xs text-gray-600 dark:text-gray-400">
                      {isCooling ? (
                        <span className="inline-flex items-center gap-1">
                          <Activity className="h-3 w-3 text-yellow-500" />
                          {formatCooldown(cooldownRemaining)}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-xs text-gray-600 dark:text-gray-400">
                      {key.avgResponseTime !== null ? `${key.avgResponseTime}ms` : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-red-500 text-xs max-w-[200px] truncate" title={key.lastError || ''}>
                      {key.lastError || '—'}
                    </td>
                  </tr>
                )
              })}
              {(!data?.keys || data.keys.length === 0) && (
                <tr><td colSpan={9} className="py-8 text-center text-gray-400">No API keys configured</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
