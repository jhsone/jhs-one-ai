'use client'

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/sidebar/Sidebar'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { LanguageSelector } from '@/components/shared/LanguageSelector'
import { AiAvatar } from '@/components/shared/AiAvatar'
import { MobileNav } from '@/components/navigation/MobileNav'
import { Menu } from 'lucide-react'
import { useAppStore } from '@/store/app-store'
import { useAuth } from '@/components/shared/AuthProvider'
import { Loader2 } from 'lucide-react'
import { t } from '@/lib/i18n'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { session, isLoading } = useAuth()
  const sidebarOpen = useAppStore((s) => s.sidebarOpen)
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen)

  useEffect(() => {
    if (!isLoading && !session) router.push('/')
  }, [isLoading, session, router])

  const closeSidebar = useCallback(() => setSidebarOpen(false), [setSidebarOpen])
  const openSidebar = useCallback(() => setSidebarOpen(true), [setSidebarOpen])

  if (isLoading || !session) {
    return (
      <div className="h-full flex items-center justify-center bg-white dark:bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="h-full flex bg-white dark:bg-gray-950 overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar - mobile: slide-in overlay, desktop: always visible */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-72
          transform transition-transform duration-200 ease-in-out
          md:relative md:translate-x-0 md:z-0
          flex flex-col bg-gray-50 dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <Sidebar />
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 max-w-full">
        {/* Header */}
        <header className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-2 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 z-10">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={openSidebar}
              className="p-1.5 -ml-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 md:hidden flex-shrink-0"
              aria-label={t('app.open_menu')}
            >
              <Menu className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </button>
            <AiAvatar size={28} />
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">JHS One Ai</span>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <LanguageSelector />
            <ThemeToggle />
          </div>
        </header>

        {/* Chat content */}
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden pb-14 md:pb-0">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobileNav />
    </div>
  )
}
