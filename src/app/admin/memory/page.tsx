'use client'

import React, { useState, useEffect } from 'react'
import { Brain, Database, Activity, Sparkles, Loader2, Users, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface MemoryStats {
  totalMemories: number
  totalLogs: number
  recentMemories: any[]
  categoryCounts: Record<string, number>
  averageMemoriesPerUser: number
}

export default function AdminMemoryManagerPage() {
  const [stats, setStats] = useState<MemoryStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchAdminMemoryStats = async () => {
      try {
        setLoading(true)
        // Fetch memories count & recent
        const { data: memories, error: memErr } = await supabase
          .from('memories')
          .select('*')
          .order('created_at', { ascending: false })

        if (memErr) throw memErr

        const { data: logs, error: logErr } = await supabase
          .from('memory_usage_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50)

        if (logErr) throw logErr

        const { count: userCount, error: userErr } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })

        const totalMemories = memories?.length || 0
        const categoryCounts: Record<string, number> = {}
        memories?.forEach(m => {
          categoryCounts[m.category_id] = (categoryCounts[m.category_id] || 0) + 1
        })

        const avg = userCount && userCount > 0 ? (totalMemories / userCount).toFixed(1) : totalMemories.toString()

        setStats({
          totalMemories,
          totalLogs: logs?.length || 0,
          recentMemories: memories?.slice(0, 10) || [],
          categoryCounts,
          averageMemoriesPerUser: parseFloat(avg),
        })
      } catch (err) {
        setError((err as Error).message)
      } finally {
        setLoading(false)
      }
    }

    fetchAdminMemoryStats()
  }, [])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-600">
        <p>Error loading memory manager statistics: {error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Brain className="h-7 w-7 text-blue-600" />
            Memory Manager & Analytics
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            System-wide long-term memory metrics and audit telemetry.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
            <span className="text-xs font-medium uppercase tracking-wider">Total Memories</span>
            <Database className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats?.totalMemories}</p>
        </div>

        <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
            <span className="text-xs font-medium uppercase tracking-wider">Avg Memories / User</span>
            <Users className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats?.averageMemoriesPerUser}</p>
        </div>

        <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
            <span className="text-xs font-medium uppercase tracking-wider">Categories Active</span>
            <Sparkles className="h-5 w-5 text-purple-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{Object.keys(stats?.categoryCounts || {}).length}</p>
        </div>

        <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
            <span className="text-xs font-medium uppercase tracking-wider">Telemetry Logs</span>
            <Activity className="h-5 w-5 text-amber-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats?.totalLogs}</p>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Memories by Category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {Object.entries(stats?.categoryCounts || {}).map(([cat, count]) => (
            <div key={cat} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 space-y-1">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 capitalize">{cat}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{count}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Memories Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Recent System Memories</h2>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-800">
          {stats?.recentMemories.map(mem => (
            <div key={mem.id} className="p-4 flex items-center justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                    {mem.category_id}
                  </span>
                  <span className="text-xs text-gray-400 font-mono">user: {mem.user_id.slice(0, 8)}...</span>
                </div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{mem.key}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300 truncate">{mem.value}</p>
              </div>
              <div className="text-xs text-gray-400 whitespace-nowrap">
                {new Date(mem.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
