'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/sidebar/Sidebar'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { LanguageToggle } from '@/components/shared/LanguageToggle'
import { useAppStore } from '@/store/app-store'
import { useAuth } from '@/components/shared/AuthProvider'
import { Loader2 } from 'lucide-react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { session, isLoading } = useAuth()
  const { theme } = useAppStore()

  useEffect(() => {
    if (!isLoading && !session) {
      router.push('/login')
    }
  }, [isLoading, session, router])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-white dark:bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="h-full flex items-center justify-center bg-white dark:bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="h-full flex bg-white dark:bg-gray-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">JHS One Ai</span>
          </div>
          <div className="flex items-center gap-1">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 flex flex-col min-h-0">
          {children}
        </main>
      </div>
    </div>
  )
}
