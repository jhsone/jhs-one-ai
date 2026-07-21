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
    const supabase = createClient()

    supabase.auth.getSession().then(({ data: { session: initialSession }, error: sessionError }) => {
      if (!mounted) return
      if (sessionError) {
        setError(sessionError.message)
        setIsLoading(false)
        return
      }
      setSession(initialSession)
      setIsLoading(false)

      if (initialSession?.user) {
        supabase.from('profiles').select('preferred_lang').eq('id', initialSession.user.id).maybeSingle()
          .then(({ data: profile }) => {
            if (profile?.preferred_lang && mounted) {
              useAppStore.getState().setLanguage(profile.preferred_lang as Lang)
            }
          })
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return
      setSession(newSession)
      setIsLoading(false)

      if (newSession?.user) {
        supabase.from('profiles').select('preferred_lang').eq('id', newSession.user.id).maybeSingle()
          .then(({ data: profile }) => {
            if (profile?.preferred_lang && mounted) {
              useAppStore.getState().setLanguage(profile.preferred_lang as Lang)
            }
          })
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ session, isLoading, error }}>
      {children}
    </AuthContext.Provider>
  )
}
