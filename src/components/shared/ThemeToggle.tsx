'use client'

import { Sun, Moon } from 'lucide-react'
import { useAppStore } from '@/store/app-store'
import { Button } from '@/components/ui/Button'

export function ThemeToggle() {
  const { theme, toggleTheme } = useAppStore()

  return (
    <Button variant="ghost" size="sm" onClick={toggleTheme} className="w-9 h-9 p-0">
      {theme === 'light' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  )
}
