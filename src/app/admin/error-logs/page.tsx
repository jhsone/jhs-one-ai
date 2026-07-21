'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatDate } from '@/lib/utils/format'
import { createClient } from '@/lib/supabase/client'
import { AlertTriangle } from 'lucide-react'
import { t } from '@/lib/i18n'

export default function AdminErrorLogsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('provider_logs')
        .select('*')
        .eq('success', false)
        .order('created_at', { ascending: false })
        .limit(100)

      setLogs(data || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('admin.error_logs_heading')}</h2>
        <Badge variant="danger">{logs.length} {t('admin.errors')}</Badge>
      </div>

      <Card>
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <AlertTriangle className="h-12 w-12 mb-3" />
            <p>{t('admin.no_errors')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left py-3 px-4 text-gray-500">{t('admin.provider')}</th>
                  <th className="text-left py-3 px-4 text-gray-500">{t('admin.error')}</th>
                  <th className="text-left py-3 px-4 text-gray-500">{t('admin.time')}</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log: any) => (
                  <tr key={log.id} className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-900/50">
                    <td className="py-3 px-4">
                      <Badge variant="danger" className="capitalize">{log.provider}</Badge>
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400 max-w-md truncate">
                      {log.error_message || t('admin.unknown_error')}
                    </td>
                    <td className="py-3 px-4 text-gray-500 whitespace-nowrap">{formatDate(log.created_at)}</td>
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
