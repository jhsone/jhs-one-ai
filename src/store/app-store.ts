'use client'

import { create } from 'zustand'
import { setLanguage } from '@/lib/i18n'

interface AppState {
  theme: 'light' | 'dark'
  language: 'en' | 'bn'
  sidebarOpen: boolean
  setTheme: (t: 'light' | 'dark') => void
  toggleTheme: () => void
  setLanguage: (l: 'en' | 'bn') => void
  toggleSidebar: () => void
  setSidebarOpen: (v: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  theme: 'light',
  language: 'en',
  sidebarOpen: true,

  setTheme: (theme) => {
    set({ theme })
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', theme === 'dark')
    }
  },

  toggleTheme: () =>
    set((s) => {
      const next = s.theme === 'light' ? 'dark' : 'light'
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', next === 'dark')
      }
      return { theme: next }
    }),

  setLanguage: (language) => {
    set({ language })
    setLanguage(language)
  },

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
}))
