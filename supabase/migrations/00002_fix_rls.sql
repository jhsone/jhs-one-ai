-- Fix app_settings RLS: allow all authenticated users to read settings
-- (the API route needs to read active_providers for non-admin users)
DROP POLICY IF EXISTS "Admins can read settings" ON app_settings;

CREATE POLICY "Authenticated users can read settings"
  ON app_settings FOR SELECT
  USING (auth.role() = 'authenticated');

-- Admin-only settings can be further restricted at the app level
