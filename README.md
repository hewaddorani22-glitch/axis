# lomoura

One system for everything you do | missions, revenue, habits, goals.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:

- `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/publishable key
- `NEXT_PUBLIC_APP_URL` | Public app URL used for billing redirects and metadata
- `STRIPE_SECRET_KEY` | Stripe secret key (for Pro subscriptions)
- `STRIPE_PRO_PRICE_ID` | Stripe recurring monthly price for lomoura Pro
- `STRIPE_PRO_YEARLY_PRICE_ID` | Optional Stripe recurring yearly price; if missing, checkout uses an inline EUR 89/year price
- `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret
- `SUPABASE_SERVICE_ROLE_KEY` | Server-only Supabase key for secure API routes and Stripe sync
- `SUPABASE_DB_PASSWORD` or `SUPABASE_DB_URL` | Optional, only needed for local schema scripts
- `RESEND_API_KEY` | Resend API key (for emails)
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Public Web Push VAPID key
- `VAPID_PRIVATE_KEY` | Private Web Push VAPID key
- `VAPID_SUBJECT` | Mailto/contact for Web Push (for example `mailto:you@domain.com`)

## Database

Run the schema against Supabase:

```bash
node scripts/run-schema.mjs
```

For existing databases, also apply the incremental SQL files in `scripts/`,
especially `scripts/005-streak-restore.sql` and `scripts/006-push-subscriptions.sql`.

## Deploy

```bash
npx vercel
```

## Tech Stack

- **Frontend:** Next.js 14, React 18, Tailwind CSS 3
- **Auth & Database:** Supabase (PostgreSQL + RLS)
- **Payments:** Stripe
- **Email:** Resend
- **Push:** Web Push API
- **Hosting:** Vercel
