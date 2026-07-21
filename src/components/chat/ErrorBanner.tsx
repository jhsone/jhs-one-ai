'use client'

import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useChatStore } from '@/store/chat-store'
import { t } from '@/lib/i18n'

interface ErrorBannerProps {
  message: string
}

export function ErrorBanner({ message }: ErrorBannerProps) {
  const { setError } = useChatStore()

  return (
    <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
      <AlertCircle className="h-4 sm:h-5 w-4 sm:w-5 text-red-500 flex-shrink-0 mt-0.5" />
      <p className="text-xs sm:text-sm text-red-700 dark:text-red-300 flex-1 min-w-0 break-words">{message}</p>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setError(null)}
        className="text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 flex-shrink-0 text-xs sm:text-sm"
      >
        {t('chat.dismiss')}
      </Button>
    </div>
  )
}
