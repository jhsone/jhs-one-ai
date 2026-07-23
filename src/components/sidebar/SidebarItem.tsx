'use client'

import { useState, useRef, useEffect } from 'react'
import { MoreHorizontal, Trash2, Pencil, Pin, Share2, Archive, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { formatDate } from '@/lib/utils/format'
import { AiAvatar } from '@/components/shared/AiAvatar'
import { t } from '@/lib/i18n'
import type { Conversation } from '@/types'

interface SidebarItemProps {
  conversation: Conversation
  isActive: boolean
  onClick: () => void
  onRename: (title: string) => void
  onDelete: () => void
  onShare?: (id: string) => void
  onArchive?: (id: string) => void
  onRestore?: (id: string) => void
}

export function SidebarItem({ conversation, isActive, onClick, onRename, onDelete, onShare, onArchive, onRestore }: SidebarItemProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(conversation.title)
  const menuRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])

  const handleRename = () => {
    const trimmed = editTitle.trim()
    if (trimmed && trimmed !== conversation.title) {
      onRename(trimmed)
    }
    setIsEditing(false)
  }

  const menuItems = [
    {
      label: t('chat.rename'),
      icon: Pencil,
      onClick: () => { setIsEditing(true); setEditTitle(conversation.title); setShowMenu(false) },
    },
    {
      label: t('sidebar.pin'),
      icon: Pin,
      onClick: () => setShowMenu(false),
    },
    {
      label: t('sidebar.share'),
      icon: Share2,
      onClick: () => { onShare?.(conversation.id); setShowMenu(false) },
    },
    {
      label: conversation.archived ? 'Restore' : 'Archive',
      icon: conversation.archived ? RotateCcw : Archive,
      onClick: () => {
        if (conversation.archived) onRestore?.(conversation.id)
        else onArchive?.(conversation.id)
        setShowMenu(false)
      },
    },
    {
      label: t('chat.delete'),
      icon: Trash2,
      danger: true,
      onClick: () => { onDelete(); setShowMenu(false) },
    },
  ]

  return (
    <div
      className={cn(
        'group relative flex items-start gap-2.5 px-3 py-2.5 mx-2 rounded-xl cursor-pointer transition-all duration-150',
        isActive
          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 ring-1 ring-blue-200 dark:ring-blue-800'
          : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-700 dark:text-gray-300'
      )}
      onClick={onClick}
    >
      <AiAvatar size={24} className="mt-0.5 flex-shrink-0" />

      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            ref={inputRef}
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename()
              if (e.key === 'Escape') setIsEditing(false)
            }}
            className="w-full bg-white dark:bg-gray-700 rounded-md px-2 py-1 text-sm outline-none ring-2 ring-blue-500"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <>
            <p className="text-sm font-medium truncate">{conversation.title}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {formatDate(conversation.updated_at)}
              {conversation.message_count !== undefined && (
                <span className="ml-2">· {conversation.message_count} msgs</span>
              )}
            </p>
          </>
        )}
      </div>

      {/* Active indicator dot */}
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-500 rounded-full" />
      )}

      {/* Three-dot menu trigger */}
      <div className="relative flex-shrink-0" ref={menuRef}>
        <button
          onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu) }}
          className={cn(
            'p-1 rounded-lg transition-colors',
            showMenu
              ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              : 'opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          )}
          aria-label="Conversation menu"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>

        {showMenu && (
          <div className="absolute right-0 top-full mt-1 w-40 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-lg z-50 overflow-hidden py-1">
            {menuItems.map((item) => (
              <button
                key={item.label}
                onClick={(e) => { e.stopPropagation(); item.onClick() }}
                className={cn(
                  'flex items-center gap-2 w-full px-3 py-2 text-sm text-left transition-colors',
                  item.danger
                    ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                )}
              >
                <item.icon className="h-3.5 w-3.5 flex-shrink-0" />
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
