'use client'

import { useState } from 'react'
import { Sparkles, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/shared/AuthProvider'
import { t } from '@/lib/i18n'

export function Hero() {
  const router = useRouter()
  const { session, isLoading, error: authError } = useAuth()
  const [navigating, setNavigating] = useState(false)

  const handleClick = async () => {
    setNavigating(true)
    if (isLoading) return
    if (session) router.push('/chat')
    else router.push('/login')
  }

  if (authError) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-5 bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-900/30 mb-5">
            <Sparkles className="h-7 w-7 text-red-500" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">{t('landing.config_title')}</h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-4">
            {t('landing.config_desc')}
          </p>
          <code className="block bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-xs sm:text-sm text-left mb-4 break-all">
            NEXT_PUBLIC_SUPABASE_URL<br />
            NEXT_PUBLIC_SUPABASE_ANON_KEY
          </code>
          <p className="text-xs sm:text-sm text-gray-400">
            {t('landing.config_hint')}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-5 sm:px-8 bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900">
      <div className="w-full max-w-2xl text-center">
        <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 mb-6 sm:mb-8">
          <Sparkles className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-blue-600 dark:text-blue-400" />
          <span className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 font-medium">
            {t('landing.powered_by')}
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-gray-100 mb-4 sm:mb-6 tracking-tight leading-tight">
          {t('landing.hero_title')}
        </h1>

        <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 dark:text-gray-400 mb-8 sm:mb-10 max-w-md sm:max-w-xl mx-auto leading-relaxed px-2 sm:px-0">
          {t('landing.hero_subtitle')}
        </p>

        <Button
          size="lg"
          onClick={handleClick}
          disabled={navigating || isLoading}
          className="w-full sm:w-auto text-sm sm:text-base px-6 sm:px-8 py-3 sm:py-3 rounded-xl"
        >
          {navigating || isLoading ? (
            <>
              <Loader2 className="h-4 sm:h-5 w-4 sm:w-5 animate-spin mr-2" />
              {t('app.loading')}
            </>
          ) : (
            <>
              {t('landing.get_started')}
              <ArrowRight className="ml-2 h-4 sm:h-5 w-4 sm:w-5" />
            </>
          )}
        </Button>

        <div className="mt-10 sm:mt-12 md:mt-16 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6 w-full max-w-lg sm:max-w-2xl mx-auto">
          {[
            { labelKey: 'landing.feature_1', descKey: 'landing.feature_1_desc' },
            { labelKey: 'landing.feature_2', descKey: 'landing.feature_2_desc' },
            { labelKey: 'landing.feature_3', descKey: 'landing.feature_3_desc' },
          ].map((f, i) => (
            <div key={i} className="p-3 sm:p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-left sm:text-center">
              <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-gray-100 mb-0.5 sm:mb-1">{t(f.labelKey)}</h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{t(f.descKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
