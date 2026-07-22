-- Add vision metadata columns to provider_logs
ALTER TABLE provider_logs
  ADD COLUMN IF NOT EXISTS vision_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS attachment_count INT DEFAULT 0;

-- Index for vision queries
CREATE INDEX IF NOT EXISTS idx_provider_logs_vision ON provider_logs(vision_enabled) WHERE vision_enabled = TRUE;
