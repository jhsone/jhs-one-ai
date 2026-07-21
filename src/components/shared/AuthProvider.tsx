'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Session } from '@supabase/supabase-js'

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

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
          if (mounted) {
            setSession(newSession)
            setIsLoading(false)
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
