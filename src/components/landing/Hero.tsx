'use client'

import { useState } from 'react'
import { Sparkles, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/shared/AuthProvider'

export function Hero() {
  const router = useRouter()
  const { session, isLoading, error: authError } = useAuth()
  const [navigating, setNavigating] = useState(false)

  const handleClick = async () => {
    setNavigating(true)

    if (isLoading) {
      return
    }

    if (session) {
      router.push('/chat')
    } else {
      router.push('/login')
    }
  }

  if (authError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900">
        <div className="max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/30 mb-6">
            <Sparkles className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Configuration Required</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Supabase environment variables are not configured. Please set:
          </p>
          <code className="block bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-sm text-left mb-4">
            NEXT_PUBLIC_SUPABASE_URL<br />
            NEXT_PUBLIC_SUPABASE_ANON_KEY
          </code>
          <p className="text-sm text-gray-400">
            Add these to your Vercel Environment Variables and redeploy.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900">
      <div className="max-w-3xl text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 mb-8">
          <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
            Powered by JH Soft Corporation
          </span>
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 dark:text-gray-100 mb-6 tracking-tight">
          Meet{' '}
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            JHS One Ai
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-xl mx-auto leading-relaxed">
          Your intelligent AI assistant powered by multiple AI engines.
          Smart, fast, and always available.
        </p>

        <Button
          size="lg"
          onClick={handleClick}
          disabled={navigating || isLoading}
          className="text-base px-8 py-3 rounded-xl"
        >
          {navigating || isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Loading...
            </>
          ) : (
            <>
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </>
          )}
        </Button>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
          {[
            { label: 'Smart Responses', desc: '4 different AI providers for accurate answers' },
            { label: 'Always Available', desc: 'Automatic fallback ensures reliability' },
            { label: 'Privacy First', desc: 'Your conversations are stored securely' },
          ].map((f, i) => (
            <div key={i} className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{f.label}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
