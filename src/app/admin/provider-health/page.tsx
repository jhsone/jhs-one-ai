'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatDate } from '@/lib/utils/format'
import { Activity, CheckCircle, XCircle, Clock, AlertTriangle, Zap } from 'lucide-react'
import type { ProviderHealth } from '@/types'

const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'default'; icon: typeof Activity }> = {
  healthy: { label: 'Healthy', variant: 'success', icon: CheckCircle },
  degraded: { label: 'Degraded', variant: 'warning', icon: AlertTriangle },
  cooldown: { label: 'Cooldown', variant: 'danger', icon: Clock },
  offline: { label: 'Offline', variant: 'default', icon: XCircle },
}

const providerIcons: Record<string, string> = {
  gemini: '🔵', groq: '🟢', openrouter: '🟣', simbanova: '🟠',
}

export default function AdminProviderHealthPage() {
  const [providers, setProviders] = useState<ProviderHealth[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/provider-health')
      .then(r => r.json())
      .then(d => { setProviders(d.providers || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Provider Health</h2>
        <Badge variant="success">{providers.filter(p => p.status === 'healthy').length} healthy</Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {providers.map(p => {
          const cfg = statusConfig[p.status] || statusConfig.offline
          const Icon = cfg.icon
          return (
            <Card key={p.provider}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{providerIcons[p.provider] || '🤖'}</span>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 capitalize">{p.provider}</h3>
                </div>
                <Badge variant={cfg.variant}>
                  <Icon className="h-3 w-3 mr-1 inline" />
                  {cfg.label}
                </Badge>
              </div>

              {/* Health score bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-500">Health Score</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{p.healthScore}%</span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      p.healthScore >= 70 ? 'bg-green-500' : p.healthScore >= 30 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${p.healthScore}%` }}
                  />
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-900">
                  <p className="text-gray-500 text-xs">Avg Response</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {p.avgResponseTime ? `${p.avgResponseTime}ms` : '—'}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-900">
                  <p className="text-gray-500 text-xs">Requests</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{p.totalRequests}</p>
                </div>
                <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-900">
                  <p className="text-gray-500 text-xs">Success %</p>
                  <p className="font-semibold text-green-600">{p.successRate}%</p>
                </div>
                <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-900">
                  <p className="text-gray-500 text-xs">Failed %</p>
                  <p className="font-semibold text-red-600">{p.failureRate}%</p>
                </div>
              </div>

              {/* Details */}
              <div className="mt-3 space-y-1 text-xs text-gray-500">
                <div className="flex justify-between">
                  <span>Success / Failed</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">{p.successCount} / {p.failureCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Consecutive Failures</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">{p.consecutiveFailures}</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Used</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">{p.lastUsed ? formatDate(new Date(p.lastUsed)) : 'Never'}</span>
                </div>
                {p.lastError && (
                  <div className="flex justify-between">
                    <span>Last Error</span>
                    <span className="font-medium text-red-500 max-w-[200px] truncate" title={p.lastError}>{p.lastError}</span>
                  </div>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      {providers.length === 0 && (
        <Card>
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Zap className="h-12 w-12 mb-3" />
            <p>No provider health data available</p>
          </div>
        </Card>
      )}
    </div>
  )
}
