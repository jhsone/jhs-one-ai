'use client'

import { usePathname, useRouter } from 'next/navigation'
import { MessageSquare, User } from 'lucide-react'

const navItems = [
  { href: '/chat', icon: MessageSquare, label: 'Chat' },
  { href: '/profile', icon: User, label: 'Profile' },
]

export function MobileNav() {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 safe-area-bottom">
      <div className="flex items-center justify-around h-14">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname.startsWith(item.href)
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={`flex flex-col items-center justify-center gap-0.5 px-4 py-1.5 rounded-lg transition-colors ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
