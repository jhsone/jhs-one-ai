'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ExternalLink, X, FileText, Globe, Loader2 } from 'lucide-react'
import { t } from '@/lib/i18n'

interface Reference {
  title: string
  url: string
  domain: string
  label: string
  labelColor?: string
  snippet?: string
}

interface ReferencesProps {
  references: Reference[]
}

const labelColors: Record<string, string> = {
  web: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  document: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  image: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  audio: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  video: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  code: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  default: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
}

function SourceChip({ reference, onClick }: { reference: Reference; onClick: () => void }) {
  const labelColor = labelColors[reference.label] || labelColors.default
  const Icon = reference.url.startsWith('http') ? Globe : FileText

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 touch-target group"
      aria-label={`View source: ${reference.title}`}
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <Icon className="h-4 w-4 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {reference.title}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{reference.domain}</p>
      </div>
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${labelColor}`}>
        {reference.label}
      </span>
      <ExternalLink className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  )
}

function SourceBottomSheet({
  isOpen,
  onClose,
  reference,
}: {
  isOpen: boolean
  onClose: () => void
  reference: Reference | null
}) {
  const sheetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  if (!isOpen || !reference) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="source-sheet-title"
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
      <div
        ref={sheetRef}
        className="relative w-full bg-white dark:bg-gray-950 rounded-t-2xl shadow-xl max-h-[85vh] flex flex-col animate-slide-up"
      >
        {/* Handle */}
        <div className="flex justify-center pt-3">
          <div className="w-8 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h2 id="source-sheet-title" className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {t('chat.source_detail') || 'Source Details'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors touch-target"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                {t('chat.title') || 'Title'}
              </p>
              <p className="text-base font-medium text-gray-900 dark:text-gray-100 break-words">
                {reference.title}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                {t('chat.source') || 'Source'}
              </p>
              <p className="text-sm text-blue-600 dark:text-blue-400 break-all">
                <a
                  href={reference.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:underline group"
                >
                  {reference.url}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                {t('chat.domain') || 'Domain'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">{reference.domain}</p>
            </div>

            {reference.snippet && (
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                  {t('chat.description') || 'Description'}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 break-words">{reference.snippet}</p>
              </div>
            )}

            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                {t('chat.type') || 'Type'}
              </p>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${labelColors[reference.label] || labelColors.default}`}>
                {reference.label}
              </span>
            </div>
          </div>

          {/* Open Link Button */}
          <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
            <a
              href={reference.url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors touch-target"
            >
              <ExternalLink className="h-4 w-4" />
              <span>{t('chat.open_link') || 'Open Link'}</span>
            </a>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

export function References({ references }: ReferencesProps) {
  if (!references || references.length === 0) return null

  const [openReference, setOpenReference] = useState<Reference | null>(null)

  return (
    <>
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 animate-fade-in" role="list" aria-label="Sources">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {t('chat.sources') || 'Sources'}
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
            {references.length}
          </span>
        </div>
        <div className="flex flex-wrap gap-2" role="list">
          {references.map((ref, i) => (
            <SourceChip
              key={`${ref.url}-${i}`}
              reference={ref}
              onClick={() => setOpenReference(ref)}
            />
          ))}
        </div>
      </div>

      <SourceBottomSheet
        isOpen={!!openReference}
        onClose={() => setOpenReference(null)}
        reference={openReference}
      />
    </>
  )
}