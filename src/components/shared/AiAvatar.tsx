'use client'

import { useEffect, useState } from 'react'

interface AiAvatarProps {
  size?: number
  className?: string
  customUrl?: string | null
}

const gradientId = 'ai-avatar-gradient'

export function AiAvatar({ size = 32, className = '', customUrl }: AiAvatarProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(customUrl || null)

  useEffect(() => {
    if (customUrl) {
      setAvatarUrl(customUrl)
      return
    }
    fetch('/api/avatar')
      .then(r => r.json())
      .then(d => { if (d.url) setAvatarUrl(d.url) })
      .catch(() => {})
  }, [customUrl])

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt="AI Avatar"
        width={size}
        height={size}
        className={`flex-shrink-0 rounded-xl object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    )
  }

  const padding = Math.round(size * 0.18)
  const fontSize = Math.round(size * 0.38)
  const rx = Math.round(size * 0.25)

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      className={`flex-shrink-0 ${className}`}
      role="img"
      aria-label="JHS One AI"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2={size} y2={size}>
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
      </defs>
      <rect
        width={size}
        height={size}
        rx={rx}
        fill={`url(#${gradientId})`}
      />
      <text
        x={size / 2}
        y={size / 2}
        dy="0.35em"
        textAnchor="middle"
        fill="white"
        fontSize={fontSize}
        fontWeight="700"
        fontFamily="ui-sans-serif, system-ui, -apple-system, sans-serif"
      >
        JHS
      </text>
    </svg>
  )
}
