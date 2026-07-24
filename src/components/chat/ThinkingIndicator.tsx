'use client'

import { cn } from '@/lib/utils/cn'
import { t } from '@/lib/i18n'
import { AiAvatar } from '@/components/shared/AiAvatar'

interface ThinkingIndicatorProps {
  className?: string
}

export function ThinkingIndicator({ className }: ThinkingIndicatorProps) {
  return (
    <div className={cn('flex items-center gap-3 px-3 sm:px-4 py-3', className)}>
      <AiAvatar size={32} />
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="h-2 w-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="h-2 w-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
          {t('chat.thinking_jhs') || 'JHS One AI is thinking...'}
        </span>
      </div>
    </div>
  )
}