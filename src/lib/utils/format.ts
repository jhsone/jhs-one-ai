export function formatDate(date: string | Date): string {
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString()
}

export function truncate(str: string, len: number = 50): string {
  if (str.length <= len) return str
  return str.slice(0, len) + '...'
}

export function generateTitle(content: string): string {
  const clean = content.replace(/[^\w\s]/g, '').trim()
  return clean.length > 60 ? clean.slice(0, 60) + '...' : clean
}
