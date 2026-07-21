# JHS One Ai

**By JH Soft Corporation** — Owner: Md Junayed Hossain Anik

Your intelligent AI assistant powered by **4 AI providers** with **27 API keys** for maximum reliability.

## Features

### User Features
- Claude-style chat UI with streaming responses
- 4 AI providers: Gemini (10 keys), Groq (10 keys), OpenRouter (5 keys), Simbanova (2 keys)
- Smart load balancer with automatic key rotation
- Auto fallback if one provider fails
- Markdown + code highlighting with copy button
- Dark/Light theme
- Bangla + English language support
- Conversation history with search, rename, delete
- Auto-title generation
- Chat export (TXT/MD)

### Admin Panel
- Dashboard with user/message/conversation stats
- User management
- Message analytics
- Provider health monitoring
- API key status overview (all 27 keys)
- Toggle providers on/off
- Error logs viewer
- App settings

## Tech Stack

- **Frontend:** Next.js 14 + TypeScript + Tailwind CSS
- **Backend:** Next.js API routes (serverless)
- **Auth:** Supabase Auth (Google OAuth)
- **Database:** Supabase PostgreSQL
- **Hosting:** Vercel (free)
- **AI:** Gemini, Groq, OpenRouter, Simbanova

## Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/your-username/jhs-one-ai.git
cd jhs-one-ai
npm install
```

### 2. Supabase Setup

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to Authentication → Providers → Enable Google
3. Copy your project URL and anon key
4. Go to SQL Editor → Run the migration from `supabase/migrations/00001_schema.sql`
5. Go to Settings → API → Copy keys

### 3. Environment Variables

Copy `.env.example` to `.env.local` and fill in all values:

```bash
cp .env.example .env.local
```

Fill in:
- Supabase URL + keys
- All 27 API keys (Gemini x10, Groq x10, OpenRouter x5, Simbanova x2)
- Site URL

### 4. Run Locally

```bash
npm run dev
```

### 5. Deploy to Vercel

```bash
npx vercel --prod
```

Add all environment variables in Vercel dashboard.

## API Key Setup

### Gemini (Free)
1. Go to [aistudio.google.com](https://aistudio.google.com/apikey)
2. Create up to 10 API keys

### Groq (Free)
1. Go to [console.groq.com](https://console.groq.com)
2. Create up to 10 API keys

### OpenRouter (Free Credits)
1. Go to [openrouter.ai](https://openrouter.ai/keys)
2. Create up to 5 API keys

### Simbanova
1. Sign up at Simbanova
2. Create 2 API keys

## Project Structure

```
jhs-one-ai/
├── src/
│   ├── app/              # Pages + API routes
│   ├── components/       # React components
│   │   ├── ui/          # Base UI components
│   │   ├── chat/        # Chat interface
│   │   ├── sidebar/     # Conversation sidebar
│   │   ├── landing/     # Landing page
│   │   ├── admin/       # Admin panel
│   │   └── shared/      # Shared components
│   ├── lib/
│   │   ├── ai/          # AI router + providers
│   │   ├── supabase/    # Supabase clients
│   │   ├── i18n/        # Translations
│   │   ├── hooks/       # React hooks
│   │   └── utils/       # Utilities
│   ├── store/           # Zustand stores
│   ├── types/           # TypeScript types
│   └── middleware.ts     # Auth middleware
└── supabase/
    └── migrations/       # Database schema
```

## Admin Access

1. After login, go to Supabase dashboard → Table Editor → `app_settings`
2. Add your email to the `admin_emails` array
3. Visit `/admin` to access the admin panel

## License

Private — JH Soft Corporation
