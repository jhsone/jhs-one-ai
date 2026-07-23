'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { ArrowLeft, RotateCcw, Save } from 'lucide-react'
import Link from 'next/link'

export default function AdminSystemPromptPage() {
  const [prompt, setPrompt] = useState('')
  const [original, setOriginal] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [isCustom, setIsCustom] = useState(false)

  useEffect(() => {
    fetch('/api/admin/system-prompt')
      .then(r => r.json())
      .then(d => {
        setPrompt(d.prompt)
        setOriginal(d.prompt)
        setIsCustom(d.isCustom)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    try {
      const res = await fetch('/api/admin/system-prompt', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      const data = await res.json()
      if (res.ok) {
        setOriginal(prompt)
        setIsCustom(true)
        setMessage('System prompt updated successfully.')
      } else {
        setMessage(`Error: ${data.error}`)
      }
    } catch {
      setMessage('Failed to save. Check your connection.')
    }
    setSaving(false)
  }

  const handleReset = async () => {
    if (!confirm('Reset to default system prompt?')) return
    setSaving(true)
    try {
      await fetch('/api/admin/system-prompt', { method: 'DELETE' })
      // Reload to get default
      const res = await fetch('/api/admin/system-prompt')
      const data = await res.json()
      setPrompt(data.prompt)
      setOriginal(data.prompt)
      setIsCustom(false)
      setMessage('Reset to default system prompt.')
    } catch {
      setMessage('Failed to reset.')
    }
    setSaving(false)
  }

  const hasChanges = prompt !== original

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">System Prompt</h1>
          <p className="text-sm text-gray-500">
            {isCustom ? 'Custom prompt (overrides default)' : 'Using default system prompt'}
          </p>
        </div>
      </div>

      {message && (
        <div className={`px-4 py-3 rounded-lg text-sm ${
          message.startsWith('Error') || message.startsWith('Failed')
            ? 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900'
            : 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900'
        }`}>
          {message}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-96 w-full" />
        </div>
      ) : (
        <Card className="p-0">
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            className="w-full h-[500px] font-mono text-sm p-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-0 focus:outline-none focus:ring-0 resize-none"
            spellCheck={false}
          />
        </Card>
      )}

      <div className="flex items-center justify-between">
        <Button variant="secondary" onClick={handleReset} disabled={saving || loading}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset to Default
        </Button>
        <Button onClick={handleSave} disabled={!hasChanges || saving || loading}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  )
}
