'use client'

import { useState } from 'react'
import { ArrowRight, Loader2, Sparkles, Brain, Zap, Shield } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/shared/AuthProvider'
import { t } from '@/lib/i18n'
import { AiAvatar } from '@/components/shared/AiAvatar'

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
      <div className="min-h-dvh flex flex-col items-center justify-center px-5 bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center mb-5">
            <AiAvatar size={56} />
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
    <div className="min-h-dvh flex flex-col items-center justify-center px-5 sm:px-8 bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-blue-400/5 to-purple-400/5 dark:from-blue-400/3 dark:to-purple-400/3 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-2xl text-center relative">
        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 border border-blue-200/50 dark:border-blue-800/50 mb-6 sm:mb-8 shadow-sm">
          <AiAvatar size={20} />
          <span className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 font-medium">
            {t('landing.powered_by')}
          </span>
          <Sparkles className="h-3 w-3 text-purple-500 dark:text-purple-400" />
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-gray-100 mb-4 sm:mb-6 tracking-tight leading-tight">
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
            {t('landing.hero_title')}
          </span>
        </h1>

        <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 dark:text-gray-400 mb-8 sm:mb-10 max-w-md sm:max-w-xl mx-auto leading-relaxed px-2 sm:px-0">
          {t('landing.hero_subtitle')}
        </p>

        <Button
          size="lg"
          onClick={handleClick}
          disabled={navigating || isLoading}
          className="w-full sm:w-auto text-sm sm:text-base px-6 sm:px-8 py-3 sm:py-3 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.98]"
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

        {/* Features */}
        <div className="mt-10 sm:mt-12 md:mt-16 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6 w-full max-w-lg sm:max-w-2xl mx-auto">
          {[
            { icon: Brain, labelKey: 'landing.feature_1', descKey: 'landing.feature_1_desc', color: 'from-blue-500 to-blue-600' },
            { icon: Zap, labelKey: 'landing.feature_2', descKey: 'landing.feature_2_desc', color: 'from-purple-500 to-purple-600' },
            { icon: Shield, labelKey: 'landing.feature_3', descKey: 'landing.feature_3_desc', color: 'from-emerald-500 to-emerald-600' },
          ].map((f, i) => {
            const Icon = f.icon
            return (
              <div
                key={i}
                className="group p-3 sm:p-4 rounded-xl bg-white/80 dark:bg-gray-900/80 border border-gray-200/50 dark:border-gray-800/50 text-left sm:text-center hover:shadow-md hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-200 backdrop-blur-sm"
              >
                <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br ${f.color} text-white mb-2 sm:mb-3 shadow-sm`}>
                  <Icon className="h-4 w-4" />
                </div>
                <h3 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-gray-100 mb-0.5 sm:mb-1">{t(f.labelKey)}</h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{t(f.descKey)}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
