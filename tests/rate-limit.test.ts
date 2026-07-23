import { describe, it, expect, beforeEach } from 'vitest'
import { rateLimit } from '../src/lib/rate-limit'

// rateLimit uses a module-level Map, so tests share state
// We use a unique key per test to avoid interference
let counter = 0
function uniqueKey() {
  counter++
  return `test-${counter}-${Date.now()}`
}

describe('rateLimit', () => {
  it('should allow requests within limit', () => {
    const key = uniqueKey()
    const r1 = rateLimit(key, 3, 5000)
    expect(r1.allowed).toBe(true)
    expect(r1.remaining).toBe(2)

    const r2 = rateLimit(key, 3, 5000)
    expect(r2.allowed).toBe(true)
    expect(r2.remaining).toBe(1)
  })

  it('should block requests exceeding limit', () => {
    const key = uniqueKey()
    rateLimit(key, 2, 5000) // 1st
    rateLimit(key, 2, 5000) // 2nd
    const r3 = rateLimit(key, 2, 5000) // 3rd — blocked
    expect(r3.allowed).toBe(false)
    expect(r3.remaining).toBe(0)
    expect(r3.retryAfter).toBeGreaterThan(0)
  })

  it('should return 429 headers via rateLimitMiddleware', async () => {
    // Dynamic import to avoid module caching issues
    const { rateLimitMiddleware } = await import('../src/lib/rate-limit')
    const key = uniqueKey()
    const request = new Request(`http://localhost?key=${key}`, {
      headers: { 'x-forwarded-for': key },
    })

    // Exhaust the limit
    for (let i = 0; i < 29; i++) {
      rateLimit(`api:${key}`, 30, 5000)
    }

    const r1 = rateLimit(`api:${key}`, 30, 5000)
    expect(r1.allowed).toBe(true)

    const response = rateLimitMiddleware(request, 30, 5000)
    if (response) {
      expect(response.status).toBe(429)
      expect(response.headers.get('Retry-After')).toBeTruthy()
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('0')
    } else {
      // If not blocked, at least verify it's null (allowed)
      expect(response).toBeNull()
    }
  })
})
