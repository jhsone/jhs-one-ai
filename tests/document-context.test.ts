import { describe, it, expect } from 'vitest'
import { extractPageNumberFromQuery } from '../src/lib/document/context'

describe('extractPageNumberFromQuery', () => {
  it('should extract page number from "page 5"', () => {
    expect(extractPageNumberFromQuery('what is on page 5?')).toBe(5)
  })

  it('should extract page number from "page 12"', () => {
    expect(extractPageNumberFromQuery('see page 12 of the document')).toBe(12)
  })

  it('should return null when no page reference', () => {
    expect(extractPageNumberFromQuery('what is this about?')).toBeNull()
  })

  it('should return null for empty query', () => {
    expect(extractPageNumberFromQuery('')).toBeNull()
  })
})
