# Phase 1 Spec Review — AXIS

Review of `AXIS-BRIEF.md` for Phase 1 (Foundation) readiness.

Phase 1 deliverables per §9:

1. Next.js + Tailwind project with AXIS design tokens
2. Supabase project, database schema, RLS policies
3. Auth (Google OAuth + email/password)
4. Base layout (sidebar, top bar, mobile tabs)
5. Skeleton loading states

This review lists blockers (decisions required before coding), schema/RLS issues, inconsistencies, and gaps.

---

## 1. Blockers — decide before writing code

These are unresolved questions in the brief that will block Phase 1 work on day one.

### 1.1 App theme (light or dark)
§2 says the app/dashboard theme is "TBD during build." Tokens and every component depend on this. The design token block in §12 defines both a light palette (`bg`, `surface`, `border`) and a dark palette (`dark`, `dark2`, `dark3`) but gives no mapping for app surfaces. **Decide before Phase 1 starts**, otherwise every component will be rewritten.

### 1.2 Next.js version vs config file
§7 says "Next.js 14 (App Router)". §11 shows `next.config.ts` and `tailwind.config.ts`. TypeScript config for `next.config` ships in **Next 15**, not 14. Pick one:

- Next 15 + `next.config.ts` (recommended — current release, App Router matured), or
- Next 14 + `next.config.mjs`.

### 1.3 Tailwind version
§7 doesn't pin Tailwind, and §12 uses a v3-style `extend` config. Tailwind v4 (released Jan 2025) uses CSS-first config and does not read `tailwind.config.ts` the same way. **Pin Tailwind v3.4 for this brief**, or rewrite §12 as v4 `@theme` directives.

### 1.4 Auth providers — Google, Apple, or email/password?
- §7: "Auth (Google/Apple)"
- §9 Phase 1: "Google OAuth + email/password"

Three providers mentioned, never the same two together. Phase 1 needs a definitive list. Recommendation: **Google + email/password** for Phase 1 (Apple adds App Store friction and isn't needed for web launch). Apple can slot into Phase 7.

### 1.5 Sidebar route count
§9 says "all 6 modules" but §3 defines **9 app surfaces** (Dashboard, Missions, Revenue, Systems, Goals, Review, Partners, Prove It, Settings) and §11 file structure matches those 9. The "6 modules" language is stale. Lock the sidebar IA to the 9 routes and update the brief.

### 1.6 Mobile nav — 9 routes won't fit in bottom tabs
iOS Safari bottom tabs practically fit ~5 items. With 9 routes, Phase 1 needs:

- A primary set of 4 (Dashboard, Missions, Revenue, Systems) + "More" sheet, **or**
- A drawer-style nav on mobile instead of tabs.

Not specified. Decide before building `(app)/layout.tsx`.

### 1.7 Domain and public base URL
Three candidate domains across §1 and §7 (`axis.app`, `useaxis.com`, `getaxis.app`), all TBD. Phase 1 needs at least a placeholder `NEXT_PUBLIC_SITE_URL` so auth redirects, invite links, and the Prove It public URL work in development. Pick one now, change later.

---

## 2. Schema issues (§8)

### 2.1 `users` conflicts with Supabase `auth.users`
The brief creates a `users` table in the public schema with `id UUID PRIMARY KEY DEFAULT gen_random_uuid()` and duplicates `email`. In Supabase the canonical pattern is a `profiles` table:

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  ...
);
```

with an `on_auth_user_created` trigger to insert a profile row. As written, the `users` table will drift from `auth.users.email`, break on password changes, and fight RLS (`auth.uid()` returns the `auth.users.id`, not the public `users.id`).

**Recommendation:** rename `users` → `profiles`, drop the local `email`, and key off `auth.users(id)`. Every other FK (`user_id` throughout) then points at `profiles.id` which equals `auth.users.id`.

### 2.2 `partnerships` allows duplicate and self-partnerships
```sql
UNIQUE(user_a, user_b)
```

`(A, B)` and `(B, A)` are both allowed, and `(A, A)` is allowed. Needs:

```sql
CHECK (user_a < user_b),
UNIQUE(user_a, user_b)
```

Canonical ordering at insert time (always put the smaller UUID in `user_a`). Queries become `WHERE auth.uid() IN (user_a, user_b)`.

### 2.3 `nudges` has no rate limit
§3.7 says "if partner is inactive 2+ days, send a nudge" but the table will happily accept 1000 nudges per second. Add:

```sql
UNIQUE(from_user, to_user, (created_at::date))
```

or enforce in an RPC. Without this, nudges become spam and the nudge email trigger (§6) will flood.

### 2.4 `habit_logs.completed BOOLEAN DEFAULT false`
Storing unchecked rows doubles the table size and complicates streak queries. Convention: a row exists **iff** the habit was completed that day. Drop the `completed` column, use row existence as truth. Streak query becomes a trivial `date_trunc` window.

### 2.5 `missions.sort_order` is not scoped
Two missions created the same day both default to `sort_order = 0`. Ordering is ambiguous. Either scope by `(user_id, date)` via application logic at insert, or fall back to `created_at` as a tiebreaker.

### 2.6 `daily_scores.grade` has no CHECK
§8 comments the valid grades but doesn't enforce them:

```sql
grade TEXT CHECK (grade IN ('A+','A','A-','B+','B','B-','C+','C','C-','D+','D','F'))
```

Note: **§3.8 and the schema comment disagree on granularity.** §3.8 says "A+ to F" (implying full scale), the schema comment lists only `A+, A, A-, B+, B, C, D, F` (skipping `B-`, `C+`, `C-`, `D+`). Lock the scale.

### 2.7 `streak_freezes` — `month` can drift from `used_on`
```sql
used_on DATE NOT NULL,
month DATE NOT NULL,
UNIQUE(user_id, month)
```

Nothing prevents `used_on = 2026-05-10` with `month = 2026-04-01`. Add:

```sql
CHECK (month = date_trunc('month', used_on)::date)
```

Or drop `month` entirely and use a functional unique:

```sql
UNIQUE(user_id, date_trunc('month', used_on))
```

### 2.8 Missing indexes
Phase 1 needs these or every dashboard query does a seq scan:

```sql
CREATE INDEX ON missions (user_id, date);
CREATE INDEX ON habit_logs (user_id, date);
CREATE INDEX ON revenue_entries (user_id, date);
CREATE INDEX ON daily_scores (user_id, date DESC);
CREATE INDEX ON partnerships (user_a);
CREATE INDEX ON partnerships (user_b);
CREATE INDEX ON nudges (to_user, created_at DESC);
CREATE INDEX ON achievements (user_id);
```

### 2.9 No `updated_at` anywhere
No table tracks updates. Blocks optimistic concurrency, realtime delta sync, and audit. Add `updated_at TIMESTAMPTZ DEFAULT now()` + a generic trigger on every mutable table.

### 2.10 No currency on `revenue_entries`
`amount DECIMAL(12,2)` assumes single-currency. §1 target audience is "everyone" globally. Either commit to USD-only for v1 and document it, or add `currency CHAR(3) DEFAULT 'USD'` now — adding it later is painful.

### 2.11 No `goals.status`
Goals can only be "complete" when `current_value >= target_value`. No way to archive an abandoned goal. Add `status TEXT DEFAULT 'active' CHECK (status IN ('active','done','archived'))`.

### 2.12 No soft delete
Deleting a mission erases it from history, so Focus Score recomputation for prior days becomes incorrect. Consider `deleted_at TIMESTAMPTZ` on `missions`, `habits`, `revenue_entries` and filter `WHERE deleted_at IS NULL` by default.

---

## 3. RLS — brief only says "enabled"

§8 says "Every table must have RLS enabled" but defines zero policies. Phase 1 must ship concrete policies. Minimum set below (assumes `users` → `profiles` per §2.1):

### 3.1 Owner-only tables
`missions`, `habits`, `habit_logs`, `revenue_streams`, `revenue_entries`, `goals`, `weekly_reviews`, `daily_scores`, `streak_freezes`:

```sql
ALTER TABLE <t> ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own rows" ON <t>
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

### 3.2 `profiles`
- Self read/update.
- Anon read of public columns (`name`, `prove_it_username`, `prove_it_bio`) **only when `prove_it_username IS NOT NULL`**. Implement via a `profiles_public` view with its own grants, not a policy, to avoid leaking `email`, `plan`, `stripe_customer_id`.

### 3.3 `partnerships`
- Read if `auth.uid() IN (user_a, user_b)`.
- Insert only via `accept_invite(token)` RPC (SECURITY DEFINER). Direct inserts should be blocked.

### 3.4 `nudges`
- Insert if `from_user = auth.uid()` AND an **active** partnership exists.
- Read if `to_user = auth.uid() OR from_user = auth.uid()`.

### 3.5 `achievements`
- Self read/write.
- Public read when the owning profile has `prove_it_username` set (for the public profile). Same pattern as 3.2 — use a view.

### 3.6 Cross-partner read for comparison view
§3.7 partner dashboard requires reading a partner's `daily_scores`, streaks, and completion stats. The owner-only policy in 3.1 **blocks this**. Needed:

```sql
CREATE POLICY "partner read" ON daily_scores
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM partnerships p
      WHERE p.status = 'active'
        AND ((p.user_a = auth.uid() AND p.user_b = daily_scores.user_id)
          OR (p.user_b = auth.uid() AND p.user_a = daily_scores.user_id))
    )
  );
```

The brief does not mention this exception. Flag it.

### 3.7 Supabase advisors
Phase 1 acceptance should include a clean run of `get_advisors` (security + performance) on the Supabase project. Any RLS-disabled table or missing index will show up there.

---

## 4. Auth gaps (§6 email list is incomplete)

Phase 1 ships email/password auth but §6 doesn't list:

- **Email verification** (Supabase sends a default, but the brief needs a custom template to match AXIS branding).
- **Password reset / magic link**.
- **Email change confirmation**.

Add these three to §6 so Phase 5 doesn't miss them.

Also missing:

- **Prove It username reservation flow** — chosen during onboarding or settings? Uniqueness is enforced at the DB level but there's no mention of how the picker handles conflicts or whether usernames can be changed (and whether the old URL 404s or redirects).
- **Supabase SSR helper choice** — Next.js App Router + Supabase requires `@supabase/ssr` with cookie-based sessions. Pin this in Phase 1 so server components, middleware, and route handlers all use the same client pattern.

---

## 5. Layout / loading scope

### 5.1 Skeleton loading "everywhere"
Brief says skeletons "everywhere, no flicker" but gives no pattern. Phase 1 should land on one:

- **Recommended:** React Suspense boundaries per page with a matching `loading.tsx` per route segment. Co-locate skeleton components under `components/ui/skeletons/`.
- Define a `<Skeleton />` primitive (rounded pulse) and build page-shaped skeletons per module.

### 5.2 Top bar contents
§9 says "sidebar nav, top bar" — the top bar is never specified. Contents? Search? User menu? Date? Current streak? Needs a quick spec note before layout work starts.

### 5.3 Auth guard
`(app)/layout.tsx` needs to enforce sign-in. Decide: middleware redirect, server-component check, or both. Recommended: middleware for the fast path + server-component check as defense-in-depth.

---

## 6. Environment and tooling (missing from Phase 1)

None of these are in §9 but they all belong in Phase 1:

- **Package manager** — pin pnpm (recommended) or npm.
- **Node version** — `.nvmrc` with Node 20 LTS.
- **`.env.example`** — list every required var (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`, Stripe + Resend keys stubbed for later phases).
- **ESLint + Prettier** — committed config.
- **TypeScript strict mode** — on from day one.
- **CI** — at minimum a GitHub Action running `pnpm lint && pnpm typecheck && pnpm build` on PRs.
- **Migrations tooling** — commit to `supabase/migrations/*.sql` under version control, not ad-hoc SQL in the dashboard.

---

## 7. Inconsistencies to fix in the brief itself

| Where | Issue |
|---|---|
| §1 vs §7 | Domain candidates differ (`axis.app` / `useaxis.com` / `getaxis.app`). |
| §7 vs §9 | Auth providers differ (Google/Apple vs Google/email). |
| §7 vs §11 | Next 14 vs `next.config.ts` (Next 15 feature). |
| §9 vs §3/§11 | "6 modules" vs 9 defined routes. |
| §3.8 vs §8 | Grade scale granularity. |
| §2 app theme | "TBD" blocks every component. |
| §6 | Missing password reset, email verification, email change templates. |

---

## 8. Suggested Phase 1 acceptance criteria

Phase 1 has none in the brief. Proposed checklist:

- [ ] Next.js project builds, lints, typechecks, tests (even empty) pass in CI.
- [ ] `.env.example` committed; README documents local setup.
- [ ] Supabase project provisioned; all migrations in `supabase/migrations/` apply cleanly to a fresh DB.
- [ ] Every table has RLS enabled with explicit policies; `get_advisors` returns no security warnings.
- [ ] User can sign up with Google and with email/password, verify email, reset password.
- [ ] Authenticated user lands on `/dashboard` with sidebar + top bar; all 9 app routes render a stub page with skeleton.
- [ ] Unauthenticated user hitting any `(app)` route is redirected to `/login`.
- [ ] Mobile viewport renders bottom nav (or drawer) with correct active state.
- [ ] Design tokens from §12 exposed in Tailwind config and used by at least one component.
- [ ] Lighthouse accessibility > 95 on the empty dashboard.

---

## 9. Priority summary

**Must resolve before Phase 1 starts (blockers):**

1. App theme (light/dark) — §1.1
2. Next version + config file — §1.2
3. Tailwind version — §1.3
4. Auth provider set — §1.4
5. Sidebar IA (6 vs 9) — §1.5
6. Mobile nav pattern — §1.6
7. `users` → `profiles` + `auth.users` FK — §2.1
8. Partnerships canonical ordering — §2.2
9. RLS policy set written out — §3

**Fix during Phase 1:**

- Indexes (§2.8), `updated_at` (§2.9), grade CHECK (§2.6), streak_freeze CHECK (§2.7), nudge rate limit (§2.3), habit_logs shape (§2.4).
- Missing auth emails (§4).
- Skeleton pattern + top bar spec (§5).
- Tooling baseline (§6).

**Defer but document:**

- Currency (§2.10), soft delete (§2.12), goal status (§2.11), Apple sign-in.
