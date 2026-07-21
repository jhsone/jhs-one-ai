'use client'

import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { CodeBlock } from './CodeBlock'

interface MarkdownRendererProps {
  content: string
}

const ALERT_TYPES = ['NOTE', 'TIP', 'IMPORTANT', 'WARNING', 'CAUTION'] as const

function findAlertType(nodes: React.ReactNode[]): string | null {
  for (const node of nodes) {
    if (typeof node === 'string') {
      const m = node.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/i)
      if (m) return m[1].toLowerCase()
    }
    if (React.isValidElement<{children?: React.ReactNode}>(node) && node.props.children) {
      const found = findAlertType(React.Children.toArray(node.props.children))
      if (found) return found
    }
  }
  return null
}

function removeMarker(nodes: React.ReactNode[]): React.ReactNode[] {
  return nodes.flatMap(node => {
    if (typeof node === 'string') {
      return node.replace(/^\[!(?:NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/i, '')
    }
    if (React.isValidElement<{children?: React.ReactNode}>(node) && node.props.children) {
      const childArr = React.Children.toArray(node.props.children)
      return React.cloneElement(node, {
        ...node.props,
        children: childArr.length === 1 ? removeMarker(childArr)[0] : removeMarker(childArr),
      })
    }
    return node
  })
}

const alertLabels: Record<string, string> = {
  note: 'Note',
  tip: 'Tip',
  important: 'Important',
  warning: 'Warning',
  caution: 'Caution',
}

const alertStyles: Record<string, string> = {
  note: 'border-blue-500 bg-blue-50 dark:bg-blue-950/30',
  tip: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30',
  important: 'border-purple-500 bg-purple-50 dark:bg-purple-950/30',
  warning: 'border-amber-500 bg-amber-50 dark:bg-amber-950/30',
  caution: 'border-red-500 bg-red-50 dark:bg-red-950/30',
}

const alertTextColors: Record<string, string> = {
  note: 'text-blue-800 dark:text-blue-200',
  tip: 'text-emerald-800 dark:text-emerald-200',
  important: 'text-purple-800 dark:text-purple-200',
  warning: 'text-amber-800 dark:text-amber-200',
  caution: 'text-red-800 dark:text-red-200',
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="markdown-content prose prose-sm dark:prose-invert max-w-none prose-pre:p-0 prose-pre:bg-transparent prose-code:before:content-none prose-code:after:content-none prose-th:border prose-th:border-gray-300 dark:prose-th:border-gray-600 prose-td:border prose-td:border-gray-300 dark:prose-td:border-gray-600 prose-table:text-sm">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '')
            const isInline = !match && !className
            if (isInline) {
              return (
                <code className="bg-gray-100 dark:bg-gray-800 rounded px-1.5 py-0.5 text-sm font-mono before:content-none after:content-none" {...props}>
                  {children}
                </code>
              )
            }
            return (
              <CodeBlock
                code={String(children).replace(/\n$/, '')}
                language={match ? match[1] : ''}
              />
            )
          },
          pre({ children }) {
            return <>{children}</>
          },
          a({ href, children, ...props }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
                {...props}
              >
                {children}
              </a>
            )
          },
          img({ src, alt, ...props }) {
            return (
              <img
                src={src}
                alt={alt || ''}
                className="max-w-full h-auto rounded-lg my-2"
                loading="lazy"
                {...props}
              />
            )
          },
          table({ children, ...props }) {
            return (
              <div className="overflow-x-auto my-2">
                <table className="min-w-full border-collapse" {...props}>
                  {children}
                </table>
              </div>
            )
          },
          blockquote({ children, ...props }) {
            const childrenArr = React.Children.toArray(children)
            const alertType = findAlertType(childrenArr)
            if (alertType) {
              const cleaned = removeMarker(childrenArr)
              return (
                <div className={`border-l-4 ${alertStyles[alertType]} rounded-r-lg p-3 my-3 ${alertTextColors[alertType]}`}>
                  <p className="font-semibold text-sm mb-1">{alertLabels[alertType]}</p>
                  {cleaned}
                </div>
              )
            }
            return (
              <blockquote className="border-l-3 border-blue-500 dark:border-blue-400 pl-4 py-1 my-2 text-gray-600 dark:text-gray-400 italic" {...props}>
                {children}
              </blockquote>
            )
          },
          hr() {
            return <hr className="my-4 border-gray-300 dark:border-gray-600" />
          },
          ul({ className, children, ...props }) {
            const isTaskList = className?.includes('contains-task-list')
            if (isTaskList) {
              return <ul className="task-list space-y-1 my-2" {...props}>{children}</ul>
            }
            return <ul className="list-disc pl-5 space-y-1 my-2" {...props}>{children}</ul>
          },
          ol({ children, ...props }) {
            return <ol className="list-decimal pl-5 space-y-1 my-2" {...props}>{children}</ol>
          },
          li({ className, children, ...props }) {
            if (className?.includes('task-list-item')) {
              return <li className="flex items-start gap-2" {...props}>{children}</li>
            }
            return <li {...props}>{children}</li>
          },
          input({ type, checked, ...props }) {
            if (type === 'checkbox') {
              return (
                <input
                  type="checkbox"
                  checked={checked}
                  readOnly
                  className="mt-1 h-3.5 w-3.5 rounded border-gray-300 dark:border-gray-600 accent-blue-500"
                  {...props}
                />
              )
            }
            return <input type={type} {...props} />
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
