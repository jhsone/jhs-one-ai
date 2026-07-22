'use client'

import { Globe, BookOpen, FileText, Newspaper, GraduationCap, ExternalLink } from 'lucide-react'

export interface Reference {
  title: string
  url: string
  domain: string
  label: string
}

const labelIcons: Record<string, typeof Globe> = {
  'Official Documentation': BookOpen,
  'News': Newspaper,
  'Research': GraduationCap,
  'Government': FileText,
  'Knowledge Base': BookOpen,
  'Blog': Globe,
}

const labelColors: Record<string, string> = {
  'Official Documentation': 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  'News': 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  'Research': 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  'Government': 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  'Knowledge Base': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
  'Blog': 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
}

export function ReferenceCard({ reference: r }: { reference: Reference }) {
  const Icon = labelIcons[r.label] || Globe

  return (
    <a
      href={r.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <Icon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {r.title}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{r.domain}</p>
        <span className={`inline-block mt-1.5 text-[10px] font-medium px-1.5 py-0.5 rounded ${labelColors[r.label] || 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
          {r.label}
        </span>
      </div>
      <ExternalLink className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
    </a>
  )
}

interface ReferencesProps {
  references: Reference[]
}

export function References({ references }: ReferencesProps) {
  if (!references || references.length === 0) return null

  return (
    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
        Sources
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {references.map((ref, i) => (
          <ReferenceCard key={`${ref.url}-${i}`} reference={ref} />
        ))}
      </div>
    </div>
  )
}
