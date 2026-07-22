-- Create attachments table
CREATE TABLE IF NOT EXISTS attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  conversation_id UUID REFERENCES conversations ON DELETE CASCADE NOT NULL,
  message_id BIGINT REFERENCES messages ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size INT NOT NULL,
  cloudinary_public_id TEXT NOT NULL,
  cloudinary_url TEXT NOT NULL,
  thumbnail_url TEXT,
  width INT,
  height INT,
  page_count INT,
  context_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_attachments_user ON attachments(user_id);
CREATE INDEX IF NOT EXISTS idx_attachments_conversation ON attachments(conversation_id);
CREATE INDEX IF NOT EXISTS idx_attachments_message ON attachments(message_id);
CREATE INDEX IF NOT EXISTS idx_attachments_type ON attachments(file_type);
CREATE INDEX IF NOT EXISTS idx_attachments_created ON attachments(created_at DESC);

-- RLS
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

-- Users can CRUD their own attachments
CREATE POLICY "Users can read own attachments"
  ON attachments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own attachments"
  ON attachments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own attachments"
  ON attachments FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can read all
CREATE POLICY "Admins can read all attachments"
  ON attachments FOR SELECT
  USING (
    auth.email() IN (
      SELECT jsonb_array_elements_text(value)
      FROM app_settings
      WHERE key = 'admin_emails'
    )
  );
