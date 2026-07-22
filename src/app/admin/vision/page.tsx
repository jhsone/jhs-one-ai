'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { t } from '@/lib/i18n'

interface VisionStats {
  total: number
  success: number
  failed: number
  successRate: number
  avgResponseTime: number
  providerBreakdown: Record<string, { total: number; success: number; failed: number }>
  recentLogs: any[]
  days: number
}

export default function AdminVisionPage() {
  const router = useRouter()
  const [stats, setStats] = useState<VisionStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(7)

  useEffect(() => {
    fetchStats()
  }, [days])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const res = await fetch(`/api/admin/vision?days=${days}`)
      if (!res.ok) {
        if (res.status === 403) { router.push('/'); return }
        throw new Error('Failed to fetch')
      }
      const data = await res.json()
      setStats(data)
    } catch (err) {
      console.error('Vision stats fetch error:', err)
    }
    setLoading(false)
  }

  const StatCard = ({ label, value, color }: { label: string; value: string | number; color: string }) => (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-5">
      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <p className={`text-xl sm:text-2xl font-bold ${color}`}>{value}</p>
    </div>
  )

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">
            Vision Engine
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Image-aware AI request stats
          </p>
        </div>

        <select
          value={days}
          onChange={(e) => setDays(parseInt(e.target.value))}
          className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"
        >
          <option value={1}>Last 24 hours</option>
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">{t('app.loading')}</div>
      ) : !stats ? (
        <div className="text-center py-12 text-gray-400">{t('admin.no_data')}</div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <StatCard label="Total Requests" value={stats.total} color="text-gray-900 dark:text-gray-100" />
            <StatCard label="Successful" value={stats.success} color="text-green-600 dark:text-green-400" />
            <StatCard label="Failed" value={stats.failed} color="stats.failed > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'" />
            <StatCard label="Success Rate" value={`${stats.successRate}%`} color={
              stats.successRate >= 90 ? 'text-green-600 dark:text-green-400' :
              stats.successRate >= 70 ? 'text-yellow-600 dark:text-yellow-400' :
              'text-red-600 dark:text-red-400'
            } />
          </div>

          {/* Avg response time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-5">
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">Avg Response Time</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.avgResponseTime}ms
              </p>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-5">
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">Time Range</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.days} days
              </p>
            </div>
          </div>

          {/* Provider breakdown */}
          <div>
            <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Provider Breakdown</h2>
            <div className="space-y-2">
              {Object.entries(stats.providerBreakdown).length > 0 ? (
                Object.entries(stats.providerBreakdown).map(([provider, data]) => (
                  <div key={provider} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-3 sm:p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">{provider}</p>
                      <p className="text-xs text-gray-500">{data.total} requests</p>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm">
                      <span className="text-green-600 dark:text-green-400">{data.success} ok</span>
                      {data.failed > 0 && (
                        <span className="text-red-600 dark:text-red-400">{data.failed} err</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400 py-4 text-center">No vision requests recorded yet</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
