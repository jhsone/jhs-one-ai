'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, Search, ChevronRight, MessageSquare, Archive, RotateCcw } from 'lucide-react'
import { t } from '@/lib/i18n'
import { SidebarItem } from './SidebarItem'
import { AiAvatar } from '@/components/shared/AiAvatar'
import { useChat } from '@/lib/hooks/useChat'
import { useAuth } from '@/components/shared/AuthProvider'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'
import type { Message } from '@/types'

export function Sidebar() {
  const [search, setSearch] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [messageResults, setMessageResults] = useState<{ convId: string; title: string; snippet: string }[]>([])
  const [searching, setSearching] = useState(false)
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

  const doMessageSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setMessageResults([])
      return
    }
    setSearching(true)
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('messages')
        .select('id, content, conversation_id')
        .ilike('content', `%${q}%`)
        .limit(20)

      if (!data) { setMessageResults([]); return }

      const convIds = [...new Set(data.map(m => m.conversation_id))]
      const { data: convs } = await supabase
        .from('conversations')
        .select('id, title')
        .in('id', convIds)

      const convMap = new Map((convs || []).map(c => [c.id, c.title]))

      const results = data.map(m => ({
        convId: m.conversation_id,
        title: convMap.get(m.conversation_id) || 'Untitled',
        snippet: m.content.slice(0, 100),
      }))

      setMessageResults(results)
    } catch {}
    setSearching(false)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => doMessageSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search, doMessageSearch])

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
    router.refresh()
  }

  const handleShare = async (convId: string) => {
    try {
      const res = await fetch('/api/shares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: convId }),
      })
      const data = await res.json()
      if (data.url) {
        await navigator.clipboard.writeText(data.url)
      }
    } catch {}
  }

  const handleArchive = async (id: string) => {
    const supabase = createClient()
    await supabase.from('conversations').update({ archived: true }).eq('id', id)
    updateConversation(id, { archived: true })
  }

  const handleRestore = async (id: string) => {
    const supabase = createClient()
    await supabase.from('conversations').update({ archived: false }).eq('id', id)
    updateConversation(id, { archived: false })
  }

  const activeConversations = conversations.filter(c => !c.archived)
  const archivedConversations = conversations.filter(c => c.archived)

  const filteredActive = activeConversations.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  )

  const filteredArchived = archivedConversations.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  )

  const hasMessageResults = search.length >= 2 && messageResults.length > 0

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
        {hasMessageResults && (
          <div className="px-3 py-1.5">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Message results
            </p>
          </div>
        )}
        {hasMessageResults && messageResults.map((r, i) => (
          <button
            key={`msg-${i}`}
            onClick={() => {
              loadMessages(r.convId)
              setSearch('')
            }}
            className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors rounded-lg"
          >
            <div className="flex items-start gap-2">
              <MessageSquare className="h-3.5 w-3.5 mt-0.5 text-gray-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">{r.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{r.snippet}</p>
              </div>
            </div>
          </button>
        ))}
        {!hasMessageResults && !search && (
          <>
            {filteredActive.length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-8 px-4">
                {t('sidebar.no_history')}
              </p>
            ) : (
              filteredActive.map((conv) => (
                <SidebarItem
                  key={conv.id}
                  conversation={conv}
                  isActive={conv.id === currentConversationId}
                  onClick={() => loadMessages(conv.id)}
                  onRename={(title) => handleRename(conv.id, title)}
                  onDelete={() => handleDelete(conv.id)}
                  onShare={handleShare}
                  onArchive={handleArchive}
                />
              ))
            )}
            {archivedConversations.length > 0 && (
              <>
                <button
                  onClick={() => setShowArchived(!showArchived)}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <Archive className="h-3.5 w-3.5" />
                  {showArchived ? 'Hide archived' : `Show archived (${archivedConversations.length})`}
                </button>
                {showArchived && filteredArchived.map((conv) => (
                  <SidebarItem
                    key={conv.id}
                    conversation={conv}
                    isActive={conv.id === currentConversationId}
                    onClick={() => loadMessages(conv.id)}
                    onRename={(title) => handleRename(conv.id, title)}
                    onDelete={() => handleDelete(conv.id)}
                    onShare={handleShare}
                    onRestore={handleRestore}
                  />
                ))}
              </>
            )}
          </>
        )}
        {!hasMessageResults && search && (
          <>
            {filteredActive.map((conv) => (
              <SidebarItem key={conv.id} conversation={conv} isActive={conv.id === currentConversationId}
                onClick={() => loadMessages(conv.id)} onRename={(title) => handleRename(conv.id, title)}
                onDelete={() => handleDelete(conv.id)} onShare={handleShare} onArchive={handleArchive} />
            ))}
            {filteredArchived.map((conv) => (
              <SidebarItem key={conv.id} conversation={conv} isActive={conv.id === currentConversationId}
                onClick={() => loadMessages(conv.id)} onRename={(title) => handleRename(conv.id, title)}
                onDelete={() => handleDelete(conv.id)} onShare={handleShare} onRestore={handleRestore} />
            ))}
            {filteredActive.length === 0 && filteredArchived.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-8">{t('sidebar.no_results')}</p>
            )}
          </>
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
