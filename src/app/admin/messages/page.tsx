'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils/format'
import { t } from '@/lib/i18n'

export default function AdminMessagesPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { count: total } = await supabase.from('messages').select('*', { count: 'exact', head: true })
      const { count: today } = await supabase
        .from('messages').select('*', { count: 'exact', head: true })
        .gte('created_at', new Date().toISOString().split('T')[0])

      const { data: recent } = await supabase
        .from('messages').select('*').order('created_at', { ascending: false }).limit(50)

      setStats({ total, today, recent })
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64" /></div>

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('admin.messages_heading')}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <p className="text-sm text-gray-500">{t('admin.total')}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{(stats?.total || 0).toLocaleString()}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">{t('admin.today')}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats?.today || 0}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">{t('admin.avg_per_day')}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {stats?.total ? Math.round(stats.total / 30) : 0}
          </p>
        </Card>
      </div>
      <Card>
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">{t('admin.recent_messages')}</h3>
        <div className="space-y-2">
          {(stats?.recent || []).slice(0, 10).map((m: any) => (
            <div key={m.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900">
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${m.role === 'user' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                {m.role}
              </span>
              <p className="text-sm text-gray-600 dark:text-gray-400 flex-1 truncate">{m.content?.slice(0, 100)}</p>
              <span className="text-xs text-gray-400 flex-shrink-0">{formatDate(m.created_at)}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
