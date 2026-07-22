'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { t } from '@/lib/i18n'

interface DocStats {
  total: number
  successful: number
  failed: number
  ocrUsed: number
  successRate: number
  totalPages: number
  totalTextLength: number
  typeBreakdown: Record<string, number>
  parserBreakdown: Record<string, number>
  recentLogs: any[]
  days: number
}

export default function AdminDocumentsPage() {
  const router = useRouter()
  const [stats, setStats] = useState<DocStats | null>(null)
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

      const res = await fetch(`/api/admin/documents?days=${days}`)
      if (!res.ok) {
        if (res.status === 403) { router.push('/'); return }
        throw new Error('Failed to fetch')
      }
      const data = await res.json()
      setStats(data)
    } catch (err) {
      console.error('Document stats fetch error:', err)
    }
    setLoading(false)
  }

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
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
            Document Intelligence
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Document parsing &amp; OCR processing stats
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <StatCard label="Total Documents" value={stats.total} color="text-gray-900 dark:text-gray-100" />
            <StatCard label="Successful" value={stats.successful} color="text-green-600 dark:text-green-400" />
            <StatCard label="OCR Used" value={stats.ocrUsed} color="text-blue-600 dark:text-blue-400" />
            <StatCard label="Success Rate" value={`${stats.successRate}%`} color={
              stats.successRate >= 90 ? 'text-green-600 dark:text-green-400' :
              stats.successRate >= 70 ? 'text-yellow-600 dark:text-yellow-400' :
              'text-red-600 dark:text-red-400'
            } />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <StatCard label="Pages Processed" value={stats.totalPages} color="text-purple-600 dark:text-purple-400" />
            <StatCard label="Text Extracted" value={formatBytes(stats.totalTextLength)} color="text-indigo-600 dark:text-indigo-400" />
            <StatCard label="Failed" value={stats.failed} color={stats.failed > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">By Document Type</h2>
              <div className="space-y-2">
                {Object.entries(stats.typeBreakdown).length > 0 ? (
                  Object.entries(stats.typeBreakdown).map(([type, count]) => (
                    <div key={type} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-3 flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100 uppercase">{type}</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">{count}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-400 py-4 text-center">No documents processed yet</p>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">By Parser</h2>
              <div className="space-y-2">
                {Object.entries(stats.parserBreakdown).length > 0 ? (
                  Object.entries(stats.parserBreakdown).map(([parser, count]) => (
                    <div key={parser} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-3 flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{parser}</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">{count}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-400 py-4 text-center">No parsers used yet</p>
                )}
              </div>
            </div>
          </div>

          {stats.recentLogs.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Recent Processing Logs</h2>
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400">
                      <th className="text-left px-3 py-2 font-medium">Type</th>
                      <th className="text-left px-3 py-2 font-medium">Parser</th>
                      <th className="text-left px-3 py-2 font-medium">OCR</th>
                      <th className="text-left px-3 py-2 font-medium">Pages</th>
                      <th className="text-left px-3 py-2 font-medium">Text</th>
                      <th className="text-left px-3 py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentLogs.slice(0, 20).map((log: any, i: number) => (
                      <tr key={i} className="border-b border-gray-100 dark:border-gray-800/50">
                        <td className="px-3 py-2 text-gray-900 dark:text-gray-100 uppercase">{log.document_type}</td>
                        <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{log.parser_used}</td>
                        <td className="px-3 py-2">
                          {log.ocr_used ? (
                            <span className="text-blue-600 dark:text-blue-400">Yes</span>
                          ) : (
                            <span className="text-gray-400">No</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{log.pages_processed}</td>
                        <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{formatBytes(log.text_length)}</td>
                        <td className="px-3 py-2">
                          {log.success ? (
                            <span className="text-green-600 dark:text-green-400">OK</span>
                          ) : (
                            <span className="text-red-600 dark:text-red-400">Error</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
