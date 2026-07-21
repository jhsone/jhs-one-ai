'use client'

import { Languages } from 'lucide-react'
import { useAppStore } from '@/store/app-store'
import { Button } from '@/components/ui/Button'

export function LanguageToggle() {
  const { language, setLanguage } = useAppStore()

  return (
    <Button variant="ghost" size="sm" onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')} className="w-9 h-9 p-0">
      <Languages className="h-4 w-4" />
    </Button>
  )
}
