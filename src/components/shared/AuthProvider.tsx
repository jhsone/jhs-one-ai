'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Session } from '@supabase/supabase-js'
import { useAppStore } from '@/store/app-store'
import type { Lang } from '@/store/app-store'

interface AuthContextValue {
  session: Session | null
  isLoading: boolean
  error: string | null
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  isLoading: true,
  error: null,
})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const init = async () => {
      try {
        const supabase = createClient()
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          throw sessionError
        }

        if (mounted) {
          setSession(initialSession)
          setIsLoading(false)
        }

        if (initialSession?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('preferred_lang')
            .eq('id', initialSession.user.id)
            .single()
          if (profile?.preferred_lang && mounted) {
            const lang = profile.preferred_lang as Lang
            useAppStore.getState().setLanguage(lang)
          }
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
          if (mounted) {
            setSession(newSession)
            setIsLoading(false)
          }
          if (newSession?.user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('preferred_lang')
              .eq('id', newSession.user.id)
              .single()
            if (profile?.preferred_lang && mounted) {
              const lang = profile.preferred_lang as Lang
              useAppStore.getState().setLanguage(lang)
            }
          }
        })

        return () => {
          subscription.unsubscribe()
        }
      } catch (err) {
        if (mounted) {
          setError((err as Error).message || 'Auth initialization failed')
          setIsLoading(false)
        }
      }
    }

    const cleanup = init()
    return () => {
      mounted = false
      cleanup.then(fn => fn?.())
    }
  }, [])

  return (
    <AuthContext.Provider value={{ session, isLoading, error }}>
      {children}
    </AuthContext.Provider>
  )
}
