import { extractMemoriesFromMessage, scoreAndFilterMemories } from '../src/lib/memory/extractor'
import { retrieveRelevantMemories, formatMemoriesForContext } from '../src/lib/memory/retrieval'
import { generateEmbedding, cosineSimilarity } from '../src/lib/memory/embeddings'
import { buildFullContext } from '../src/lib/document/context'

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`)
    process.exit(1)
  }
  console.log(`✓ PASS: ${message}`)
}

async function runSemanticMemoryTests() {
  console.log('==================================================')
  console.log('🧠 Starting Semantic Vector Memory Engine Tests')
  console.log('==================================================\n')

  // 1. Test Embedding Generation & Cosine Similarity
  console.log('--- TEST 1: Semantic Embedding & Cosine Similarity ---')
  const emb1 = await generateEmbedding('Building JHS One AI software application')
  const emb2 = await generateEmbedding('Developing software project JHS One AI')
  const emb3 = await generateEmbedding('What is the weather today in Paris?')

  assert(emb1 !== null && emb1.length > 0, 'Generated embedding vector 1 successfully')
  assert(emb2 !== null && emb2.length > 0, 'Generated embedding vector 2 successfully')

  const simRelated = cosineSimilarity(emb1!, emb2!)
  const simUnrelated = cosineSimilarity(emb1!, emb3!)

  assert(simRelated > simUnrelated, `Semantic similarity of related text (${simRelated.toFixed(3)}) > unrelated (${simUnrelated.toFixed(3)})`)
  console.log()

  // 2. Test Semantic Retrieval with Vector Embeddings
  console.log('--- TEST 2: Hybrid Semantic Retrieval ---')
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
      embedding: await generateEmbedding('Junayed Hossain profile name'),
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
      embedding: await generateEmbedding('Building JHS One AI multi-provider platform'),
    }
  ]

  const relevant = await retrieveRelevantMemories('How is my software development project coming along?', mockMemories)
  assert(relevant.some(m => m.key === 'Ongoing Project'), 'Semantically retrieved project memory for conceptual query')
  console.log('Semantically Retrieved Memories:', relevant.map(m => m.key))
  console.log()

  console.log('==================================================')
  console.log('🎉 ALL SEMANTIC MEMORY TESTS PASSED SUCCESSFULLY!')
  console.log('==================================================')
}

runSemanticMemoryTests().catch(err => {
  console.error('Semantic memory test script crashed:', err)
  process.exit(1)
})
