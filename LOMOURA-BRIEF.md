# lomoura — Project Brief & Technical Specification

> This document contains the complete product vision, design decisions, feature specs, and technical roadmap for lomoura. It serves as the single source of truth for development.

---

## 1. Product Overview

**Name:** lomoura
**Tagline:** Your Business OS
**URL:** lomoura.com or lomoura.com (TBD)
**One-liner:** One system for everything you do — missions, revenue, habits, goals.

lomoura is a web-based productivity software that replaces the 6+ apps people juggle daily. It's not a blank canvas like Notion — it's an opinionated system that tells you what to focus on, tracks your money, and holds you accountable.

**Target audience:** Everyone who wants clarity — entrepreneurs, students, creators, professionals.
**Pricing:** Freemium. Free forever plan + $9/mo Pro.
**Marketing channel:** TikTok slideshows ("6 apps every entrepreneur needs" — lomoura is included in the list).

---

## 2. Design Language

### Brand Identity
- **Logo:** Abstract axis/crosshair — vertical line, horizontal line, center dot. Works in black and white, all sizes.
- **Aesthetic:** Premium, clean, human. Must look like it comes from a multi-million dollar company.
- **Vibe references:** Notion, Linear, Stripe — minimal, confident, no clutter.

### Visual Design (Landing Page)
- **Theme:** Light base (#FAFAFA) with dark contrast sections for testimonials and final CTA.
- **Accent color:** #CDFF4F (lime/chartreuse) used as keyword highlights with background, NOT gradient text.
- **Typography:** Outfit (display + body), JetBrains Mono (labels, badges).
- **Cards:** White (#FFFFFF) with light border (#E4E4E7), subtle hover lift.
- **NO AI aesthetics:** No gradient text, no radial glows, no grain overlays, no purple gradients. Clean, editorial, human.
- **Inspiration sites:** Logicc.com (highlighted keywords, trust logos, video embed), PhantomBuster (warm gradient hero, big stat cards, dark feature sections), Hunter.io (clean hero, product mockup, colored accent text).

### Visual Design (App/Dashboard)
- Can be dark theme (#09090B base) or match the light landing page — TBD during build.
- Sidebar navigation with all 6 modules equally weighted.
- Stat cards, bar charts, progress bars, streak indicators.
- Skeleton loading states everywhere — no empty screens, no flicker.

---

## 3. Features — Complete Specification

### 3.1 Command Center (Dashboard Home)
The first screen users see every morning.
- Personalized greeting with name + date
- 4 stat cards: MTD Revenue, Mission Completion (done/total), Longest Streak, Focus Score
- Mini-view of today's missions (clickable → Missions page)
- Mini-view of today's habits (clickable → Systems page)
- Revenue sparkline (last 30 days)
- Dynamic morning briefing: comparisons to yesterday/last week, goal deadline warnings, streak milestone alerts ("3 more days to hit 30!")
- NOT the same 4 cards every day — show what changed.

### 3.2 Mission Control
- Daily view: today's missions with checkboxes, priority (high/med/low), category tags
- Inline input to create new missions (no modal popups)
- Mark mission done: checkbox + subtle animation
- Calendar navigation: browse between days
- Stats bar: completion rate this week, streak (consecutive days with all missions done)
- **Free limit:** Max 5 missions/day

### 3.3 Revenue Tracker
- List of income streams (name, color)
- Add revenue entry: select stream, amount, date, optional note
- Monthly view: bar chart
- Stream breakdown: percentage split as horizontal bars
- MTD (Month to Date) sum displayed prominently
- **Free limit:** 1 income stream

### 3.4 Daily Systems (Habits)
- List of habits with today's status (done/not done)
- Tap/click to toggle completion
- Streak counter per habit
- Weekly heatmap (7 small bars per habit)
- Add new habit: name + emoji/icon
- **Free limit:** Max 3 habits

### 3.5 Goals
- List of goals with progress bars
- Create goal: title, target value, unit, deadline
- Manual update of current value
- Auto-calculated percentage
- Deadline warning when <14 days remaining and <80% achieved
- **Free limit:** Max 2 goals

### 3.6 Weekly Review (Pro only)
- Available every Sunday
- Auto-filled stats: missions completed, revenue earned, habit streaks
- 3 text fields: "Wins this week", "What didn't work", "Focus for next week"
- Past reviews browsable as timeline
- Reminder email on Sunday morning

### 3.7 Accountability Partner System
Invite-based system where users connect with friends and see each other's progress.
- **Invite flow:** Share invite link → partner signs up → connection established
- **Partner dashboard:** "You vs. Partner" comparison view
  - Side-by-side: streak length, daily completion, Focus Score
  - Comparison bars for Missions %, Habits %, Focus Score
  - Weekly dot grid showing which days each person completed
- **Partner list:** Shows all partners with:
  - Name, avatar, streak, today's grade (A+ to F), missions/habits completion
  - Status indicator: "On fire" / "Solid" / "Falling off"
  - Last active timestamp
- **Nudge feature:** If partner is inactive 2+ days, send a nudge (push notification: "King sent you a nudge. Complete your missions.")
- **Invite CTA:** Dashed border card at bottom to invite new partners
- This is a viral loop: every user invites at least one partner → organic growth

### 3.8 Prove It Mode (Public Profile)
Public-facing profile page at lomoura.com/prove/[username].
- **Profile shows:** Avatar, name, bio
- **Public stats:** Current streak (with fire emoji), today's grade, Focus Score, 30-day completion rate
- **28-day activity heatmap:** GitHub-style grid showing daily activity intensity
- **Achievements/badges:**
  - 30-Day Streak 🔥
  - First $10K Month 💰
  - Perfect Week ⚡
  - 100 Missions Done 🎯
  - (Revenue amounts on achievements are opt-in/private by default)
- **Shareable card:** Dark-themed card designed for screenshots. Shows grade, missions, habits, streak, and "lomoura.com/prove/username" watermark. Optimized for TikTok/Instagram stories.
- **Daily Scorecard:** Grade A+ to F based on:
  - Missions completed / total (40% weight)
  - Habits completed / total (40% weight)
  - Revenue logged today (10% weight)
  - Streak maintained (10% weight)
- **Copy link button:** One-click copy of profile URL
- Purpose: Users screenshot their scorecard/profile → post on social media → followers see lomoura branding → free marketing

### 3.9 Focus Score Algorithm
Weighted score (0-100) calculated daily:
- Mission completion rate: 40%
- Habit completion rate: 40%
- Streak length (normalized): 20%
Displayed in Command Center and on Prove It profile.

### 3.10 Streak System
- **Global streak:** Consecutive days with ≥1 mission completed AND ≥1 habit logged
- **Visual:** Prominent counter in Command Center + fire emoji after 7+ days
- **Milestones:** 7, 14, 30, 60, 90, 365 days with visual celebration
- **Streak Freeze (Pro):** 1x per month, saves streak for one missed day

---

## 4. Onboarding Flow

Triggered after first login. Must take <90 seconds.

1. "What describes you best?" → Entrepreneur / Student / Creator / Professional
2. "What's your main income stream?" → Freetext (creates first revenue stream)
3. "Set your first 3 missions for today" → 3 inline inputs
4. "Pick 2 daily habits" → Suggestions: Deep Work, Content, Exercise, Reading, Outreach + custom
5. "Set one goal for this quarter" → Quick goal setup
6. → Dashboard with data pre-filled, immediate value visible

**Templates available:** Freelancer, E-Commerce, Content Creator, Student (pre-fills habits, missions, streams, goals)

Progress bar at top. Skip option available but "Complete Setup" CTA is prominent.

---

## 5. Monetization

### Free Plan (forever)
- 5 daily missions
- 3 habit trackers
- 1 revenue stream
- 2 goals
- Basic Command Center
- Weekly overview
- Prove It profile (public)
- 1 accountability partner

### Pro Plan ($9/month)
- Unlimited everything
- AI Daily Briefing (post-launch)
- Focus Score details + history
- Weekly Review system
- Advanced analytics
- Streak Freeze (1x/month)
- Unlimited accountability partners
- Custom categories
- Data export (CSV)
- Priority support

### Paywall behavior
- Soft: small banner when limit reached ("Upgrade for unlimited missions")
- NOT popup modals or aggressive gates
- Upgrade CTA in sidebar (always visible but not pushy)

---

## 6. Email System

Using Resend + React Email, triggered programmatically.

| Email | Trigger | Audience |
|---|---|---|
| Welcome | After signup | All |
| Onboarding reminder | 24h after signup if onboarding not completed | All |
| Daily Morning Briefing | 8am user timezone | Pro (opt-in) |
| Weekly Digest | Sunday morning | All |
| Streak Warning | When streak is at risk (no activity by 8pm) | All |
| Win Celebration | Hit a milestone (streak, revenue goal, etc.) | All |
| Nudge from Partner | Partner clicks "Nudge" button | All |
| Weekly Review Reminder | Sunday 9am | Pro |

---

## 7. Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | Next.js 14 (App Router) + Tailwind CSS | SSR for landing page SEO, client-side SPA for app |
| Backend/DB | Supabase (PostgreSQL + Auth + Realtime) | Auth (Google/Apple), RLS, structured data, realtime |
| Payments | Stripe (Checkout + Customer Portal) | Industry standard, webhooks, self-service portal |
| Email | Resend + React Email | Transactional emails with good design |
| Hosting | Vercel | Native Next.js, global CDN, auto-deploy |
| Domain | lomoura.com or getlomoura.com | Custom domain, SSL auto via Vercel |

---

## 8. Database Schema (Supabase/PostgreSQL)

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  onboarding_done BOOLEAN DEFAULT false,
  user_type TEXT, -- entrepreneur, student, creator, professional
  timezone TEXT DEFAULT 'UTC',
  stripe_customer_id TEXT,
  prove_it_username TEXT UNIQUE,
  prove_it_bio TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Missions
CREATE TABLE missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  priority TEXT DEFAULT 'med' CHECK (priority IN ('high', 'med', 'low')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'done')),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  category TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Revenue Streams
CREATE TABLE revenue_streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#CDFF4F',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Revenue Entries
CREATE TABLE revenue_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stream_id UUID REFERENCES revenue_streams(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habits
CREATE TABLE habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '◆',
  archived BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habit Logs
CREATE TABLE habit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID REFERENCES habits(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed BOOLEAN DEFAULT false,
  UNIQUE(habit_id, date)
);

-- Goals
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_value DECIMAL(12,2) NOT NULL,
  current_value DECIMAL(12,2) DEFAULT 0,
  unit TEXT,
  deadline DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Weekly Reviews
CREATE TABLE weekly_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  wins TEXT,
  struggles TEXT,
  next_week_focus TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, week_start)
);

-- Accountability Partners
CREATE TABLE partnerships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a UUID REFERENCES users(id) ON DELETE CASCADE,
  user_b UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'removed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_a, user_b)
);

-- Nudges
CREATE TABLE nudges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user UUID REFERENCES users(id) ON DELETE CASCADE,
  to_user UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Achievements
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- '30_day_streak', 'perfect_week', '100_missions', etc.
  earned_at TIMESTAMPTZ DEFAULT now()
);

-- Daily Scores (cached)
CREATE TABLE daily_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  mission_pct DECIMAL(5,2),
  habit_pct DECIMAL(5,2),
  streak_length INTEGER,
  focus_score INTEGER,
  grade TEXT, -- A+, A, A-, B+, B, C, D, F
  UNIQUE(user_id, date)
);

-- Streak Freezes (Pro)
CREATE TABLE streak_freezes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  used_on DATE NOT NULL,
  month DATE NOT NULL, -- first day of month, max 1 per month
  UNIQUE(user_id, month)
);
```

**Row Level Security:** Every table must have RLS enabled. Users can only read/write their own data. Exception: partnerships and prove_it profiles allow cross-user reads where appropriate.

---

## 9. Build Phases

### Phase 1 — Foundation (Week 1-2)
- Next.js project setup with Tailwind + lomoura design tokens
- Supabase project, database schema, RLS policies
- Auth: Google OAuth + email/password
- Base layout: sidebar nav, top bar, responsive (sidebar → bottom tabs on mobile)
- Skeleton loading states

### Phase 2 — Core Modules (Week 3-5)
- Command Center with stat cards + mini views
- Mission Control (CRUD, priorities, categories, daily navigation)
- Revenue Tracker (streams, entries, bar chart, breakdown)
- Daily Systems / Habits (CRUD, toggle, streaks, heatmap)
- Goals (CRUD, progress bars, deadline warnings)

### Phase 3 — Onboarding (Week 5-6)
- 5-step guided onboarding flow
- Templates (Freelancer, E-Commerce, Creator, Student)
- Skip option + progress bar

### Phase 4 — Monetization (Week 6-7)
- Stripe Checkout + webhooks + Customer Portal
- Paywall logic (free limits enforced via RLS + frontend)
- Settings page (account, plan, data export, delete account)

### Phase 5 — Retention Mechanics (Week 7-9)
- Weekly Review (Pro)
- Email system (Resend): welcome, daily briefing, weekly digest, streak warning, win celebration
- Streak system with milestones + Streak Freeze (Pro)
- Dynamic morning briefing in Command Center
- Focus Score algorithm

### Phase 6 — Social Features (Week 9-10)
- Accountability Partner: invite flow, comparison view, partner list, nudge
- Prove It Mode: public profile page, achievement badges, shareable card, daily scorecard
- Copy link / share functionality

### Phase 7 — Landing Page & Launch Prep (Week 10-11)
- Landing page as part of Next.js app (SSR)
- Legal: Privacy Policy, Terms of Service, Cookie Banner
- Analytics: Vercel Analytics or Plausible
- Performance: Lighthouse >90, optimized images/fonts
- Soft launch: 15-20 beta users, collect feedback + testimonials
- TikTok launch campaign

---

## 10. Key Metrics to Track

- **Signups per day** (target: 20+/day from TikTok)
- **Onboarding completion rate** (target: >60%)
- **Day-1 retention** (target: >50%)
- **Day-7 retention** (target: >25%)
- **Day-30 retention** (target: >15%)
- **Free → Pro conversion** (target: >5%)
- **Partner invites per user** (target: >0.5)

---

## 11. File Structure (Next.js)

```
axis/
├── app/
│   ├── (marketing)/          # Landing page, pricing, etc.
│   │   ├── page.tsx          # Landing page (SSR)
│   │   └── layout.tsx
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── layout.tsx
│   ├── (app)/                # Protected app routes
│   │   ├── dashboard/page.tsx    # Command Center
│   │   ├── missions/page.tsx
│   │   ├── revenue/page.tsx
│   │   ├── systems/page.tsx      # Habits
│   │   ├── goals/page.tsx
│   │   ├── review/page.tsx       # Weekly Review
│   │   ├── partners/page.tsx     # Accountability
│   │   ├── prove/page.tsx        # Prove It settings
│   │   ├── settings/page.tsx
│   │   └── layout.tsx            # Sidebar + auth guard
│   ├── prove/[username]/page.tsx # Public Prove It profile (SSR)
│   └── api/
│       ├── stripe/webhook/route.ts
│       ├── cron/daily-scores/route.ts
│       ├── cron/streak-check/route.ts
│       └── cron/weekly-digest/route.ts
├── components/
│   ├── ui/                   # Shared UI primitives
│   ├── dashboard/            # Command Center components
│   ├── missions/
│   ├── revenue/
│   ├── habits/
│   ├── goals/
│   ├── review/
│   ├── partners/
│   ├── proveit/
│   ├── onboarding/
│   └── landing/
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── stripe.ts
│   ├── resend.ts
│   ├── scoring.ts            # Focus Score + Grade calculation
│   └── utils.ts
├── hooks/
│   ├── useMissions.ts
│   ├── useRevenue.ts
│   ├── useHabits.ts
│   ├── useGoals.ts
│   ├── useStreak.ts
│   ├── usePartners.ts
│   └── useUser.ts
├── styles/
│   └── globals.css           # Tailwind + lomoura design tokens
├── public/
│   ├── axis-logo.svg
│   └── og-image.png          # Social share image
├── lomoura-BRIEF.md             # THIS FILE
├── tailwind.config.ts
├── next.config.ts
└── package.json
```

---

## 12. Design Tokens (Tailwind)

```js
// tailwind.config.ts extend
colors: {
  axis: {
    accent: '#CDFF4F',
    accent2: '#22C55E',
    dark: '#0B0B0F',
    dark2: '#141418',
    dark3: '#1C1C22',
    surface: '#FFFFFF',
    bg: '#FAFAFA',
    border: '#E4E4E7',
    border2: '#D4D4D8',
    text1: '#0B0B0F',
    text2: '#52525B',
    text3: '#A1A1AA',
  }
},
fontFamily: {
  display: ['Outfit', 'sans-serif'],
  mono: ['JetBrains Mono', 'monospace'],
}
```

---

*Last updated: April 15, 2026*
*This document is the single source of truth for the lomoura project.*
