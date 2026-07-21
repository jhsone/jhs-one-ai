'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { CodeBlock } from './CodeBlock'

interface MarkdownRendererProps {
  content: string
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
