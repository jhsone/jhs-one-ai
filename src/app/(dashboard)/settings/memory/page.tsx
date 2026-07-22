'use client'

import React, { useState, useEffect } from 'react'
import { Brain, Search, Trash2, Plus, Edit2, Check, X, Loader2, Sparkles, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { MemoryItem, MemoryCategory } from '@/lib/memory/types'

export default function MemorySettingsPage() {
  const [memories, setMemories] = useState<MemoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Form states
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')
  const [newCategory, setNewCategory] = useState<MemoryCategory>('fact')

  const [editKey, setEditKey] = useState('')
  const [editValue, setEditValue] = useState('')

  const supabase = createClient()

  const fetchMemories = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.append('q', searchQuery)
      if (selectedCategory && selectedCategory !== 'all') params.append('category', selectedCategory)

      const res = await fetch(`/api/memory?${params.toString()}`)
      const data = await res.json()
      if (data.memories) {
        setMemories(data.memories)
      }
    } catch (err) {
      console.error('Failed to load memories:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMemories()
  }, [searchQuery, selectedCategory])

  const handleSaveMemory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newKey.trim() || !newValue.trim()) return

    try {
      const res = await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category_id: newCategory,
          key: newKey.trim(),
          value: newValue.trim(),
        }),
      })
      if (res.ok) {
        setNewKey('')
        setNewValue('')
        setIsAdding(false)
        fetchMemories()
      }
    } catch (err) {
      console.error('Failed to save memory:', err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this memory?')) return
    try {
      const res = await fetch(`/api/memory/delete?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        setMemories(memories.filter(m => m.id !== id))
      }
    } catch (err) {
      console.error('Failed to delete memory:', err)
    }
  }

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to clear ALL long-term memories? This action cannot be undone.')) return
    try {
      const res = await fetch('/api/memory/clear', { method: 'POST' })
      if (res.ok) {
        setMemories([])
      }
    } catch (err) {
      console.error('Failed to clear memories:', err)
    }
  }

  const startEdit = (mem: MemoryItem) => {
    setEditingId(mem.id)
    setEditKey(mem.key)
    setEditValue(mem.value)
  }

  const saveEdit = async (id: string, category_id: MemoryCategory) => {
    if (!editKey.trim() || !editValue.trim()) return
    try {
      const res = await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category_id,
          key: editKey.trim(),
          value: editValue.trim(),
        }),
      })
      if (res.ok) {
        setEditingId(null)
        fetchMemories()
      }
    } catch (err) {
      console.error('Failed to update memory:', err)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Brain className="h-7 w-7 text-blue-600" />
            Long-Term Memory Engine
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage what JHS One AI remembers about you across conversations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Memory
          </button>
          <button
            onClick={handleClearAll}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium transition-colors border border-red-200 dark:border-red-900"
          >
            <Trash2 className="h-4 w-4" />
            Clear All
          </button>
        </div>
      </div>

      {/* Add Memory Modal / Box */}
      {isAdding && (
        <form onSubmit={handleSaveMemory} className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Add New Memory</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
              <select
                value={newCategory}
                onChange={e => setNewCategory(e.target.value as MemoryCategory)}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100"
              >
                <option value="profile">User Profile</option>
                <option value="preference">Preferences</option>
                <option value="fact">Long-term Fact</option>
                <option value="conversation">Conversation</option>
                <option value="project">Project</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Key (e.g. Preferred Language)</label>
              <input
                type="text"
                value={newKey}
                onChange={e => setNewKey(e.target.value)}
                placeholder="e.g. Preferred Language"
                required
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Value (e.g. Bangla)</label>
              <input
                type="text"
                value={newValue}
                onChange={e => setNewValue(e.target.value)}
                placeholder="e.g. Bangla"
                required
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
            >
              Save Memory
            </button>
          </div>
        </form>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search memories..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {['all', 'profile', 'preference', 'fact', 'conversation', 'project'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Memory List */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : memories.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <Sparkles className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto" />
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">No memories found</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
              JHS One AI automatically learns preferences and stable facts as you chat, or you can add them manually.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {memories.map(mem => (
              <div key={mem.id} className="p-4 flex items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
                      {mem.category_id}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">source: {mem.source}</span>
                  </div>

                  {editingId === mem.id ? (
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        value={editKey}
                        onChange={e => setEditKey(e.target.value)}
                        className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded text-gray-900 dark:text-gray-100 w-1/3"
                      />
                      <input
                        type="text"
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded text-gray-900 dark:text-gray-100 flex-1"
                      />
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{mem.key}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300 break-words">{mem.value}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {editingId === mem.id ? (
                    <>
                      <button
                        onClick={() => saveEdit(mem.id, mem.category_id)}
                        className="p-1.5 bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-100"
                        title="Save"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200"
                        title="Cancel"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEdit(mem)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(mem.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
