# AXIS

One system for everything you do — missions, revenue, habits, goals.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

```bash
cp .env.local.example .env.local
```

| Variable | Where to find it | Required |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role | ✅ |
| `SUPABASE_DB_PASSWORD` | Supabase → Settings → Database | migrations only |
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API keys | Pro billing |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Webhooks → your endpoint | Pro billing |
| `RESEND_API_KEY` | resend.com → API Keys | emails |
| `NEXT_PUBLIC_APP_URL` | your deployment URL | share links |

> **Never commit `.env.local`.** It is in `.gitignore`.

## Database

Run the schema against Supabase:

```bash
node scripts/run-schema.mjs
```

## Deploy

```bash
npx vercel
```

## Tech Stack

- **Frontend:** Next.js 14, React 18, Tailwind CSS 3
- **Auth & Database:** Supabase (PostgreSQL + RLS)
- **Payments:** Stripe
- **Email:** Resend
- **Hosting:** Vercel
