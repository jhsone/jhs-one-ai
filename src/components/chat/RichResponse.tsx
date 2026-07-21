'use client'

import { useState, useMemo } from 'react'
import { Copy, Check, Download, Maximize2, Minimize2, Clock, Sparkles } from 'lucide-react'
import { MarkdownRenderer } from './MarkdownRenderer'
import type { RichResponseData } from '@/lib/utils/rich-response'

function estimateReadingTime(text: string): number {
  const words = text.split(/\s+/).length
  return Math.max(1, Math.ceil(words / 200))
}

function formatTime(): string {
  return new Date().toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

interface DocumentToolbarProps {
  content: string
  title: string
}

function DocumentToolbar({ content, title }: DocumentToolbarProps) {
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      {expanded && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-2 sm:p-4"
          onClick={() => setExpanded(false)}
        >
          <div
            className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-gray-950 rounded-xl overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{title}</h2>
              <button
                onClick={() => setExpanded(false)}
                className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800"
                aria-label="Close fullscreen"
              >
                <Minimize2 className="h-4 w-4 text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
              <div className="max-w-3xl mx-auto">
                <MarkdownRenderer content={content} />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-1">
        <button
          onClick={handleCopy}
          className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
          aria-label="Copy document"
          title="Copy"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4 text-gray-500" />
          )}
        </button>
        <button
          onClick={handleDownload}
          className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
          aria-label="Download as Markdown"
          title="Download Markdown"
        >
          <Download className="h-4 w-4 text-gray-500" />
        </button>
        <button
          onClick={() => setExpanded(true)}
          className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
          aria-label="View fullscreen"
          title="Fullscreen"
        >
          <Maximize2 className="h-4 w-4 text-gray-500" />
        </button>
      </div>
    </>
  )
}

interface RichResponseProps {
  data: RichResponseData
}

export function RichResponse({ data }: RichResponseProps) {
  const readingTime = useMemo(() => estimateReadingTime(data.content), [data.content])
  const generatedTime = useMemo(() => formatTime(), [])

  return (
    <div className="w-full">
      {/* Document header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 leading-snug">
            {data.title}
          </h2>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-blue-500" />
              JHS One AI
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {generatedTime}
            </span>
            <span>
              {readingTime} min read
            </span>
          </div>
        </div>
        <DocumentToolbar content={data.content} title={data.title} />
      </div>

      {/* Content */}
      <div className="prose prose-sm dark:prose-invert max-w-none">
        <MarkdownRenderer content={data.content} />
      </div>
    </div>
  )
}
