-- Add api_key_index column to provider_logs for tracking which key was used
ALTER TABLE provider_logs
  ADD COLUMN IF NOT EXISTS api_key_index INT;

-- Index for filtering by key index
CREATE INDEX IF NOT EXISTS idx_provider_logs_key_index ON provider_logs(api_key_index);
