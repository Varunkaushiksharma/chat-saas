# Architecture: how Replyly works

## 1. What we use, and why
| Layer | Tech | Why |
|---|---|---|
| Framework | Next.js 16 App Router, React 19, TypeScript | Pages and API routes in one codebase; one deploy |
| Styling / motion | Tailwind v4, Motion | Fast custom UI, scroll and 3D animation |
| Database | Supabase Postgres + pgvector | Relational data and vector search in one place |
| Auth | Supabase Auth (email + password) | Secure, hosted, JWT cookies |
| AI | Gemini `gemini-3.1-flash-lite` (chat), `gemini-embedding-001` (768-d vectors) | Free tier |
| Hosting | Vercel (region Mumbai, near the database) | Free, zero-config for Next.js |

The AI sits behind a small `LLMProvider` interface (`chat`, `json`, `embed`), so Gemini can be swapped for another model by writing one adapter.

## 2. Authentication
- Users sign up with email and password. Supabase issues a signed **JWT** (ES256) stored in cookies by `@supabase/ssr`.
- `src/proxy.ts` (Next 16's replacement for middleware) checks the token with `getClaims()`, which verifies the signature **locally with no network call**, and refreshes cookies. Unauthenticated users are redirected from `/dashboard`.
- Every API route calls `requireUser()`, which verifies again and returns a Supabase client **acting as the user**. Row Level Security then limits every query to that user's business, so even a bug in a route cannot leak another tenant's rows.
- The **service-role key** (bypasses RLS) is used only on the server, for the public widget (the customer has no account) and for creating a workspace.
- Trade-off to mention honestly: because the token is verified locally, a copied cookie still works until it expires (~60 min) after logout. A stricter `getUser()` check can be used for sensitive actions.
- Security extras: signup shows a clear demo notice, tenant isolation tested with two accounts, widget keys are public by design and can be locked to allowed domains.

## 3. Multi-tenancy
`tenants` (a business) and `tenant_members` (user to business). Every table carries `tenant_id`. A policy like `tenant_id in (select my_tenant_ids())` makes the database enforce isolation.

## 4. How a customer message is answered (RAG)
1. **Small talk shortcut**: "hi", "thanks", "ok" get a canned reply, no AI call.
2. **Keyword rules** run before the AI: "always hand off" and "forbidden topic".
3. The question is turned into a vector (embedding). For short follow-ups the previous question is included.
4. `match_kb_chunks` (pgvector, HNSW cosine index) returns the 5 closest knowledge chunks.
5. **Confidence gate**: if the best match scores below the bot's threshold (default 0.55), skip the AI and return the fallback message plus hand-off. This is the main hallucination guard.
6. Otherwise Gemini answers under a strict system prompt: use only the supplied context, never invent prices or policies.
7. If the reply equals the fallback, the conversation flips to "human" and the bot stays quiet until the owner replies or presses "Hand back to bot".

The widget and the dashboard "Test chat" share one function (`runTurn`), so what you test is what customers get.

## 5. Knowledge ingestion
- Structured sections are stored as labelled paragraphs ("Label: value") with reserved titles, and a completeness score tells the owner what is missing.
- Text is split, embedded in batches of 50, and replaced only after embedding succeeds (a failure never leaves a half-empty bot).
- **Files**: `unpdf` for PDF, `mammoth` for DOCX, plain readers for the rest. Limit 4 MB (Vercel's body limit is about 4.5 MB).
- **Website import**: reads robots.txt, finds pages via sitemap or links, scores them (about, pricing, FAQ first), up to 30 pages in a 40 s budget, extracts text and JSON-LD facts. Gemini in JSON mode drafts the profile; the owner **reviews before saving**. Page text is treated as untrusted (prompt-injection resistant).
- **SSRF protection**: the fetcher allows only http/https on ports 80/443, blocks private, loopback, link-local and mapped IPv6 addresses **at connect time** (defeats DNS tricks), re-checks every redirect, and caps size, time, and decompression.

## 6. The widget
`public/widget.js` is plain JavaScript in a Shadow DOM, so site CSS cannot break it. It identifies the bot by a public key, checks the allowed-domains list, stores the conversation id in localStorage, and polls `/api/widget/poll` to show human replies.

## 7. Abuse and cost protection
Free Gemini has quotas, so public endpoints are limited: per IP, per conversation (40 messages), per workspace (300/hour, counted in the database so it works across serverless instances), plus an in-memory limiter as a first filter. `/api/ping` is a cheap keep-alive route; it never calls the AI.
