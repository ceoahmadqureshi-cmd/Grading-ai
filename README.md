# 批改通 · Tutoring OS

Mobile-first, multi-tenant AI worksheet-grading platform for Hong Kong
tutoring centres (衔接中心). Next.js 14 + Supabase (Postgres + RLS) +
Tailwind + Vercel AI SDK, with a swappable Gemini/OpenAI grading engine.

## ⚠️ Before you do anything: rotate any exposed keys

If an API key was ever pasted into a chat, ticket, or public repo, treat it
as compromised — revoke it in the provider's console and generate a new one.
Keys belong only in `.env.local`, which is git-ignored by default in this
project. Never commit them.

## 1. Setup

```bash
cp .env.example .env.local
# fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
# SUPABASE_SERVICE_ROLE_KEY, and a Gemini key from https://aistudio.google.com/apikey
npm install
```

## 2. Database

Run the schema against your Supabase project (SQL editor, or CLI):

```bash
supabase db push   # or paste supabase/schema.sql into the SQL editor
```

Then seed the two demo centres, two teacher logins, and the one test
student (蘇卓怡, under Centre A only):

```bash
npx tsx supabase/seed.ts
```

This prints the two demo logins. **Change the demo password immediately**
if you deploy this anywhere beyond local testing.

## 3. Run

```bash
npm run dev
```

## Architecture notes

- **Multi-tenancy**: every tenant-scoped table (`profiles`, `students`,
  `grading_results`) is isolated by Postgres Row-Level Security keyed off
  each user's own `profiles.centre_id`. Policies are in `supabase/schema.sql`.
  A teacher's Supabase session can only ever see rows in their own centre —
  this is enforced at the database layer, not just in the UI.
- **Zero-image-storage policy**: `app/api/grade/route.ts` receives a
  worksheet photo as a transient base64 string, sends it once to the AI
  model, and discards the reference immediately after receiving the
  structured text result. No image ever touches Supabase Storage, disk, or
  browser storage — only the graded text rows are persisted.
- **Swappable AI layer**: `lib/ai/provider.ts` picks Gemini or OpenAI based
  on `AI_PROVIDER` env var, with model IDs also env-configurable. Default is
  `gemini-2.5-flash` (Gemini 1.5 has been retired by Google).
- **Grading guardrails**: `lib/ai/prompts.ts` encodes the pedagogical rules
  (preserve worksheet numbering, grade sub-questions independently,
  grade-appropriate math judgement, localized Cantonese terminology), and
  `lib/ai/schema.ts` enforces the structured JSON output contract with Zod.
- **Realtime sync**: `StudentDetailClient.tsx` subscribes to Postgres
  changes on `grading_results` so multiple teacher devices grading the same
  student stay in sync live.

## Known gaps to close before production

- Add rate limiting / abuse protection on `/api/grade` (AI calls cost money).
- Add centre-scoped admin tooling to create/rotate teacher accounts instead
  of the seed script.
- Add proper error boundaries and loading states throughout.
- Consider Supabase Auth email/password policies (MFA, password reset flow)
  before onboarding real centres.
