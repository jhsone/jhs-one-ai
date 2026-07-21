'use client'

import { create } from 'zustand'
import { setLanguage } from '@/lib/i18n'

export type Theme = 'light' | 'dark'
export type Lang = 'en' | 'bn'

function getStoredTheme(): Theme {
  try {
    if (typeof window === 'undefined') return 'light'
    const stored = localStorage.getItem('jhs-theme')
    if (stored === 'dark' || stored === 'light') return stored
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark'
  } catch {}
  return 'light'
}

function getStoredLang(): Lang {
  try {
    if (typeof window === 'undefined') return 'en'
    const stored = localStorage.getItem('jhs-lang')
    if (stored === 'en' || stored === 'bn') return stored
  } catch {}
  return 'en'
}

interface AppState {
  theme: Theme
  language: Lang
  sidebarOpen: boolean
  setTheme: (t: Theme) => void
  toggleTheme: () => void
  setLanguage: (l: Lang) => void
  toggleSidebar: () => void
  setSidebarOpen: (v: boolean) => void
}

export const useAppStore = create<AppState>((set, get) => {
  const initialTheme = getStoredTheme()
  const initialLang = getStoredLang()

  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', initialTheme === 'dark')
    document.documentElement.lang = initialLang === 'bn' ? 'bn' : 'en'
  }

  setLanguage(initialLang)

  return {
    theme: initialTheme,
    language: initialLang,
    sidebarOpen: true,

    setTheme: (theme) => {
      set({ theme })
      localStorage.setItem('jhs-theme', theme)
      document.documentElement.classList.toggle('dark', theme === 'dark')
    },

    toggleTheme: () => {
      const next = get().theme === 'light' ? 'dark' : 'light'
      set({ theme: next })
      localStorage.setItem('jhs-theme', next)
      document.documentElement.classList.toggle('dark', next === 'dark')
    },

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
