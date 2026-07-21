'use client'

import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { SearchBar } from './SearchBar'
import { SidebarItem } from './SidebarItem'
import { UserMenu } from '@/components/shared/UserMenu'
import { useChat } from '@/lib/hooks/useChat'
import { useAuth } from '@/components/shared/AuthProvider'
import { createClient } from '@/lib/supabase/client'

export function Sidebar() {
  const [search, setSearch] = useState('')
  const { session } = useAuth()
  const { conversations, currentConversationId, loadConversations, loadMessages, createConversation, removeConversation, updateConversation } = useChat()

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

  return (
    <>
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">History</h2>
        <button
          onClick={handleNewChat}
          className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
        >
          <Plus className="h-4 w-4 text-gray-600 dark:text-gray-300" />
        </button>
      </div>

      <SearchBar value={search} onChange={setSearch} />

      <div className="flex-1 overflow-y-auto py-2">
        {filtered.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8 px-4">
            {search ? 'No results found' : 'No conversations yet'}
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

      <div className="border-t border-gray-200 dark:border-gray-800">
        {session?.user && (
          <UserMenu
            email={session.user.email!}
            avatarUrl={session.user.user_metadata?.avatar_url}
            displayName={session.user.user_metadata?.full_name}
          />
        )}
      </div>
    </>
  )
}
