'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { LayoutDashboard, Users, MessageSquare, Key, Settings, AlertTriangle, BarChart3, Activity, Paperclip, Eye, LogOut, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { t } from '@/lib/i18n'
import { AiAvatar } from '@/components/shared/AiAvatar'

const navItems = [
  { href: '/admin', labelKey: 'admin.dashboard' as const, icon: LayoutDashboard },
  { href: '/admin/users', labelKey: 'admin.users' as const, icon: Users },
  { href: '/admin/messages', labelKey: 'admin.messages' as const, icon: MessageSquare },
  { href: '/admin/providers', labelKey: 'admin.providers' as const, icon: BarChart3 },
  { href: '/admin/provider-health', labelKey: 'admin.provider_health' as const, icon: Activity },
  { href: '/admin/vision', labelKey: 'admin.vision' as const, icon: Eye },
  { href: '/admin/keys', labelKey: 'admin.keys' as const, icon: Key },
  { href: '/admin/attachments', labelKey: 'admin.attachments' as const, icon: Paperclip },
  { href: '/admin/error-logs', labelKey: 'admin.error_logs' as const, icon: AlertTriangle },
  { href: '/admin/settings', labelKey: 'admin.settings' as const, icon: Settings },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const check = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'admin_emails')
        .single()

      const emails: string[] = data?.value as unknown as string[] || []
      if (!emails.includes(user.email!)) {
        router.push('/chat')
        return
      }
      setIsAdmin(true)
    }
    check()
  }, [router])

  if (isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Mobile hamburger */}
      <button
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-white dark:bg-gray-900 shadow-md"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle sidebar"
      >
        {sidebarOpen ? <X className="h-5 w-5 text-gray-700 dark:text-gray-300" /> : <Menu className="h-5 w-5 text-gray-700 dark:text-gray-300" />}
      </button>

      <aside className={cn(
        'w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col',
        'fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 lg:relative lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <AiAvatar size={32} />
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">{t('admin.admin_header')}</h1>
              <p className="text-xs text-gray-500">{t('admin.company')}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                pathname === item.href
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              )}
            >
              <item.icon className="h-4 w-4" />
              {t(item.labelKey)}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-200 dark:border-gray-800">
          <Link
            href="/chat"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <LogOut className="h-4 w-4" />
            {t('admin.back_to_chat')}
          </Link>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        {children}
      </main>
    </div>
  )
}
