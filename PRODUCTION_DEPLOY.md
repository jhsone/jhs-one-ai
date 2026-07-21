# JHS One Ai — Production Deployment Guide

## 📌 Table of Contents
1. Vercel Environment Setup
2. Supabase Full Configuration
3. API Keys & Providers
4. Production Optimizations
5. Monitoring & Maintenance
6. Troubleshooting

---

## 1. 🚀 Vercel — Environment Variables Setup

### 1.1 Vercel Dashboard e jaan
- https://vercel.com → Your Project → **Settings** → **Environment Variables**

### 1.2 Sob env variable add koren:

| Variable | Value | Where to Get |
|----------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJxxx...` | Supabase → Settings → API → anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJxxx...` | Supabase → Settings → API → service_role key |
| `GEMINI_KEY_0` to `GEMINI_KEY_9` | `AIza...` | https://aistudio.google.com/apikey |
| `GROQ_KEY_0` to `GROQ_KEY_9` | `gsk_...` | https://console.groq.com/keys |
| `OPENROUTER_KEY_0` to `OPENROUTER_KEY_4` | `sk-or-...` | https://openrouter.ai/keys |
| `SIMBANOVA_KEY_0` to `SIMBANOVA_KEY_1` | `sb-...` | Simbanova dashboard |
| `NEXT_PUBLIC_SITE_URL` | `https://jhs-one-ai.vercel.app` | Your Vercel domain |

### 1.3 Important Settings in Vercel
```
Settings → General:
  ✓ Node.js Version: 22.x (or latest LTS)
  ✓ Build Command: next build (default)
  ✓ Output Directory: .next (default)

Settings → Functions:
  ✓ Function Region: auto (or choose nearest)
  ✓ Duration: 25 seconds min (for AI streaming)
  ✓ Memory: 512 MB (for AI SDKs)
```

---

## 2. 🗄️ Supabase — Full Configuration

### 2.1 Create Supabase Project
```
1. https://supabase.com → Sign in
2. New Project → Name: jhs-one-ai
3. Strong Database Password → Save it!
4. Region: Choose nearest to your users (e.g., Singapore for BD)
5. Wait ~2 minutes for provisioning
```

### 2.2 Run Database Migration
```
1. Go to Supabase → SQL Editor
2. New Query → Paste contents of `supabase/migrations/00001_schema.sql`
3. ⚡ Run (Ctrl+Enter)
```

### 2.3 Enable Google Auth

**Step A: Supabase Auth Settings**
```
1. Supabase → Authentication → Providers
2. Click Google → Enable
3. Save Client ID & Secret for next step
```

**Step B: Google Cloud Console**
```
1. Go to https://console.cloud.google.com
2. Create New Project (or select existing)
3. APIs & Services → OAuth consent screen
   - User Type: External
   - App name: JHS One Ai
   - Support email: your@email.com
   - Save
4. Credentials → Create OAuth client ID
   - Application type: Web application
   - Name: JHS One Ai
   - Authorized redirect URIs:
     https://YOUR_PROJECT.supabase.co/auth/v1/callback
   - Click Create
5. Copy Client ID + Client Secret
```

**Step C: Back to Supabase**
```
1. Supabase → Authentication → Providers → Google
2. Paste Client ID + Client Secret
3. Save
```

### 2.4 Configure Redirect URLs in Supabase
```
Authentication → URL Configuration:
  Site URL: https://jhs-one-ai.vercel.app
  Redirect URLs:
    https://jhs-one-ai.vercel.app/auth/callback
    http://localhost:3000/auth/callback (for local dev)
```

### 2.5 Enable Row Level Security (Already in SQL)
```
The migration already includes RLS policies.
Verify in Supabase → Table Editor → Each table → Policies
```

### 2.6 Set Admin Email
```
SQL Editor → Run this query:
  UPDATE app_settings
  SET value = '["your-email@gmail.com"]'::jsonb
  WHERE key = 'admin_emails';

Then visit: https://jhs-one-ai.vercel.app/admin
```

---

## 3. 🧠 AI Providers — Production Ready Setup

### 3.1 Gemini API (10 Keys)
```
1. Go to https://aistudio.google.com/apikey
2. Click "Create API Key" → 10 times (use different Google accounts if needed)
3. Add to Vercel as GEMINI_KEY_0 through GEMINI_KEY_9
```

### 3.2 Groq API (10 Keys)
```
1. Go to https://console.groq.com/keys
2. Create up to 10 keys
3. Add to Vercel as GROQ_KEY_0 through GROQ_KEY_9
```

### 3.3 OpenRouter (5 Keys)
```
1. Go to https://openrouter.ai/keys
2. Create 5 keys
3. Add to Vercel as OPENROUTER_KEY_0 through OPENROUTER_KEY_4
```

### 3.4 Simbanova (2 Keys)
```
1. Sign up at Simbanova
2. Create 2 API keys
3. Add as SIMBANOVA_KEY_0, SIMBANOVA_KEY_1
```

---

## 4. ⚡ Production Optimizations

### 4.1 Error Handling Improvements
Current system already handles:
✅ Provider fallback (if one fails, try next)
✅ Key rotation (picks least-used key)
✅ Rate limit protection
✅ Streaming timeout handling

### 4.2 To Add for Better Production Readiness

```typescript
// Add this to src/middleware.ts for rate limiting (optional):
// This prevents abuse of /api/chat
```

### 4.3 Database Indexing (Already done in SQL)
```
- idx_conversations_user
- idx_messages_conversation
- idx_provider_logs_success
- idx_messages_created
```

### 4.4 Security Checklist
```
✅ All API keys are server-side only (never in client bundle)
✅ Supabase RLS enabled on all tables
✅ Auth middleware protects /chat and /admin
✅ Google OAuth (no password storage)
✅ HTTPS enforced by Vercel
```

### 4.5 Performance Tips
```
1. Vercel → Settings → Functions → Memory: 512MB
2. For faster responses, enable Edge Runtime for chat API
3. Consider using Vercel's ISR for static pages
```

---

## 5. 📊 Monitoring & Maintenance

### 5.1 Vercel Analytics
```
1. Vercel → Dashboard → Your Project → Analytics
2. Enable Web Analytics (free)
3. Monitor: page views, errors, response times
```

### 5.2 Supabase Monitoring
```
1. Supabase → Database → Query Performance
2. Check for slow queries
3. Monitor Database size (free tier: 500MB)
```

### 5.3 Provider Health Check
```
Visit: /admin/providers
Check:
  ✅ Success rate per provider
  ✅ Average response time
  ✅ Active keys count
```

### 5.4 Regular Maintenance
```
Daily:
  - Check admin dashboard for error logs
  - Monitor key usage

Weekly:
  - Review provider logs in Supabase
  - Check database size

Monthly:
  - Rotate API keys if needed
  - Review and clean old conversations
  - Update dependencies: npm update
```

---

## 6. 🐛 Common Errors & Fixes

### 6.1 "Failed to fetch" / CORS Error
```
Fix: Add your domain in Supabase → Authentication → Settings
  Allowed callback URLs: https://jhs-one-ai.vercel.app/*
```

### 6.2 "Auth session missing" / Redirect Loop
```
Fix: 
  1. Clear browser cookies
  2. Check NEXTAUTH_SECRET / Supabase JWT settings
  3. Verify redirect URLs in Supabase
```

### 6.3 "All providers failed" in Chat
```
Fix:
  1. Go to /admin/keys → Check which keys are active
  2. Go to /admin/settings → Ensure providers are enabled
  3. Check Vercel environment variables
```

### 6.4 "Supabase row-level security violation"
```
Fix: Run the migration SQL again
  Or check each table has RLS policies in Supabase dashboard
```

### 6.5 "Serverless Function timeout" (10s on free Vercel)
```
Fix:
  1. Upgrade to Vercel Pro ($20/mo) for 60s timeout
  2. OR reduce streaming timeout in router.ts
  3. OR use a cheaper/faster AI model
```

### 6.6 Admin page says "Unauthorized"
```
Fix:
  UPDATE app_settings 
  SET value = '["your-email@gmail.com"]'::jsonb
  WHERE key = 'admin_emails';
```

---

## 7. ✅ Final Launch Checklist

```
□ All 27 API keys added to Vercel ENV
□ Supabase migration SQL executed
□ Google OAuth configured in Supabase + Google Cloud
□ Redirect URLs set in Supabase Auth
□ Admin email configured
□ Vercel deployment successful (green checkmark)
□ Landing page loads at https://jhs-one-ai.vercel.app
□ Google Sign-in works (test with real account)
□ Chat sends messages and receives AI responses
□ Admin panel accessible (/admin)
□ Provider stats visible in admin
□ Dark/light mode works
□ Bangla/English toggle works
□ All 16 routes load without errors
```

---

## 📞 Support

**Company:** JH Soft Corporation
**Owner:** Md Junayed Hossain Anik
**Product:** JHS One Ai

If you face any issue, contact your development team.
