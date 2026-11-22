<div align="center">

# Replyly

**An AI customer-support chatbot SaaS for small businesses.**
A business adds its own knowledge, pastes one line of code on its website, and customers get instant, accurate answers. When the AI isn't sure, it hands the chat to a human instead of guessing.

**[Live demo](https://chat-saas-seven.vercel.app)** · [Architecture](docs/ARCHITECTURE.md)

![Next.js](https://img.shields.io/badge/Next.js_16-000?logo=nextdotjs) ![TypeScript](https://img.shields.io/badge/TypeScript-3178c6?logo=typescript&logoColor=fff) ![Supabase](https://img.shields.io/badge/Supabase-3ecf8e?logo=supabase&logoColor=fff) ![Postgres](https://img.shields.io/badge/Postgres_+_pgvector-336791?logo=postgresql&logoColor=fff) ![Gemini](https://img.shields.io/badge/Google_Gemini-4285f4?logo=googlegemini&logoColor=fff) ![Vercel](https://img.shields.io/badge/Vercel-000?logo=vercel)

</div>

<!-- Add screenshots: save images in docs/screenshots/ and uncomment
![Landing page](docs/screenshots/landing.png)
![Dashboard](docs/screenshots/dashboard.png)
![Chat widget](docs/screenshots/widget.png)
-->

> Portfolio project. The live demo is for testing only: please use sample data, not real personal or business information.

## The problem
Small shops, clinics and restaurants get the same customer questions all day (price? timings? delivery?) and lose sales when nobody replies at night. Generic chatbots make things up. Replyly answers **only from what the business has told it**, and says "I'm not sure, let me get a person" otherwise.

## Features
- **Knowledge base with RAG.** Structured business profile, products, policies and FAQs, plus file upload (PDF, DOCX, MD, TXT, CSV, HTML). A completeness score shows what is still missing.
- **Import from a website link.** The crawler reads up to 30 pages (respecting robots.txt), AI drafts the profile, and the owner reviews before saving.
- **Guardrails.** Confidence threshold, "always hand off" and "forbidden topic" keyword rules, and a custom fallback message.
- **Human hand-off inbox.** The bot goes quiet until the owner replies or hands the chat back. "Teach the bot this answer" turns a reply into new knowledge.
- **Embeddable widget.** One script tag, isolated in a Shadow DOM, with an allowed-domains lock.
- **Multi-tenant security.** Every business sees only its own data, enforced by Postgres Row Level Security.
- **Abuse protection.** Limits per IP, per conversation and per workspace, so a free AI quota can't be drained.

## How an answer is produced
```
Customer message
  → small-talk shortcut ("hi", "thanks"): no AI call
  → keyword rules (always hand off / forbidden topic)
  → embed the question (Gemini) → pgvector search (top 5 chunks)
  → confidence gate: weak match → fallback message + hand-off to a human
  → Gemini answers using ONLY the retrieved context
```
Full details: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

## Engineering highlights
- **RAG with pgvector**: 768-d embeddings, HNSW cosine index, SQL function for retrieval.
- **Auth**: Supabase Auth with JWT cookies; local token verification in `proxy.ts`, plus a user-scoped database client so RLS applies to every query.
- **SSRF-safe website importer**: blocks private and loopback addresses at connect time (defeats DNS tricks), re-checks redirects, and caps size and time. Covered by unit tests.
- **Prompt-injection resistant** autofill: imported page text is treated as untrusted data.
- **Serverless-aware**: database-backed rate limits (in-memory state isn't shared on Vercel), 4 MB upload cap to fit Vercel's body limit.

## Tech stack
| | |
|---|---|
| App | Next.js 16 (App Router, React 19), TypeScript |
| UI | Tailwind CSS v4, Motion |
| Data and auth | Supabase (Postgres, pgvector, Auth, RLS) |
| AI | Google Gemini (chat and embeddings) behind a small `LLMProvider` interface |
| Hosting | Vercel |

## Run locally
1. `npm install`
2. Create a Supabase project and run `supabase/schema.sql` in the SQL editor.
3. Copy `.env.example` to `.env.local` and fill in the keys (Gemini key from Google AI Studio, Supabase keys from Project Settings).
4. `npm run dev`, then open http://localhost:3000

## Roadmap
- [ ] Email alerts when a chat is handed off
- [ ] WhatsApp and Instagram channels (needs Meta business approval; only the website widget exists today)
- [ ] Analytics: unanswered-question report, resolution rate
- [ ] Billing and plans

## Author
**Varun Sharma**, full-stack developer. [LinkedIn](https://www.linkedin.com/in/varun-sharma-5a6683337/) · [GitHub](https://github.com/Varunkaushiksharma)
