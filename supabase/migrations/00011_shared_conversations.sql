-- Shared conversations for public links

CREATE TABLE IF NOT EXISTS shared_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_shared_conversations_token ON shared_conversations(token);
CREATE INDEX IF NOT EXISTS idx_shared_conversations_user ON shared_conversations(user_id);

ALTER TABLE shared_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own shares" ON shared_conversations
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Public can read active shares by token
CREATE POLICY "Anyone can view active shared conversations" ON shared_conversations
  FOR SELECT TO anon, authenticated
  USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));
