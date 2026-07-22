# JHS One AI — Admin Setup Guide

## Step 1: Log in with Google

1. Go to your deployed site (e.g. `https://your-site.vercel.app`)
2. Click **Get Started Free** or go to `/login`
3. Sign in with your **Google account**
4. After login you'll be at `/chat`

---

## Step 2: Make yourself admin

Admin access is controlled by the `app_settings` table in Supabase. You need to add your email to the `admin_emails` setting.

### Via Supabase Dashboard

1. Go to [Supabase Dashboard](https://supabase.com) → your project
2. Go to **SQL Editor**
3. Run this SQL:

```sql
INSERT INTO app_settings (key, value)
VALUES ('admin_emails', '["your.email@gmail.com"]')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
```

Replace `"your.email@gmail.com"` with the **exact** email you use for Google login. For multiple admins:

```sql
INSERT INTO app_settings (key, value)
VALUES ('admin_emails', '["admin1@gmail.com", "admin2@gmail.com"]')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
```

4. Run the query
5. Go to `/admin` — you should now see the admin dashboard

### Verify

You should see "System Online" badge and admin navigation. If you get redirected to `/chat`, the email doesn't match.

---

## Step 3: Run the RLS migration

A migration file exists at `supabase/migrations/00002_fix_rls.sql`. Run it in Supabase SQL Editor:

```sql
DROP POLICY IF EXISTS "Admins can manage app_settings" ON app_settings;
CREATE POLICY "Authenticated users can read app_settings"
  ON app_settings FOR SELECT
  TO authenticated
  USING (true);
```

This allows the chat API to read `active_providers` when non-admin users send messages.

---

## Step 4: Configure API keys

The app uses **environment variables** (not the database) for API keys. Add these in your **Vercel** project:

### Gemini (up to 10 keys)
```
GEMINI_KEY_0=your_gemini_key
GEMINI_KEY_1=...
```

### Groq (up to 10 keys)
```
GROQ_KEY_0=your_groq_key
GROQ_KEY_1=...
```

### OpenRouter (up to 5 keys)
```
OPENROUTER_KEY_0=your_openrouter_key
OPENROUTER_KEY_1=...
```

### Simbanova (up to 2 keys)
```
SIMBANOVA_KEY_0=your_simbanova_key
SIMBANOVA_KEY_1=...
```

> Add as few or as many as you want. Only keys you add will be used.

---

## Step 5: Enable/disable providers

1. Go to `/admin/settings`
2. You'll see toggles for Gemini, Groq, OpenRouter, Simbanova
3. Click **Enable** / **Disable** to control which providers are active
4. Settings are saved immediately to Supabase

---

## Step 6: Monitor the system

| Page | What you can do |
|---|---|
| `/admin` | Dashboard — total users, messages, conversations, active users today |
| `/admin/users` | View all registered users and join dates |
| `/admin/messages` | Message usage statistics |
| `/admin/providers` | Provider health — success/fail rates |
| `/admin/keys` | API key usage counts |
| `/admin/error-logs` | Error logs per provider |
| `/admin/settings` | Toggle providers, change language |

---

## Common issues

| Problem | Fix |
|---|---|
| **Login works but redirects back to login** | Run the RLS migration (Step 3) |
| **"Failed to fetch" when sending messages** | You skipped Step 3 — run the migration |
| **Admin page redirects to /chat** | Your email isn't in `admin_emails` (Step 2) |
| **All messages fail after login** | No API keys configured (Step 4) or all keys are exhausted |
| **App is slow / times out** | Vercel Hobby plan has 10s limit. Provider timeout is set to 8s. If a provider is slow, disable it in admin settings. |
| **Dark mode toggle not working** | Already fixed in latest deploy — rebuild and redeploy |
| **Want to reset all data** | Go to Supabase → Table Editor → delete rows from `conversations`, `messages`, `provider_logs` |

---

## Production checklist

| Status | Item |
|---|---|
| ☐ | Supabase project created and linked |
| ☐ | Google OAuth configured in Supabase |
| ☐ | Migration `00002_fix_rls.sql` run |
| ☐ | Your email added to `admin_emails` |
| ☐ | At least one API key configured per provider |
| ☐ | Vercel project deployed with environment variables |
| ☐ | Custom domain configured |
| ☐ | Test: login → send message → check admin dashboard |
