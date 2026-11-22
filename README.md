# Replyly: AI customer-support chatbot for small businesses

A multi-tenant SaaS. A business signs up, gives the bot its knowledge (typed, uploaded, or imported from its website), pastes one line of code on its site, and customers get instant answers. The bot answers **only from the business's own knowledge**, and hands the chat to a human when it is unsure.

> Portfolio demo project. Please use sample data only.

## Features
- **Knowledge base with RAG**: structured profile, products, policies, FAQs; file upload (PDF, DOCX, MD, TXT, CSV, HTML)
- **Website import**: enter a URL, the crawler reads up to 30 pages, AI fills the profile, you review and save
- **Guardrails**: confidence threshold, "always hand off" and "forbidden topic" keyword rules, fallback message
- **Human hand-off inbox**: the bot goes silent until the owner replies or hands back; "Teach the bot this answer" turns a reply into knowledge
- **Embeddable widget**: one script tag, Shadow DOM, domain lock
- **Multi-tenant**: every business sees only its own data (Postgres Row Level Security)
- **Abuse protection**: per-IP, per-conversation, per-workspace limits

## Stack
Next.js 16 (App Router, React 19, TypeScript) · Tailwind CSS v4 · Motion · Supabase (Postgres, pgvector, Auth, RLS) · Google Gemini (chat + embeddings) · Vercel

How it all works, the auth design, and interview Q&A: **[docs/HOW-IT-WORKS.md](docs/HOW-IT-WORKS.md)**

## Run locally
1. `npm install`
2. Create a Supabase project, run `supabase/schema.sql` in the SQL editor.
3. Copy `.env.example` to `.env.local` and fill it in.
4. `npm run dev`

## Deploy (Vercel, free Hobby plan)
1. Push to GitHub, import the repo in Vercel.
2. Add the env vars from `.env.example`.
3. In Supabase, Authentication, URL Configuration: set Site URL to your Vercel URL and add `https://<your-domain>/auth/callback` to Redirect URLs.
4. For a live demo bubble on the landing page: create a bot, copy its public key (Install tab), set `NEXT_PUBLIC_DEMO_BOT_KEY`, redeploy.
5. Optional: point a free uptime monitor at `/api/ping` every 5 days so the free Supabase project doesn't pause.
