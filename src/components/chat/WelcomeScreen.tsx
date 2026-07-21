'use client'

import { Sparkles, MessageSquare, Code, BookOpen } from 'lucide-react'
import { useChat } from '@/lib/hooks/useChat'

const suggestions = [
  { icon: Sparkles, text: 'Write a poem about AI' },
  { icon: MessageSquare, text: 'Explain quantum physics simply' },
  { icon: Code, text: 'Help me write React code' },
  { icon: BookOpen, text: 'Tell me a Bengali story' },
]

export function WelcomeScreen() {
  const { sendMessage, createConversation } = useChat()

  const handleSuggestion = async (text: string) => {
    await createConversation()
    sendMessage(text)
  }

  return (
    <div className="flex-1 flex items-center justify-center px-4 sm:px-6 overflow-y-auto">
      <div className="w-full max-w-lg text-center py-8">
        <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 mb-4 sm:mb-5">
          <Sparkles className="h-6 sm:h-7 w-6 sm:w-7 text-white" />
        </div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-1.5 sm:mb-2">
          How can I help you today?
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-6 sm:mb-8 px-2">
          Powered by JHS One Ai — multiple AI engines, one smart assistant
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 w-full px-0 sm:px-2 max-w-sm mx-auto">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => handleSuggestion(s.text)}
              className="flex items-center gap-2.5 sm:gap-3 p-3 sm:p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left group"
            >
              <s.icon className="h-4 sm:h-5 w-4 sm:w-5 text-blue-500 group-hover:text-blue-600 flex-shrink-0" />
              <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-snug">{s.text}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
