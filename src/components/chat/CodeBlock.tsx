'use client'

import { useState, useEffect } from 'react'
import { Copy, Check, Download, Maximize2, Minimize2, WrapText, Play, Loader2, Terminal, X } from 'lucide-react'
import { t } from '@/lib/i18n'

const langExtensions: Record<string, string> = {
  javascript: 'js', typescript: 'ts', python: 'py', java: 'java',
  c: 'c', cpp: 'cpp', 'c++': 'cpp', csharp: 'cs', 'c#': 'cs',
  go: 'go', rust: 'rs', php: 'php', html: 'html', css: 'css',
  scss: 'scss', sql: 'sql', json: 'json', yaml: 'yml', yml: 'yml',
  xml: 'xml', markdown: 'md', md: 'md', bash: 'sh', shell: 'sh',
  sh: 'sh', dockerfile: 'Dockerfile', kotlin: 'kt', swift: 'swift',
  dart: 'dart', ruby: 'rb', lua: 'lua', tsx: 'tsx', jsx: 'jsx',
}

function getFileName(language?: string): string {
  if (!language) return 'code.txt'
  const lower = language.toLowerCase()
  if (lower === 'dockerfile') return 'Dockerfile'
  const ext = langExtensions[lower]
  return `code.${ext || lower || 'txt'}`
}

interface CodeBlockProps {
  code: string
  language?: string
}

export function CodeBlock({ code, language }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [wordWrap, setWordWrap] = useState(false)
  const [html, setHtml] = useState('')
  const [showNumbers, setShowNumbers] = useState(true)
  const [running, setRunning] = useState(false)
  const [output, setOutput] = useState<{ stdout: string; stderr: string; exitCode: number } | null>(null)

  useEffect(() => {
    let cancelled = false
    const highlight = async () => {
      try {
        const hljs = (await import('highlight.js')).default
        const lang = language?.toLowerCase()
        let result
        if (lang && hljs.getLanguage(lang)) {
          result = hljs.highlight(code, { language: lang })
        } else {
          result = hljs.highlightAuto(code)
        }
        if (!cancelled) {
          const lines = result.value.split('\n')
          const wrapped = lines.map(line => `<span class="line">${line || ' '}</span>`).join('')
          setHtml(wrapped)
        }
      } catch {
        if (!cancelled) {
          const escaped = code
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
          const lines = escaped.split('\n')
          const wrapped = lines.map(line => `<span class="line">${line || ' '}</span>`).join('')
          setHtml(wrapped)
        }
      }
    }
    highlight()
    return () => { cancelled = true }
  }, [code, language])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = getFileName(language)
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleRun = async () => {
    setRunning(true)
    setOutput(null)
    try {
      const res = await fetch('/api/sandbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language }),
      })
      const data = await res.json()
      setOutput({ stdout: data.output || '', stderr: data.error || '', exitCode: data.exitCode ?? 1 })
    } catch {
      setOutput({ stdout: '', stderr: 'Failed to execute code', exitCode: 1 })
    }
    setRunning(false)
  }

  const isRunnable = language && ['javascript', 'js', 'typescript', 'ts', 'python', 'py', 'bash', 'sh', 'shell'].includes(language.toLowerCase())

  const toolbar = (
    <div className="flex items-center justify-between px-3 sm:px-4 py-1.5 sm:py-2 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2 min-w-0">
        <div className="flex gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
        </div>
        <span className="truncate ml-2 font-medium">{language || t('chat.code_label')}</span>
      </div>
      <div className="flex items-center gap-0.5">
        {isRunnable && (
          <button
            onClick={handleRun}
            disabled={running}
            className="flex items-center gap-1 p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-emerald-600 dark:text-emerald-400 disabled:opacity-50"
            aria-label="Run code"
            title="Run"
          >
            {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
          </button>
        )}
        <button
          onClick={() => setShowNumbers(!showNumbers)}
          className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${showNumbers ? 'text-blue-500' : ''}`}
          aria-label="Toggle line numbers"
          title="Line numbers"
        >
          <span className="text-[10px] font-mono font-bold">¶</span>
        </button>
        <button
          onClick={() => setWordWrap(!wordWrap)}
          className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${wordWrap ? 'text-blue-500' : ''}`}
          aria-label="Toggle word wrap"
          title="Word wrap"
        >
          <WrapText className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={handleDownload}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          aria-label="Download code"
          title="Download"
        >
          <Download className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => setExpanded(true)}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          aria-label="Expand code"
          title="Fullscreen"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ml-1"
          aria-label="Copy code"
          title="Copy"
        >
          {copied ? (
            <span className="flex items-center gap-1 text-green-500">
              <Check className="h-3.5 w-3.5" /> {t('chat.copied')}
            </span>
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
    </div>
  )

  const codeContent = (
    <code
      className={`language-${language || ''} !bg-transparent`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )

  return (
    <>
      {expanded && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-2 sm:p-4"
          onClick={() => setExpanded(false)}
        >
          <div
            className="relative w-full max-w-5xl max-h-[90vh] bg-gray-50 dark:bg-gray-900 rounded-xl overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                {language || t('chat.code_label')}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  {copied ? (
                    <span className="flex items-center gap-1 text-green-500">
                      <Check className="h-3.5 w-3.5" /> {t('chat.copied')}
                    </span>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" /> {t('chat.copy')}
                    </>
                  )}
                </button>
                <button
                  onClick={() => setExpanded(false)}
                  className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                  aria-label="Close fullscreen"
                >
                  <Minimize2 className="h-4 w-4 text-gray-500" />
                </button>
              </div>
            </div>
            <pre
              className={`flex-1 overflow-auto p-4 text-sm code-block ${showNumbers ? 'code-block--numbers' : ''} ${wordWrap ? 'code-block--word-wrap' : ''}`}
            >
              {codeContent}
        </pre>
        {output && (
          <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-900 text-gray-100 text-xs font-mono">
            <div className="flex items-center justify-between px-3 py-1.5 bg-gray-800 border-b border-gray-700">
              <span className="flex items-center gap-1 text-gray-400">
                <Terminal className="h-3 w-3" />
                Output (exit: {output.exitCode})
              </span>
              <button
                onClick={() => setOutput(null)}
                className="p-0.5 rounded hover:bg-gray-700 text-gray-400 hover:text-gray-200"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
            <pre className="p-3 max-h-48 overflow-auto leading-relaxed">
              {output.stdout && <span className="text-green-400">{output.stdout}</span>}
              {output.stderr && <span className="text-red-400">{output.stderr}</span>}
              {!output.stdout && !output.stderr && <span className="text-gray-500 italic">(no output)</span>}
            </pre>
          </div>
        )}
          </div>
        </div>
      )}

      <div className="relative group mt-2 mb-2 -mx-3 sm:mx-0 max-w-[100vw] sm:max-w-none rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {toolbar}
        <pre
          className={`bg-gray-50 dark:bg-gray-900/50 overflow-x-auto text-xs sm:text-sm leading-relaxed m-0 code-block ${showNumbers ? 'code-block--numbers' : ''} ${wordWrap ? 'code-block--word-wrap' : ''}`}
        >
          {codeContent}
        </pre>
      </div>
    </>
  )
}
