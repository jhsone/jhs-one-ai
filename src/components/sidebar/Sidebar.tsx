'use client'

import { useEffect, useState } from 'react'
import { Plus, Search, ChevronRight } from 'lucide-react'
import { t } from '@/lib/i18n'
import { SidebarItem } from './SidebarItem'
import { AiAvatar } from '@/components/shared/AiAvatar'
import { useChat } from '@/lib/hooks/useChat'
import { useAuth } from '@/components/shared/AuthProvider'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'

export function Sidebar() {
  const [search, setSearch] = useState('')
  const router = useRouter()
  const { session } = useAuth()
  const {
    conversations,
    currentConversationId,
    loadConversations,
    loadMessages,
    createConversation,
    removeConversation,
    updateConversation,
  } = useChat()

  useEffect(() => {
    if (session?.user) loadConversations()
  }, [session, loadConversations])

  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  )

  const handleNewChat = () => createConversation()
  const handleDelete = async (id: string) => {
    const supabase = createClient()
    await supabase.from('conversations').delete().eq('id', id)
    removeConversation(id)
  }
  const handleRename = async (id: string, title: string) => {
    const supabase = createClient()
    await supabase.from('conversations').update({ title }).eq('id', id)
    updateConversation(id, { title })
  }
  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const user = session?.user
  const avatarUrl = user?.user_metadata?.avatar_url
  const displayName = user?.user_metadata?.full_name
  const email = user?.email

  return (
    <div className="flex flex-col h-full">
      {/* Branded header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <AiAvatar size={32} />
        <div className="min-w-0">
          <h1 className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight">
            JHS One AI
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
            {t('sidebar.tagline')}
          </p>
        </div>
      </div>

      {/* New Chat button */}
      <div className="px-3 pt-3 pb-2">
        <Button
          onClick={handleNewChat}
          className="w-full gap-2 justify-start rounded-xl shadow-sm"
          size="md"
        >
          <Plus className="h-4 w-4" />
          {t('sidebar.new_chat')}
        </Button>
      </div>

      {/* Search */}
      <div className="relative px-3 pb-1">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('sidebar.search')}
          className="w-full bg-gray-100 dark:bg-gray-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 outline-none focus:ring-1 focus:ring-blue-500 transition-all"
        />
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto py-1.5 space-y-0.5">
        {filtered.length === 0 ? (
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-8 px-4">
            {search ? t('sidebar.no_results') : t('sidebar.no_history')}
          </p>
        ) : (
          filtered.map((conv) => (
            <SidebarItem
              key={conv.id}
              conversation={conv}
              isActive={conv.id === currentConversationId}
              onClick={() => loadMessages(conv.id)}
              onRename={(title) => handleRename(conv.id, title)}
              onDelete={() => handleDelete(conv.id)}
            />
          ))
        )}
      </div>

      {/* Profile footer */}
      {user && (
        <div className="border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={() => router.push('/profile')}
            className="flex items-center gap-2.5 w-full px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs font-bold text-white">
                  {displayName?.[0] || email?.[0] || 'U'}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {displayName || t('sidebar.user_label')}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {email}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
          </button>
        </div>
      )}
    </div>
  )
}
