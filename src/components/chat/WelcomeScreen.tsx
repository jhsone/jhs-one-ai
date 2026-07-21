'use client'

import { Sparkles, MessageSquare, Code, BookOpen } from 'lucide-react'
import { useChat } from '@/lib/hooks/useChat'
import { t } from '@/lib/i18n'
import { AiAvatar } from '@/components/shared/AiAvatar'

const iconMap = [Sparkles, MessageSquare, Code, BookOpen]

export function WelcomeScreen() {
  const { sendMessage, createConversation } = useChat()
  const suggestions = t('chat.welcome_suggestions')

  const handleSuggestion = async (text: string) => {
    await createConversation()
    sendMessage(text)
  }

  return (
    <div className="flex-1 flex items-center justify-center px-4 sm:px-6 overflow-y-auto">
      <div className="w-full max-w-lg text-center py-8">
        <div className="inline-flex items-center justify-center mb-4 sm:mb-5">
          <AiAvatar size={56} />
        </div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-1.5 sm:mb-2">
          {t('chat.welcome_title')}
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-6 sm:mb-8 px-2">
          {t('chat.welcome_subtitle')}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 w-full px-0 sm:px-2 max-w-sm mx-auto">
          {suggestions.map((text: string, i: number) => {
            const Icon = iconMap[i % iconMap.length]
            return (
              <button
                key={i}
                onClick={() => handleSuggestion(text)}
                className="flex items-center gap-2.5 sm:gap-3 p-3 sm:p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left group"
              >
                <Icon className="h-4 sm:h-5 w-4 sm:w-5 text-blue-500 group-hover:text-blue-600 flex-shrink-0" />
                <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-snug">{text}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
