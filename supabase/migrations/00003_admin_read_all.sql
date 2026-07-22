-- Allow admins to read all records across the database
-- Admin users are identified by their email being in the admin_emails app_settings

-- Profiles: admins can read all profiles
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  USING (
    auth.email() IN (
      SELECT jsonb_array_elements_text(value)
      FROM app_settings
      WHERE key = 'admin_emails'
    )
  );

-- Conversations: admins can read all conversations
DROP POLICY IF EXISTS "Admins can read all conversations" ON conversations;
CREATE POLICY "Admins can read all conversations"
  ON conversations FOR SELECT
  USING (
    auth.email() IN (
      SELECT jsonb_array_elements_text(value)
      FROM app_settings
      WHERE key = 'admin_emails'
    )
  );

-- Messages: admins can read all messages
DROP POLICY IF EXISTS "Admins can read all messages" ON messages;
CREATE POLICY "Admins can read all messages"
  ON messages FOR SELECT
  USING (
    auth.email() IN (
      SELECT jsonb_array_elements_text(value)
      FROM app_settings
      WHERE key = 'admin_emails'
    )
  );

-- Provider logs: admins can read all provider_logs
DROP POLICY IF EXISTS "Admins can read all provider_logs" ON provider_logs;
CREATE POLICY "Admins can read all provider_logs"
  ON provider_logs FOR SELECT
  USING (
    auth.email() IN (
      SELECT jsonb_array_elements_text(value)
      FROM app_settings
      WHERE key = 'admin_emails'
    )
  );
