'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import { ChatMessages } from '@/components/chat/ChatMessages'
import { ChatInput } from '@/components/chat/ChatInput'
import { useChat } from '@/lib/hooks/useChat'

export default function ConversationPage() {
  const params = useParams()
  const { loadMessages } = useChat()

  useEffect(() => {
    if (params.id) loadMessages(params.id as string)
  }, [params.id, loadMessages])

  return (
    <>
      <ChatMessages />
      <ChatInput />
    </>
  )
}
