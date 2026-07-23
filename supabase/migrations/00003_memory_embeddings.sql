-- Semantic Embeddings migration for JHS One AI Long-Term Memory Engine

-- 1. Enable pgvector extension if available
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Add embedding column to memories table (e.g. 768 dimensions for Gemini text-embedding-004 or 1536 for OpenAI)
ALTER TABLE memories ADD COLUMN IF NOT EXISTS embedding vector(768);

-- 3. Create index for fast vector similarity search using HNSW or IVFFlat
CREATE INDEX IF NOT EXISTS idx_memories_embedding ON memories USING hnsw (embedding vector_cosine_ops);

-- 4. Create function to match memories by vector similarity
CREATE OR REPLACE FUNCTION match_memories(
  query_embedding vector,
  match_threshold float,
  match_count int,
  p_user_id uuid
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  category_id text,
  key text,
  value text,
  confidence float,
  source text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    memories.id,
    memories.user_id,
    memories.category_id,
    memories.key,
    memories.value,
    memories.confidence,
    memories.source,
    1 - (memories.embedding <=> query_embedding) AS similarity
  FROM memories
  WHERE memories.user_id = p_user_id
    AND memories.embedding IS NOT NULL
    AND 1 - (memories.embedding <=> query_embedding) > match_threshold
  ORDER BY memories.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
