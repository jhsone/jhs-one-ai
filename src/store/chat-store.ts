'use client'

import { create } from 'zustand'
import type { Conversation, Message, Attachment } from '@/types'

interface PendingAttachment {
  id: string
  file: File
  previewUrl: string
  fileType: string
  fileName: string
  fileSize: number
  progress: number
  status: 'pending' | 'uploading' | 'done' | 'error'
  error?: string
  result?: Attachment
}

interface ChatState {
  conversations: Conversation[]
  currentConversationId: string | null
  messages: Message[]
  isStreaming: boolean
  streamingContent: string
  error: string | null
  pendingAttachments: PendingAttachment[]
  setConversations: (conversations: Conversation[]) => void
  setCurrentConversation: (id: string | null) => void
  setMessages: (messages: Message[]) => void
  addMessage: (message: Message) => void
  setIsStreaming: (v: boolean) => void
  setStreamingContent: (v: string) => void
  appendStreamingContent: (v: string) => void
  setError: (err: string | null) => void
  addConversation: (conv: Conversation) => void
  updateConversation: (id: string, updates: Partial<Conversation>) => void
  removeConversation: (id: string) => void
  reset: () => void
  addPendingAttachment: (att: PendingAttachment) => void
  updatePendingAttachment: (id: string, updates: Partial<PendingAttachment>) => void
  removePendingAttachment: (id: string) => void
  clearPendingAttachments: () => void
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  currentConversationId: null,
  messages: [],
  isStreaming: false,
  streamingContent: '',
  error: null,
  pendingAttachments: [],

  setConversations: (conversations) => set({ conversations }),
  setCurrentConversation: (id) => set({ currentConversationId: id }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((s) => ({ messages: [...s.messages, message] })),
  setIsStreaming: (v) => set({ isStreaming: v }),
  setStreamingContent: (v) => set({ streamingContent: v }),
  appendStreamingContent: (v) => set((s) => ({ streamingContent: s.streamingContent + v })),
  setError: (err) => set({ error: err }),
  addConversation: (conv) => set((s) => ({ conversations: [conv, ...s.conversations] })),
  updateConversation: (id, updates) =>
    set((s) => ({
      conversations: s.conversations.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    })),
  removeConversation: (id) =>
    set((s) => ({
      conversations: s.conversations.filter((c) => c.id !== id),
      currentConversationId: s.currentConversationId === id ? null : s.currentConversationId,
    })),
  reset: () =>
    set({
      conversations: [],
      currentConversationId: null,
      messages: [],
      isStreaming: false,
      streamingContent: '',
      error: null,
      pendingAttachments: [],
    }),

  addPendingAttachment: (att) => set((s) => ({ pendingAttachments: [...s.pendingAttachments, att] })),
  updatePendingAttachment: (id, updates) =>
    set((s) => ({
      pendingAttachments: s.pendingAttachments.map((a) =>
        a.id === id ? { ...a, ...updates } : a
      ),
    })),
  removePendingAttachment: (id) =>
    set((s) => ({
      pendingAttachments: s.pendingAttachments.filter((a) => a.id !== id),
    })),
  clearPendingAttachments: () => set({ pendingAttachments: [] }),
}))
