'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { t } from '@/lib/i18n'

interface CodeBlockProps {
  code: string
  language?: string
}

export function CodeBlock({ code, language }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative group mt-2 mb-2 -mx-3 sm:mx-0 max-w-[100vw] sm:max-w-none">
      <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 rounded-t-lg px-3 sm:px-4 py-1.5 sm:py-2 text-xs text-gray-500 dark:text-gray-400">
        <span className="truncate">{language || t('chat.code_label')}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200 transition-colors flex-shrink-0 ml-2"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" /> {t('chat.copied')}
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" /> {t('chat.copy')}
            </>
          )}
        </button>
      </div>
      <pre className="bg-gray-50 dark:bg-gray-900 rounded-b-lg p-3 sm:p-4 overflow-x-auto text-xs sm:text-sm max-w-full">
        <code className={`language-${language || ''}`}>{code}</code>
      </pre>
    </div>
  )
}
