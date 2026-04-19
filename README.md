# AXIS

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
- `STRIPE_PRO_PRICE_ID` | Stripe recurring monthly price for AXIS Pro
- `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret
- `SUPABASE_DB_URL` | Direct Postgres connection string for server-side billing sync
- `RESEND_API_KEY` | Resend API key (for emails)

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
