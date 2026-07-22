-- Enhance provider_logs table with new fields
ALTER TABLE provider_logs
  ADD COLUMN IF NOT EXISTS model TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'success',
  ADD COLUMN IF NOT EXISTS tokens_used INT,
  ADD COLUMN IF NOT EXISTS response_time INT;

-- Migrate existing data: copy response_time_ms -> response_time, success -> status
UPDATE provider_logs SET response_time = response_time_ms WHERE response_time IS NULL;
UPDATE provider_logs SET status = 'success' WHERE success = true AND status = 'success';
UPDATE provider_logs SET status = 'failed' WHERE success = false AND status = 'success';

-- Index for admin queries
CREATE INDEX IF NOT EXISTS idx_provider_logs_provider ON provider_logs(provider);
CREATE INDEX IF NOT EXISTS idx_provider_logs_status ON provider_logs(status);
