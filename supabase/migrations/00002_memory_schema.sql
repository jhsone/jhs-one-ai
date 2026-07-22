-- Memory tables migration for JHS One AI Phase 5 Long-Term Memory Engine

-- 1. Memory categories reference table
CREATE TABLE IF NOT EXISTS memory_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO memory_categories (id, name, description) VALUES
  ('profile', 'User Profile', 'Name, preferred language, timezone, occupation'),
  ('preference', 'Preferences', 'Writing style, response length, favorite features, unit/language preferences'),
  ('fact', 'Long-term Facts', 'Stable facts, long-term goals, ongoing background facts'),
  ('conversation', 'Conversation Memory', 'Recent summaries, active topics, open tasks'),
  ('project', 'Project Memory', 'Ongoing software and personal projects')
ON CONFLICT (id) DO NOTHING;

-- 2. Memories table
CREATE TABLE IF NOT EXISTS memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  category_id TEXT REFERENCES memory_categories(id) DEFAULT 'fact',
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  confidence FLOAT DEFAULT 1.0 CHECK (confidence >= 0.0 AND confidence <= 1.0),
  source TEXT DEFAULT 'extracted' CHECK (source IN ('extracted', 'user_explicit', 'system')),
  access_count INT DEFAULT 0,
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Memory usage & audit logs table
CREATE TABLE IF NOT EXISTS memory_usage_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  memory_id UUID REFERENCES memories ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('created', 'retrieved', 'updated', 'deleted', 'cleared')),
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_memories_user_id ON memories(user_id);
CREATE INDEX IF NOT EXISTS idx_memories_category ON memories(category_id);
CREATE INDEX IF NOT EXISTS idx_memories_user_category ON memories(user_id, category_id);
CREATE INDEX IF NOT EXISTS idx_memory_logs_user_id ON memory_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_memory_logs_created ON memory_usage_logs(created_at DESC);

-- Enable Row Level Security
ALTER TABLE memory_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_usage_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- memory_categories: readable by everyone authenticated
CREATE POLICY "Categories are readable by authenticated users" ON memory_categories
  FOR SELECT TO authenticated USING (true);

-- memories: users can CRUD their own memories
CREATE POLICY "Users can view own memories" ON memories
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own memories" ON memories
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own memories" ON memories
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own memories" ON memories
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- memory_usage_logs: users can view and insert their own logs
CREATE POLICY "Users can view own memory logs" ON memory_usage_logs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own memory logs" ON memory_usage_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Admins can view all logs and statistics via service role or admin check
CREATE POLICY "Admins can view all memory logs" ON memory_usage_logs
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid())
  );

CREATE POLICY "Admins can view all memories for stats" ON memories
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid())
  );
