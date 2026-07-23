'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatDate } from '@/lib/utils/format'
import { createClient } from '@/lib/supabase/client'
import { History, Filter } from 'lucide-react'

interface AuditLog {
  id: number
  user_id: string | null
  action: string
  entity_type: string
  entity_id: string | null
  details: Record<string, unknown> | null
  ip_address: string | null
  created_at: string
}

const ACTION_VARIANTS: Record<string, 'default' | 'success' | 'danger' | 'warning'> = {
  create: 'success',
  update: 'warning',
  delete: 'danger',
  login: 'success',
  logout: 'default',
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      setLogs(data || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64" /></div>

  const actions = [...new Set(logs.map(l => l.action))]
  const filtered = filter === 'all' ? logs : logs.filter(l => l.action === filter)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <History className="h-5 w-5 text-gray-500" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Audit Log</h2>
          <Badge variant="default">{logs.length} entries</Badge>
        </div>

        {actions.length > 0 && (
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 overflow-x-auto">
            <button
              onClick={() => setFilter('all')}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                filter === 'all'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Filter className="h-3 w-3" /> All
            </button>
            {actions.map(action => (
              <button
                key={action}
                onClick={() => setFilter(action)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize whitespace-nowrap transition-colors ${
                  filter === action
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {action}
              </button>
            ))}
          </div>
        )}
      </div>

      <Card>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <History className="h-12 w-12 mb-3" />
            <p>No audit log entries found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left py-3 px-3 text-gray-500">Date & Time</th>
                  <th className="text-left py-3 px-3 text-gray-500">User</th>
                  <th className="text-left py-3 px-3 text-gray-500">Action</th>
                  <th className="text-left py-3 px-3 text-gray-500">Entity</th>
                  <th className="text-left py-3 px-3 text-gray-500">ID</th>
                  <th className="text-left py-3 px-3 text-gray-500">IP</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log) => (
                  <tr key={log.id} className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-900/50">
                    <td className="py-2.5 px-3 text-gray-500 whitespace-nowrap text-xs">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="py-2.5 px-3 text-gray-600 dark:text-gray-400 text-xs font-mono max-w-[100px] truncate">
                      {log.user_id ? `${log.user_id.slice(0, 8)}...` : '—'}
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge variant={ACTION_VARIANTS[log.action] || 'default'}>
                        {log.action}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 text-gray-700 dark:text-gray-300 text-xs capitalize">
                      {log.entity_type.replace(/_/g, ' ')}
                    </td>
                    <td className="py-2.5 px-3 text-gray-500 text-xs font-mono max-w-[120px] truncate" title={log.entity_id || ''}>
                      {log.entity_id ? log.entity_id.slice(0, 16) + '...' : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-gray-500 text-xs">
                      {log.ip_address || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
