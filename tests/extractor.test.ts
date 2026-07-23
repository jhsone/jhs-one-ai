import { describe, it, expect } from 'vitest'
import { extractMemoriesFromMessage, scoreAndFilterMemories } from '../src/lib/memory/extractor'
import type { ExtractedMemory, MemoryCategory } from '../src/lib/memory/types'

describe('extractMemoriesFromMessage', () => {
  it('should ignore greetings and short messages', () => {
    expect(extractMemoriesFromMessage('hi')).toEqual([])
    expect(extractMemoriesFromMessage('hello')).toEqual([])
    expect(extractMemoriesFromMessage('hey there')).toEqual([])
  })

  it('should extract user name from "my name is"', () => {
    const result = extractMemoriesFromMessage('Hi, my name is John Doe')
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      category: 'profile',
      key: 'User Name',
      value: 'John Doe',
      confidence: 0.95,
    })
  })

  it('should extract occupation from "I am a" with valid role', () => {
    const result = extractMemoriesFromMessage('I am a software engineer')
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      category: 'profile',
      key: 'User Occupation',
      value: 'software engineer',
    })
  })

  it('should NOT extract occupation from "I am a" with non-role text', () => {
    const result = extractMemoriesFromMessage('I am a going to the store')
    expect(result).toHaveLength(0)
  })

  it('should NOT extract occupation from "I am a very nice person"', () => {
    const result = extractMemoriesFromMessage('I am a very nice person')
    expect(result).toHaveLength(0)
  })

  it('should extract "I am a" with "an" article', () => {
    const result = extractMemoriesFromMessage('I am an engineer')
    expect(result).toHaveLength(1)
    expect(result[0].value).toBe('engineer')
  })

  it('should extract language preference', () => {
    const result = extractMemoriesFromMessage('I prefer speaking in bangla')
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      category: 'preference',
      key: 'Preferred Language',
      value: 'bangla',
    })
  })

  it('should extract response length preference', () => {
    const result = extractMemoriesFromMessage('I like short responses')
    expect(result).toHaveLength(1)
    expect(result[0].key).toBe('Response Length Preference')
  })

  it('should extract project from "building" statement', () => {
    const result = extractMemoriesFromMessage('I am building a chatbot project')
    const projects = result.filter(r => r.category === 'project')
    expect(projects.length).toBeGreaterThanOrEqual(1)
  })

  it('should extract long-term goal', () => {
    const result = extractMemoriesFromMessage('my goal is to launch this product by summer')
    expect(result).toHaveLength(1)
    expect(result[0].key).toBe('Long-term Goal')
  })

  it('should handle "i want to learn"', () => {
    const result = extractMemoriesFromMessage('I want to learn machine learning')
    expect(result).toHaveLength(1)
    expect(result[0].key).toBe('Long-term Goal')
  })
})

describe('scoreAndFilterMemories', () => {
  it('should filter out low confidence memories', () => {
    const memories: ExtractedMemory[] = [
      { category: 'profile' as MemoryCategory, key: 'Test', value: 'val', confidence: 0.5 },
      { category: 'profile' as MemoryCategory, key: 'Test2', value: 'val2', confidence: 0.9 },
    ]
    const result = scoreAndFilterMemories(memories)
    expect(result).toHaveLength(1)
    expect(result[0].confidence).toBe(0.9)
  })

  it('should filter out empty key or value', () => {
    const memories: ExtractedMemory[] = [
      { category: 'profile' as MemoryCategory, key: '', value: 'val', confidence: 0.9 },
      { category: 'profile' as MemoryCategory, key: 'key', value: '', confidence: 0.9 },
      { category: 'profile' as MemoryCategory, key: 'valid', value: 'valid', confidence: 0.9 },
    ]
    const result = scoreAndFilterMemories(memories)
    expect(result).toHaveLength(1)
    expect(result[0].key).toBe('valid')
  })
})
