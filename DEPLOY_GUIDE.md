# JHS One Ai — Deployment Guide

## 📋 GitHub Push er Jonno Ja Lagbe

### 1. GitHub Account
- Ekta GitHub account (free: github.com)
- **Na thakle:** github.com/signup → email diye account khulen

### 2. New Repository (Repo)
GitHub e giye:
1.右上角 `+` → **New repository**
2. Repository name: `jhs-one-ai`
3. Description: `JHS One Ai - Multi-AI Chat Platform by JH Soft Corporation`
4. **Public** rakhen (free hosting er jonno)
5. **Don't initialize** with README (amader already achhe)
6. ✅ Create repository

### 3. Git Install (PC te)
```bash
# Check koren git achhe kina:
git --version

# Na thakle install:
# Windows: https://git-scm.com/downloads
# Mac: brew install git
# Linux: sudo apt install git
```

### 4. Git Configure (Ekbar)
```bash
git config --global user.name "Md Junayed Hossain Anik"
git config --global user.email "your-email@example.com"
```

---

## 🚀 Push Command (Copy-Paste Ready)

```bash
# Step 1: Project folder e jaan
cd /root/jhs-one-ai

# Step 2: Git initialize
git init

# Step 3: Sob file add koren
git add .

# Step 4: First commit
git commit -m "init: complete JHS One Ai - by JH Soft Corporation"

# Step 5: GitHub repo connect (YOUR_USERNAME change koren)
git remote add origin https://github.com/YOUR_USERNAME/jhs-one-ai.git

# Step 6: Push koren
git push -u origin main
```

**Username + Token na chaile:**
```bash
# SSH use korte chaile (easier):
git remote add origin git@github.com:YOUR_USERNAME/jhs-one-ai.git
```

---

## 🔑 API Keys Collection (27 Keys)

| Provider | Keys | Where to Get |
|----------|------|-------------|
| **Gemini** | 10 keys | https://aistudio.google.com/apikey |
| **Groq** | 10 keys | https://console.groq.com/keys |
| **OpenRouter** | 5 keys | https://openrouter.ai/keys |
| **Simbanova** | 2 keys | Simbanova website |

**.env.local file e fill koren:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxx
GEMINI_KEY_0=AIza...
GEMINI_KEY_1=AIza...
... (sab 27 ta key)
```

---

## 🗄️ Supabase Setup

1. Go to https://supabase.com → Sign up free
2. **New Project** → Name: `jhs-one-ai`
3. Database password set koren → Create
4. Wait 1-2 minutes for project ready
5. **SQL Editor** → New Query → Paste contents of `supabase/migrations/00001_schema.sql` → Run
6. **Authentication** → Providers → **Google** → Enable
   - Client ID + Secret lagbe (Google Cloud Console theke)
7. **Project Settings** → API → Copy URL + anon key

### Google OAuth Setup
1. Go to https://console.cloud.google.com
2. Create project → APIs & Services → Credentials
3. **OAuth consent screen** → External → Fill form
4. **Create OAuth client ID** → Web application
5. Redirect URI: `https://YOUR-PROJECT.supabase.co/auth/v1/callback`
6. Copy Client ID + Secret → Supabase Auth → Google → Paste

---

## 🚀 Vercel Deploy

1. Go to https://vercel.com → Sign up with GitHub
2. **Add New Project** → Import `jhs-one-ai` repo
3. **Environment Variables** → Add ALL from `.env.local`
4. **Deploy** → Vercel auto build + deploy
5. After deploy, copy your URL (e.g., `https://jhs-one-ai.vercel.app`)
6. Go to Supabase → Auth → Google → Add redirect: `https://jhs-one-ai.vercel.app/auth/callback`

---

## 👑 Admin Access Setup

```sql
-- Supabase SQL Editor e run koren:
UPDATE app_settings 
SET value = '["your-email@gmail.com"]'::jsonb
WHERE key = 'admin_emails';
```

Then visit: `https://your-domain.vercel.app/admin`

---

## 🧪 Local Test

```bash
npm run dev
# Browser e: http://localhost:3000
```

---

## ❓ Help

Email: jhunayed@jhsoftcorporation.com
Company: JH Soft Corporation
Owner: Md Junayed Hossain Anik
