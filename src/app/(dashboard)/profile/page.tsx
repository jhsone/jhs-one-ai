'use client'

import { useAuth } from '@/components/shared/AuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { User, Mail, Calendar, Key, Layers, Smartphone, LogOut, Edit3, Loader2, Sparkles, Globe, Moon, MessageSquare, MessageCircle, BarChart3, Upload, Camera, Check, BookOpen, Hash, TrendingUp, Clock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { t } from '@/lib/i18n'
import { useAppStore } from '@/store/app-store'
import { useTheme } from '@/components/shared/ThemeProvider'

export default function ProfilePage() {
  const { session, isLoading } = useAuth()
  const router = useRouter()
  const { language } = useAppStore()
  const { theme } = useTheme()
  const supabase = createClient()

  const [usageStats, setUsageStats] = useState<{
    conversations: { total: number; today: number; thisMonth: number }
    messages: { total: number; today: number; thisMonth: number }
  } | null>(null)

  const [convStats, setConvStats] = useState<{
    summary: { totalConversations: number; totalMessages: number; totalWords: number; avgMessagesPerConversation: number; avgWordsPerConversation: number }
    dayDistribution: Record<string, number>
    timeDistribution: Record<string, number>
    topConversations: { id: string; title: string; totalMessages: number; totalWords: number }[]
  } | null>(null)

  useEffect(() => {
    fetch('/api/usage/stats').then(r => r.json()).then(setUsageStats).catch(() => {})
    fetch('/api/conversations/stats').then(r => r.json()).then(setConvStats).catch(() => {})
  }, [])

  useEffect(() => {
    if (!isLoading && !session) router.push('/login')
  }, [isLoading, session, router])

  if (isLoading || !session) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const user = session.user
  const avatarUrl = user.user_metadata?.avatar_url
  const displayName = user.user_metadata?.full_name
  const email = user.email
  const createdAt = user.created_at
  const joinDate = createdAt
    ? new Date(createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Unknown'

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const sections = [
    {
      title: t('profile.connected_providers'),
      items: [
        { icon: Mail, label: 'Google', value: email, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30' },
      ],
    },
    {
      title: t('profile.coming_soon'),
      items: [
        { icon: Key, label: t('profile.api_keys'), value: '', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/30' },
        { icon: Layers, label: t('profile.usage'), value: '', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
        { icon: Smartphone, label: t('profile.devices'), value: '', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/30' },
      ],
    },
  ]

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Profile header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden ring-4 ring-white dark:ring-gray-950 shadow-lg mb-4">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-white">
                {displayName?.[0] || email?.[0] || 'U'}
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {displayName || 'User'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{email}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300">
              <Sparkles className="h-3 w-3" />
              {t('profile.free_plan')}
            </span>
          </div>
        </div>

        {/* AI Avatar Upload */}
        <div className="mb-6 bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">AI Avatar</h3>
              <p className="text-xs text-gray-500 mt-0.5">Customize the AI assistant avatar</p>
            </div>
            <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors">
              <Upload className="h-3.5 w-3.5" />
              Upload
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  const formData = new FormData()
                  formData.append('file', file)
                  try {
                    const res = await fetch('/api/avatar', { method: 'POST', body: formData })
                    if (res.ok) window.location.reload()
                  } catch {}
                }}
              />
            </label>
          </div>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
              <Calendar className="h-3.5 w-3.5" />
              {t('profile.member_since')}
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{joinDate}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
              <User className="h-3.5 w-3.5" />
              {t('profile.user_id')}
            </div>
            <p className="text-xs font-mono text-gray-900 dark:text-gray-100 truncate">{user.id}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
              <Globe className="h-3.5 w-3.5" />
              {t('profile.language')}
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">{language === 'bn' ? 'বাংলা' : 'English'}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
              <Moon className="h-3.5 w-3.5" />
              {t('profile.theme')}
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">{theme}</p>
          </div>
        </div>

        {/* Usage Stats */}
        {usageStats && (
          <div className="mb-6">
            <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-1">
              <BarChart3 className="h-3.5 w-3.5 inline mr-1" />
              Usage
            </h2>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{usageStats.messages.total}</p>
                <p className="text-xs text-gray-500">Total Messages</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{usageStats.messages.today}</p>
                <p className="text-xs text-gray-500">Today</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{usageStats.conversations.total}</p>
                <p className="text-xs text-gray-500">Conversations</p>
              </div>
            </div>
          </div>
        )}

        {/* Conversation Stats */}
        {convStats && (
          <div className="mb-6">
            <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-1">
              <BookOpen className="h-3.5 w-3.5 inline mr-1" />
              Conversation Analytics
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{convStats.summary.totalConversations}</p>
                <p className="text-xs text-gray-500">Conversations</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{convStats.summary.totalWords.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Total Words</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{convStats.summary.avgMessagesPerConversation}</p>
                <p className="text-xs text-gray-500">Avg Msgs/Conv</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{convStats.summary.avgWordsPerConversation}</p>
                <p className="text-xs text-gray-500">Avg Words/Conv</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
                <p className="text-xs text-gray-500 mb-2"><Clock className="h-3 w-3 inline mr-1" />By Time of Day</p>
                <div className="space-y-1">
                  {Object.entries(convStats.timeDistribution).sort(([,a], [,b]) => b - a).map(([time, count]) => (
                    <div key={time} className="flex items-center gap-2">
                      <span className="text-xs text-gray-600 dark:text-gray-400 capitalize w-20">{time}</span>
                      <div className="flex-1 h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                        <div className="h-full rounded-full bg-blue-500" style={{ width: `${(count / Math.max(...Object.values(convStats.timeDistribution))) * 100}%` }} />
                      </div>
                      <span className="text-xs font-medium text-gray-900 dark:text-gray-100 w-6 text-right">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
                <p className="text-xs text-gray-500 mb-2"><Hash className="h-3 w-3 inline mr-1" />Top Conversations</p>
                <div className="space-y-1.5">
                  {convStats.topConversations.slice(0, 5).map((conv) => (
                    <div key={conv.id} className="flex items-center justify-between">
                      <span className="text-xs text-gray-700 dark:text-gray-300 truncate flex-1 mr-2">{conv.title || 'Untitled'}</span>
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 shrink-0">{conv.totalMessages} msgs</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Connected providers / coming soon sections */}
        {sections.map((section) => (
          <div key={section.title} className="mb-6">
            <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-1">
              {section.title}
            </h2>
            <div className="space-y-2">
              {section.items.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900 rounded-xl px-4 py-3 border border-gray-200 dark:border-gray-800"
                >
                  <div className={`p-2 rounded-lg ${item.bg}`}>
                    <item.icon className={`h-4 w-4 ${item.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.label}</p>
                    {item.value && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          <Button
            variant="secondary"
            className="flex-1 gap-2"
            onClick={() => router.push('/settings')}
          >
            <Edit3 className="h-4 w-4" />
            {t('profile.edit_profile')}
          </Button>
          <Button
            variant="danger"
            className="flex-1 gap-2"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            {t('profile.logout')}
          </Button>
        </div>
      </div>
    </div>
  )
}
