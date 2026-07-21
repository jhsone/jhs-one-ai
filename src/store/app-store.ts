'use client'

import { create } from 'zustand'
import { setLanguage } from '@/lib/i18n'

export type Lang = 'en' | 'bn'

function getStoredLang(): Lang {
  try {
    if (typeof window === 'undefined') return 'en'
    const stored = localStorage.getItem('jhs-lang')
    if (stored === 'en' || stored === 'bn') return stored
  } catch {}
  return 'en'
}

interface AppState {
  language: Lang
  sidebarOpen: boolean
  setLanguage: (l: Lang) => void
  toggleSidebar: () => void
  setSidebarOpen: (v: boolean) => void
}

export const useAppStore = create<AppState>((set) => {
  const initialLang = getStoredLang()

  if (typeof document !== 'undefined') {
    document.documentElement.lang = initialLang === 'bn' ? 'bn' : 'en'
  }

  setLanguage(initialLang)

  return {
    language: initialLang,
    sidebarOpen: true,

    setLanguage: (language) => {
      set({ language })
      localStorage.setItem('jhs-lang', language)
      document.documentElement.lang = language === 'bn' ? 'bn' : 'en'
      setLanguage(language)
    },

    toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
    setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  }
})
