'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

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
    <div className="relative group mt-2 mb-2">
      <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 rounded-t-lg px-4 py-2 text-xs text-gray-500 dark:text-gray-400">
        <span>{language || 'code'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" /> Copied!
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" /> Copy code
            </>
          )}
        </button>
      </div>
      <pre className="bg-gray-50 dark:bg-gray-900 rounded-b-lg p-4 overflow-x-auto text-sm">
        <code className={`language-${language || ''}`}>{code}</code>
      </pre>
    </div>
  )
}
