'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils/format'
import type { Profile } from '@/types'
import { t } from '@/lib/i18n'

export default function AdminUsersPage() {
  const [profiles, setProfiles] = useState<(Profile & { email?: string })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (data) setProfiles(data as any)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64" /></div>

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('admin.users_heading')}</h2>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="text-left py-3 px-4 text-gray-500 font-medium">{t('admin.name')}</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">{t('admin.joined')}</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map(p => (
                <tr key={p.id} className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-900/50">
                  <td className="py-3 px-4 text-gray-900 dark:text-gray-100">{p.display_name || t('admin.no_data')}</td>
                  <td className="py-3 px-4 text-gray-500">{formatDate(p.created_at)}</td>
                </tr>
              ))}
              {profiles.length === 0 && (
                <tr><td colSpan={2} className="py-8 text-center text-gray-400">{t('admin.no_users')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
