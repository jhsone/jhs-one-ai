'use client'

import { ChatMessages } from '@/components/chat/ChatMessages'
import { ChatInput } from '@/components/chat/ChatInput'

export default function NewChatPage() {
  return (
    <>
      <ChatMessages />
      <ChatInput />
    </>
  )
}
