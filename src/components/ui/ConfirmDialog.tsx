'use client'

import { useEffect, useRef } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { Button } from './Button'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'info'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onCancel])

  if (!open) return null

  const variantStyles = {
    danger: 'bg-red-500 hover:bg-red-600',
    warning: 'bg-amber-500 hover:bg-amber-600',
    info: 'bg-blue-500 hover:bg-blue-600',
  }

  const iconStyles = {
    danger: 'text-red-500 bg-red-100 dark:bg-red-900/30',
    warning: 'text-amber-500 bg-amber-100 dark:bg-amber-900/30',
    info: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div
        ref={dialogRef}
        className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-gray-200 dark:border-gray-800 animate-in fade-in zoom-in-95"
      >
        <button
          onClick={onCancel}
          className="absolute top-3 right-3 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <X className="h-4 w-4 text-gray-400" />
        </button>

        <div className={`inline-flex p-2.5 rounded-xl mb-4 ${iconStyles[variant]}`}>
          <AlertTriangle className="h-5 w-5" />
        </div>

        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1.5">
          {title}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
          {message}
        </p>

        <div className="flex items-center gap-2 justify-end">
          <Button
            variant="secondary"
            size="sm"
            onClick={onCancel}
          >
            {cancelLabel}
          </Button>
          <Button
            size="sm"
            className={variantStyles[variant]}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
