# JHS One AI — Comprehensive Setup & Improvement Guide

Welcome to the **JHS One AI** setup and architectural improvement guide. This guide covers environment setup, database migrations, and advanced configurations for the **Long-Term Memory Engine**, **PDF Intelligence**, **Image OCR Engine**, and **DOCX Parser**.

---

## 1. Environment Variables (`.env.local`)

Create or update your `.env.local` file in the root directory with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# AI Provider API Keys (Provider-Independent Router)
GEMINI_API_KEY=your-gemini-api-key
GROQ_API_KEY=your-groq-api-key
OPENROUTER_API_KEY=your-openrouter-api-key
SIMBANOVA_API_KEY=your-simbanova-api-key

# Cloudinary (File Uploads & Document Attachments)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-key
CLOUDINARY_API_SECRET=your-cloudinary-secret
```

---

## 2. Database Setup & Supabase Migrations

JHS One AI utilizes Supabase with Row Level Security (RLS). Ensure both base schema and memory schema migrations are applied:

1. **Base Schema**: `supabase/migrations/00001_schema.sql` (Profiles, Conversations, Messages, Admin Users, Provider Logs, App Settings).
2. **Memory Schema**: `supabase/migrations/00002_memory_schema.sql` (Memories, Memory Categories, Memory Usage Logs + RLS policies).

You can apply these directly in your Supabase SQL Editor or via Supabase CLI.

---

## 3. Core Engine Improvements

### A. Long-Term Memory Engine (`src/lib/memory/`)
- **Smart Extractor**: Automatically captures stable user facts, preferences, long-term goals, and ongoing projects while ignoring transient chat greetings or random questions.
- **Scorer & Retrieval**: Calculates dynamic relevance scores based on keyword overlap, recency, and category weight (Profile & Preferences prioritized).
- **User Control**: Accessible via `/settings/memory` (Search, Edit, Delete, Clear All) and Admin Manager (`/admin/memory`).

### B. PDF Document Intelligence (`src/lib/document/pdf/`)
- Uses `pdf-parse` (v2 class API `PDFParse`) with robust fallback to extract full text and page-by-page content accurately.
- Cleans whitespace and parses page markers (`-- page X of Y --`) for precise citation and retrieval.

### C. Image OCR Engine (`src/lib/document/ocr/`)
- Powered by `tesseract.js` supporting multi-language OCR (English and Bengali via trained data files `eng.traineddata` and `ben.traineddata`).
- Automatically cleans OCR artifacts and normalizes line breaks.

### D. DOCX Parser (`src/lib/document/docx/`)
- Powered by `jszip` and `mammoth` to extract clean structured text and paragraphs from Microsoft Word documents.

---

## 4. Running the Project

```bash
# Install dependencies
npm install

# Run integration tests (Memory & Document Parsers)
npx tsx scripts/test-memory.ts
npx tsx scripts/test-integration.ts

# Run development server
npm run dev

# Build for production
npm run build
```
