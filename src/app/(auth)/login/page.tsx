'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/shared/AuthProvider'
import { Sparkles, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const { session, isLoading: authLoading, error: authError } = useAuth()
  const [signingIn, setSigningIn] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && session) {
      router.push('/chat')
    }
  }, [authLoading, session, router])

  const handleSignIn = async () => {
    setSigningIn(true)
    setError(null)

    try {
      const supabase = createClient()
      const redirectUrl = `${window.location.origin}/auth/callback`

      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      })

      if (signInError) {
        setError(signInError.message)
        setSigningIn(false)
      }
    } catch (err) {
      setError((err as Error).message || 'Failed to sign in')
      setSigningIn(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900 px-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900 px-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900 px-4">
      <div className="max-w-sm w-full text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 mb-6">
          <Sparkles className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Welcome to JHS One Ai</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">Sign in to start chatting with your AI assistant</p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <Button
          size="lg"
          onClick={handleSignIn}
          disabled={signingIn}
          className="w-full"
        >
          {signingIn ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign in with Google
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
