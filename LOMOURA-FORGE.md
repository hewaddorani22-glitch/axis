# Lomoura — The Forge

> The 90-day transformation system for men 18–28 who want to forge body, mind, and intellect.

This document is the operating manual for every decision — product, design, code, copy, marketing. If something conflicts with this document, the document wins.

---

## 1 — Positioning

**One sentence:**
Lomoura is a 90-day transformation system for men who want to forge body, mind, and intellect.

**Who it is for:**
Men 18–28, English-speaking. Coming from TikTok self-improvement content. They want to become unrecognizable. They are willing to walk alone. They are tired of consumed motivation.

**What it is not:**
- Not a habit tracker
- Not a productivity tool
- Not Notion-for-life
- Not "alpha male" content
- Not a social network

**What it is:**
A prescribed 90-day path. The user enrolls. The app tells him what to do today across three pillars: Body, Mind, Intellect. He completes. He repeats. On Day 90 he is measurably different — and the app proves it.

---

## 2 — The Three Pillars

Every action in the app belongs to exactly one of these:

- **BODY** — physical training, nutrition discipline, sleep, cold exposure, cardio
- **MIND** — meditation, journaling, stillness, breath work, emotional regulation
- **INTELLECT** — reading, deep work, skill building, writing, focused study

Each user has a score 0–100 per pillar. The total Forge Score is the average. The weakest pillar is highlighted each day.

---

## 3 — Voice

The app speaks with calm authority. It does not hype. It does not shame. It is direct.

### Words to use
forge · protocol · stack · path · pillar · vow · rite · tier · operative · standard · the work · the day · begin · hold · continue · noted

### Words to ban
let's go · amazing · awesome · crushed it · you got this · epic · 🔥 · 💪 · 🚀 · streak fire · keep grinding · alpha · sigma · king · brother (as address)

### Examples — never / always

| ❌ never | ✅ always |
|---|---|
| "Welcome to lomoura! 🎉" | "The forge begins." |
| "Great job! 7-day streak 🔥" | "Day 7. Most stop here." |
| "You missed yesterday 😢" | "You did not complete the protocol. A recovery is available." |
| "Let's crush today!" | "Today's stack is below." |
| "Upgrade to Pro!" | "Take the forge." |
| "Don't break your streak!" | "The day is not yet held." |
| "You're doing great!" | "You held the day." |
| "Sorry, something went wrong!" | "The system is silent. Try again." |

Every UI string passes this filter. If unsure, read it aloud. If it sounds like a fitness coach, rewrite it. If it sounds like a monk's instruction, keep it.

---

## 4 — Aesthetic

### Inspirations (study, do not copy)
- Whoop's data visualization
- Linear's structural rigidity
- Wealthsimple's financial calm
- The Marginalian's typography
- Patek Philippe print advertising
- Monastic manuscripts
- High-end architecture brochures

### Anti-inspirations (avoid)
- Discord, Reddit, Notion (too playful)
- Habitica, Streaks (too gamified)
- TikTok sigma posts (cringe)
- Generic SaaS (forgettable)
- Tate / red-pill aesthetic (toxic)

### Color system

```
--forge-void:    #0A0A0B    page background, deepest black
--forge-stone:   #16161A    cards, surface 1
--forge-iron:    #1F1F24    interactive, surface 2
--forge-edge:    #2A2A30    borders

--forge-bone:    #F0EFE8    primary text (warm white)
--forge-ash:     #8A8A82    secondary text
--forge-shadow:  #54544D    tertiary text

--forge-gold:    #C9A35E    THE ONE accent (aged gold)
--forge-gold-dim:rgba(201,163,94,0.10)

--forge-pulse:   #6EE7B7    completion indicator (used sparingly)
--forge-warn:    #F6C872    recovery available
--forge-fail:    #B47A7A    missed day (muted, never red)
```

**Force dark mode.** Light mode is removed.

### Typography

- **Display (headlines):** Cormorant Garamond — serif, italic-capable. Wide tracking when uppercase.
- **Body:** Outfit — sans, weights 400–800.
- **Numbers / mono:** JetBrains Mono — bold 600 for scores and counters.

### Spacing

Generous. Architectural. Card padding ≥ 20px. Section spacing ≥ 32px. When in doubt, add more space.

### Animation

Minimal. Purposeful. Never decorative.
- Fade-in 0.4s
- Number count-up 1.4s ease-out
- Bar fills cubic-bezier(0.16, 1, 0.3, 1)
- Completion: 0.3s gold pulse → strike-through
- No bounce. No confetti. No spring overshoot.

---

## 5 — Product Model

### The Vow (Day 1)
Onboarding asks one question across three fields. The user writes who he will be in 90 days. This is the contract. It shows on every screen header.

### The Program
The user enrolls in one of three programs:
- **The Foundation** — balanced, for beginners
- **The Builder** — Body-weighted
- **The Scholar** — Intellect-weighted

Each program has 90 days of prescribed protocols. The protocols escalate. The user does not configure — he follows.

### The Daily Stack
Each day, the app shows three items (one per pillar). The user taps to complete. That is the entire daily interaction. Target session: 30 seconds.

### Recovery
If a day is missed, a Recovery Mission unlocks within 48 hours. Smaller scope. Proves commitment without erasing the miss. Max 2 per 90-day cycle.

### Tiers
- **Initiate** — Day 1
- **Apprentice** — Day 90 completed
- **Forged** — Two cycles completed
- **Vigilant** — 365 days active
- **Legend** — 1000 days active

Tiers are visible, permanent, public on the user's proof card.

### Proof Cards
At Day 30, 60, and 90, the app generates a shareable image. Black, gold-accented, with the user's stats and tier. Designed for TikTok and Instagram. This is the viral loop.

---

## 6 — Architecture (4 screens, no more)

| Screen | Purpose |
|---|---|
| **Forge** | Today's stack — the daily home |
| **Path** | 90-day visual map of completion |
| **Self** | Score, vow, tier, share |
| **Counsel** | Settings, account, support |

Everything else (Revenue, Network, Partners, Goals, multi-tab Tasks/Habits/Review) is feature-flagged off. The code remains; the UI does not expose it.

---

## 7 — Pricing

- **3-Day Glimpse** — $0. Full app for 3 days. Hard paywall on Day 4.
- **The Forge** — $19 for 90 days, one-time. (Test $19 first; raise to $29 once conversion is proven.)
- **The Vigil** — $9/month, post-Day-90. Continuous mode, advanced analytics, tier progression.
- **The Counsel** — $29/month, Year 2. Personalized AI based on full history.

Free tier is intentionally narrow. The audience does not respect free.

---

## 8 — Brand Boundaries

- No copyrighted characters (Batman, Wayne, etc.) in any UI string, image, or marketing
- No emoji in product UI (except 🔒 if absolutely needed for clarity, never decorative)
- No exclamation marks in product UI (rare exception: ceremonial — "The forge begins.")
- No "we" language ("We at Lomoura..."). The app speaks; it is not a company addressing you
- No motivational quotes from public figures. The app generates its own language

---

## 9 — Forbidden Patterns

These have appeared in past iterations and must be removed:
- Lime as completion color (lime is removed entirely; gold replaces it)
- Multi-tab navigation showing more than 4 destinations
- "Hinzufügen / Add" forms that require user to invent content
- Emotional copy ("You got this!", "Don't give up!")
- Streak warnings framed as loss ("Don't break your streak!")
- Light mode option in settings

---

## 10 — Phase Roadmap

| Phase | Window | Build |
|---|---|---|
| **Phase 1 — The Forge** | Months 1–6 | Foundation program, 3-day glimpse → $19/90d, proof cards, cohorts |
| **Phase 2 — The Vigil** | Months 7–12 | Day-91 continuation, tier progression, monthly recurring |
| **Phase 3 — The Brotherhood** | Year 2 | Anonymous cohort feeds, standard benchmarks, annual convocation |
| **Phase 4 — The Counsel** | Year 2–3 | AI coach trained on user history |
| **Phase 5 — The Mythos** | Year 3+ | Physical journal, events, founder/avatar voice |

---

*Every decision returns to this document. If a feature, color, copy line, or pricing change conflicts with anything here, the document wins. Edits to this document require deliberate revision, not drift.*
