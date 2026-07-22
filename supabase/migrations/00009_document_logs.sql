-- Create document_logs table for tracking document processing
CREATE TABLE IF NOT EXISTS document_logs (
  id BIGSERIAL PRIMARY KEY,
  attachment_id UUID NOT NULL,
  user_id UUID NOT NULL,
  document_type TEXT NOT NULL,
  parser_used TEXT NOT NULL,
  ocr_used BOOLEAN DEFAULT FALSE,
  pages_processed INT DEFAULT 0,
  text_length INT DEFAULT 0,
  language TEXT,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  processing_time INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add document metadata columns to provider_logs
ALTER TABLE provider_logs
  ADD COLUMN IF NOT EXISTS document_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS pages_processed INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS text_length INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ocr_used BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS parser_used TEXT;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_document_logs_user ON document_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_document_logs_attachment ON document_logs(attachment_id);
CREATE INDEX IF NOT EXISTS idx_document_logs_type ON document_logs(document_type);
CREATE INDEX IF NOT EXISTS idx_document_logs_ocr ON document_logs(ocr_used) WHERE ocr_used = TRUE;
CREATE INDEX IF NOT EXISTS idx_provider_logs_document ON provider_logs(document_enabled) WHERE document_enabled = TRUE;

-- RLS
ALTER TABLE document_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own document logs"
  ON document_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own document logs"
  ON document_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admin can view all document logs
CREATE POLICY "Admins can view all document logs"
  ON document_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM app_settings
      WHERE key = 'admin_emails'
      AND value @> to_jsonb(auth.jwt() ->> 'email')
    )
  );
