'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatDate } from '@/lib/utils/format'
import { createClient } from '@/lib/supabase/client'
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { t } from '@/lib/i18n'

export default function AdminErrorLogsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'success' | 'failed'>('all')

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('provider_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200)

      setLogs(data || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64" /></div>

  const filtered = filter === 'all' ? logs : logs.filter(l => {
    const status = l.status || (l.success ? 'success' : 'failed')
    return status === filter
  })
  const errorCount = logs.filter(l => {
    const status = l.status || (l.success ? 'success' : 'failed')
    return status === 'failed'
  }).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Provider Logs</h2>
          <Badge variant="danger">{errorCount} errors</Badge>
          <Badge variant="success">{logs.length - errorCount} success</Badge>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
          {(['all', 'success', 'failed'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                filter === f
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {f === 'all' ? 'All' : f === 'success' ? 'Success' : 'Failed'}
            </button>
          ))}
        </div>
      </div>

      <Card>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <AlertTriangle className="h-12 w-12 mb-3" />
            <p>{t('admin.no_errors')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left py-3 px-3 text-gray-500">Date &amp; Time</th>
                  <th className="text-left py-3 px-3 text-gray-500">User</th>
                  <th className="text-left py-3 px-3 text-gray-500">Provider</th>
                  <th className="text-left py-3 px-3 text-gray-500">Model</th>
                  <th className="text-left py-3 px-3 text-gray-500">Status</th>
                  <th className="text-left py-3 px-3 text-gray-500">Response Time</th>
                  <th className="text-left py-3 px-3 text-gray-500">Error</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log: any) => {
                  const status = log.status || (log.success ? 'success' : 'failed')
                  return (
                    <tr key={log.id} className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-900/50">
                      <td className="py-2.5 px-3 text-gray-500 whitespace-nowrap text-xs">{formatDate(log.created_at)}</td>
                      <td className="py-2.5 px-3 text-gray-600 dark:text-gray-400 text-xs font-mono max-w-[120px] truncate">
                        {log.user_id ? `${log.user_id.slice(0, 8)}...` : '—'}
                      </td>
                      <td className="py-2.5 px-3 capitalize font-medium">{log.provider}</td>
                      <td className="py-2.5 px-3 text-gray-600 dark:text-gray-400 text-xs font-mono">{log.model || '—'}</td>
                      <td className="py-2.5 px-3">
                        {status === 'success' ? (
                          <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 text-xs font-medium">
                            <CheckCircle className="h-3 w-3" /> Success
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 text-xs font-medium">
                            <XCircle className="h-3 w-3" /> Failed
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-gray-600 dark:text-gray-400 text-xs">
                        {log.response_time || log.response_time_ms ? `${log.response_time || log.response_time_ms}ms` : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-red-500 text-xs max-w-[250px] truncate" title={log.error_message || ''}>
                        {log.error_message || '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
