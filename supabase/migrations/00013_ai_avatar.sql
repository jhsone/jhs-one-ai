-- Custom AI Avatar support
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ai_avatar_url TEXT;
