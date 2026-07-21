'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from './AuthProvider'

export type Theme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  setTheme: (t: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  setTheme: () => {},
  toggleTheme: () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}

function getSystemTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getStoredTheme(): Theme | null {
  try {
    if (typeof window === 'undefined') return null
    const stored = localStorage.getItem('jhs-theme')
    if (stored === 'dark' || stored === 'light') return stored
  } catch {}
  return null
}

function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', theme === 'dark')
  document.documentElement.style.colorScheme = theme
}

function storeTheme(theme: Theme) {
  try {
    localStorage.setItem('jhs-theme', theme)
  } catch {}
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth()
  const [theme, setThemeState] = useState<Theme>('light')
  const syncedRef = useRef(false)

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t)
    storeTheme(t)
    applyTheme(t)

    if (session?.user) {
      createClient().from('profiles').upsert(
        { id: session.user.id, theme: t },
        { onConflict: 'id' }
      ).then()
    }
  }, [session])

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }, [theme, setTheme])

  useEffect(() => {
    const stored = getStoredTheme()
    const initial = stored ?? getSystemTheme()
    setThemeState(initial)
    applyTheme(initial)
    if (!stored) storeTheme(initial)

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => {
      if (!getStoredTheme()) {
        const next = e.matches ? 'dark' : 'light'
        setThemeState(next)
        applyTheme(next)
      }
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    if (!session?.user || syncedRef.current) return
    syncedRef.current = true

    createClient().from('profiles').select('theme').eq('id', session.user.id).maybeSingle()
      .then(({ data: profile }) => {
        if (profile?.theme === 'dark' || profile?.theme === 'light') {
          setThemeState(profile.theme)
          storeTheme(profile.theme)
          applyTheme(profile.theme)
        }
      })
  }, [session])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
