'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { Users, MessageSquare, MessagesSquare, Activity } from 'lucide-react'
import type { DashboardStats } from '@/types'
import { t } from '@/lib/i18n'

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(data => { setStats(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const cards = [
    { labelKey: 'admin.total_users' as const, value: stats?.total_users ?? 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { labelKey: 'admin.total_messages' as const, value: stats?.total_messages ?? 0, icon: MessageSquare, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { labelKey: 'admin.conversations' as const, value: stats?.total_conversations ?? 0, icon: MessagesSquare, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
    { labelKey: 'admin.active_today' as const, value: stats?.active_today ?? 0, icon: Activity, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20' },
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('admin.dashboard')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <Card key={i}><Skeleton className="h-24" /></Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('admin.dashboard')}</h2>
        <Badge variant="success">{t('admin.system_online')}</Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <Card key={i}>
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${card.bg}`}>
                <card.icon className={`h-6 w-6 ${card.color}`} />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t(card.labelKey)}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{card.value.toLocaleString()}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('admin.quick_actions')}</h3>
          <div className="space-y-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('admin.manage_providers')}
            </p>
          </div>
        </Card>
        <Card>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('admin.system_info')}</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">{t('admin.company_label')}</span>
              <span className="text-gray-900 dark:text-gray-100">{t('admin.company')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t('admin.product_label')}</span>
              <span className="text-gray-900 dark:text-gray-100">{t('app.name')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t('admin.ai_providers')}</span>
              <span className="text-gray-900 dark:text-gray-100">{stats?.provider_count ?? 0} {t('admin.configured')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t('admin.total_api_keys')}</span>
              <span className="text-gray-900 dark:text-gray-100">{stats?.total_keys ?? 0} {t('admin.configured')}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
