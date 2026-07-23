const store = new Map<string, number[]>()

const FIVE_MIN = 5 * 60 * 1000

export function rateLimit(
  key: string,
  maxRequests: number = 30,
  windowMs: number = FIVE_MIN
): { allowed: boolean; remaining: number; retryAfter: number } {
  const now = Date.now()
  const timestamps = store.get(key) || []
  const recent = timestamps.filter((t) => now - t < windowMs)

  if (recent.length >= maxRequests) {
    const retryAfter = Math.ceil((recent[0] + windowMs - now) / 1000)
    return { allowed: false, remaining: 0, retryAfter }
  }

  recent.push(now)
  store.set(key, recent)
  return { allowed: true, remaining: maxRequests - recent.length, retryAfter: 0 }
}

export function rateLimitMiddleware(
  request: Request,
  maxRequests?: number,
  windowMs?: number
): Response | null {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const result = rateLimit(`api:${ip}`, maxRequests, windowMs)

  if (!result.allowed) {
    return new Response(
      JSON.stringify({ error: 'Too many requests. Please try again later.' }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(result.retryAfter),
          'X-RateLimit-Remaining': '0',
        },
      }
    )
  }

  return null
}
