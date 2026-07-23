import { extractMemoriesFromMessage, scoreAndFilterMemories } from '../src/lib/memory/extractor'
import { retrieveRelevantMemories, formatMemoriesForContext } from '../src/lib/memory/retrieval'
import { buildFullContext } from '../src/lib/document/context'

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`)
    process.exit(1)
  }
  console.log(`✓ PASS: ${message}`)
}

async function runMemoryTests() {
  console.log('==============================================')
  console.log('🧠 Starting Long-Term Memory Engine Tests')
  console.log('==============================================\n')

  // 1. Test Extraction
  console.log('--- TEST 1: Memory Extraction ---')
  const msg1 = 'My name is Junayed Hossain and I am a software engineer building JHS One AI. I prefer responding in Bangla.'
  const extracted = extractMemoriesFromMessage(msg1)
  const scored = scoreAndFilterMemories(extracted)

  assert(scored.length >= 3, `Extracted ${scored.length} valid memories (expected >= 3)`)
  const hasName = scored.some(m => m.key.toLowerCase().includes('name') && m.value.includes('Junayed'))
  const hasProj = scored.some(m => m.category === 'project' || m.value.includes('JHS One AI'))
  assert(hasName, 'Successfully extracted user name')
  assert(hasProj, 'Successfully extracted project/fact')
  console.log('Extracted Memories:', scored)
  console.log()

  // 2. Test Relevance Retrieval
  console.log('--- TEST 2: Memory Retrieval & Scoring ---')
  const mockMemories = [
    {
      id: 'm1',
      user_id: 'user-1',
      category_id: 'profile' as const,
      key: 'User Name',
      value: 'Junayed Hossain',
      confidence: 0.95,
      source: 'extracted' as const,
      access_count: 2,
      last_accessed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'm2',
      user_id: 'user-1',
      category_id: 'project' as const,
      key: 'Ongoing Project',
      value: 'Building JHS One AI multi-provider platform',
      confidence: 0.9,
      source: 'extracted' as const,
      access_count: 5,
      last_accessed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'm3',
      user_id: 'user-1',
      category_id: 'preference' as const,
      key: 'Favorite Color',
      value: 'Blue',
      confidence: 0.8,
      source: 'user_explicit' as const,
      access_count: 1,
      last_accessed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  ]

  const relevant = await retrieveRelevantMemories('How is the JHS One AI project going?', mockMemories)
  assert(relevant.some(m => m.key === 'Ongoing Project'), 'Retrieved project memory for project query')
  assert(relevant.some(m => m.category_id === 'profile'), 'Included profile memory by default')
  console.log('Relevant Retrieved Memories:', relevant.map(m => m.key))
  console.log()

  // 3. Test Context Builder Integration
  console.log('--- TEST 3: Context Builder Integration ---')
  const builtContext = buildFullContext(
    'Tell me about my project status',
    [],
    [],
    [],
    {},
    relevant
  )
  assert(builtContext.augmentedMessage.includes('JHS One AI'), 'Augmented message includes retrieved memory context')
  console.log('Augmented Message Preview:\n', builtContext.augmentedMessage.slice(0, 300))
  console.log()

  console.log('==============================================')
  console.log('🎉 ALL LONG-TERM MEMORY TESTS PASSED SUCCESSFULLY!')
  console.log('==============================================')
}

runMemoryTests().catch(err => {
  console.error('Memory test script crashed:', err)
  process.exit(1)
})
