-- Add routing metadata columns to provider_logs
ALTER TABLE provider_logs
  ADD COLUMN IF NOT EXISTS fallback_provider TEXT,
  ADD COLUMN IF NOT EXISTS retry_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS health_score INT;

-- Index for routing queries
CREATE INDEX IF NOT EXISTS idx_provider_logs_fallback ON provider_logs(fallback_provider);
CREATE INDEX IF NOT EXISTS idx_provider_logs_health ON provider_logs(health_score);
