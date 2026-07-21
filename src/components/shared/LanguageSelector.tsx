'use client'

import { useState, useRef, useEffect } from 'react'
import { Languages, Check } from 'lucide-react'
import { useAppStore, type Lang } from '@/store/app-store'
import { t } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from './AuthProvider'

export function LanguageSelector() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { language, setLanguage } = useAppStore()
  const { session } = useAuth()

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = async (lang: Lang) => {
    setLanguage(lang)
    setOpen(false)

    if (session?.user) {
      try {
        const supabase = createClient()
        await supabase.from('profiles').upsert({
          id: session.user.id,
          preferred_lang: lang,
        })
      } catch {}
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label={t('language.select_language')}
      >
        <Languages className="h-4 w-4 text-gray-600 dark:text-gray-300" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-40 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-lg z-50 overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {t('language.select_language')}
            </p>
          </div>
          {(Object.entries({
            en: t('language.en'),
            bn: t('language.bn'),
          }) as [Lang, string][]).map(([code, label]) => (
            <button
              key={code}
              onClick={() => handleSelect(code)}
              className="flex items-center justify-between w-full px-3 py-2.5 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <span className={language === code ? 'font-medium text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'}>
                {label}
              </span>
              {language === code && (
                <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
