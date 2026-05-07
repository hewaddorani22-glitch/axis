export type Locale = "de" | "en";

export const DEFAULT_LOCALE: Locale = "de";
export const SUPPORTED_LOCALES: Locale[] = ["de", "en"];
export const LOCALE_COOKIE = "lomoura-locale";

type Dict = Record<string, string>;

const de: Dict = {
  // Navbar
  "nav.features": "Features",
  "nav.how": "Wie es funktioniert",
  "nav.pricing": "Preise",
  "nav.faq": "FAQ",
  "nav.login": "Anmelden",
  "nav.cta": "Kostenlos starten",

  // Hero
  "hero.badge": "Public Beta — über 12.000 aktive Nutzer",
  "hero.title.a": "In 60 Sekunden weißt du,",
  "hero.title.b": "was du heute wirklich tun musst.",
  "hero.sub": "Egal ob Schüler, Student, Berufstätige:r oder Creator — Lomoura zeigt dir jeden Tag genau, woran du bist. Geld. Ziele. Gewohnheiten. Alles in einem.",
  "hero.cta": "Quiz starten — 15 Sekunden",
  "hero.secondary": "Wie es funktioniert",
  "hero.trust": "Keine Kreditkarte · 90 Sekunden Setup · Für immer kostenlos",
  "hero.proof": "Menschen wie du sortieren gerade ihr Leben mit Lomoura.",
  "hero.persona.student": "Lina · 17 · Schülerin",
  "hero.persona.student.line": "Hat ihre Noten in 6 Wochen verbessert.",
  "hero.persona.worker": "Marco · 24 · Berufstätig",
  "hero.persona.worker.line": "Hat in 30 Tagen €1.840 nebenbei gemacht.",
  "hero.persona.parent": "Sara · 31 · Mama",
  "hero.persona.parent.line": "Hat 12-Tage-Streak im Workout.",

  // Quiz
  "quiz.intro.title": "Lass uns dein System bauen.",
  "quiz.intro.sub": "3 kurze Fragen. 15 Sekunden. Danach siehst du dein eigenes Dashboard.",
  "quiz.intro.cta": "Loslegen",
  "quiz.skip": "Überspringen",
  "quiz.back": "Zurück",
  "quiz.next": "Weiter",
  "quiz.step": "Schritt",
  "quiz.of": "von",
  "quiz.q1.title": "Was willst du in den nächsten 30 Tagen erreichen?",
  "quiz.q1.sub": "Wähl das, was dich am meisten motiviert.",
  "quiz.q1.money": "Mehr Geld verdienen",
  "quiz.q1.money.desc": "Nebeneinkommen, Business, Gehaltssprung",
  "quiz.q1.grades": "Bessere Noten / Abschluss",
  "quiz.q1.grades.desc": "Schule, Uni, Prüfungen, Lernziel",
  "quiz.q1.discipline": "Mehr Disziplin & Routinen",
  "quiz.q1.discipline.desc": "Sport, Schlaf, gesünder leben",
  "quiz.q1.start": "Endlich anfangen",
  "quiz.q1.start.desc": "Ich weiß, was, ich tu's nur nicht",
  "quiz.q2.title": "Wie alt bist du?",
  "quiz.q2.sub": "Damit wir dein System auf deine Lebensphase abstimmen.",
  "quiz.q3.title": "Was ist dein größter Zeitfresser?",
  "quiz.q3.sub": "Sei ehrlich — niemand sieht das außer dir.",
  "quiz.q3.phone": "Mein Handy / Social Media",
  "quiz.q3.procrast": "Aufschieberitis",
  "quiz.q3.chaos": "Chaos & Unordnung im Kopf",
  "quiz.q3.motivation": "Fehlende Motivation",
  "quiz.building.title": "Wir bauen dein System...",
  "quiz.building.line1": "Persönliche Mission wird erstellt",
  "quiz.building.line2": "Dashboard wird angepasst",
  "quiz.building.line3": "Streak-System wird vorbereitet",

  // Preview / Save
  "preview.welcome": "Dein Dashboard, {name}",
  "preview.welcome.guest": "Dein persönliches Dashboard",
  "preview.briefing": "MORGEN-BRIEFING",
  "preview.morning": "Guten Morgen",
  "preview.streak": "Streak",
  "preview.streak.unit": "Tag",
  "preview.streak.units": "Tage",
  "preview.focus": "Fokus-Score",
  "preview.completion": "Erledigt heute",
  "preview.mission.today": "DEINE ERSTE MISSION HEUTE",
  "preview.mission.priority.high": "wichtig",
  "preview.mission.priority.med": "mittel",
  "preview.save.title": "Sicher dein Profil — sonst verfällt es",
  "preview.save.timer": "Verfügbar noch",
  "preview.save.sub": "Du hast schon 70% gemacht. Speichere jetzt deinen Fortschritt mit einem Klick.",
  "preview.save.google": "Mit Google sichern",
  "preview.save.email": "Mit E-Mail sichern",
  "preview.save.or": "ODER",
  "preview.save.legal": "Mit dem Sichern stimmst du unseren {terms} und der {privacy} zu.",
  "preview.save.terms": "Nutzungsbedingungen",
  "preview.save.privacy": "Datenschutzerklärung",
  "preview.save.expired": "Profil abgelaufen",
  "preview.save.expired.sub": "Kein Stress — starte einfach nochmal.",
  "preview.save.restart": "Neu starten",

  // Auth (Magic-Link OTP)
  "auth.email.label": "E-Mail",
  "auth.email.placeholder": "du@beispiel.de",
  "auth.email.cta": "Code senden",
  "auth.email.sending": "Sende Code...",
  "auth.code.title": "Code eingeben",
  "auth.code.sub": "Wir haben dir einen 6-stelligen Code an {email} geschickt.",
  "auth.code.placeholder": "123456",
  "auth.code.cta": "Profil sichern",
  "auth.code.verifying": "Prüfe...",
  "auth.code.resend": "Code erneut senden",
  "auth.code.change": "Andere E-Mail",
  "auth.error.generic": "Etwas ist schiefgelaufen. Versuch's nochmal.",
  "auth.error.invalid": "Code ist falsch oder abgelaufen.",
  "auth.welcome.back": "Willkommen zurück",
  "auth.welcome.sub": "Melde dich mit deinem Code an.",
  "auth.have.account": "Schon dabei?",
  "auth.no.account": "Noch nicht dabei?",
  "auth.signup.link": "Kostenlos starten",
  "auth.login.link": "Anmelden",

  // CTA
  "cta.title": "Dein System wartet.",
  "cta.sub": "Hör auf, zwischen Apps zu springen. Starte jeden Morgen mit Klarheit. Lomoura ist kostenlos: keine Kreditkarte, kein Trial, kein Haken.",
  "cta.button": "Quiz starten",
  "cta.fineprint": "Keine Kreditkarte nötig",
};

const en: Dict = {
  "nav.features": "Features",
  "nav.how": "How it works",
  "nav.pricing": "Pricing",
  "nav.faq": "FAQ",
  "nav.login": "Log in",
  "nav.cta": "Get started free",

  "hero.badge": "Public Beta — 12,000+ active users",
  "hero.title.a": "In 60 seconds you know",
  "hero.title.b": "exactly what to do today.",
  "hero.sub": "Whether you're a student, employee, parent or creator — Lomoura shows you every day where you stand. Money. Goals. Habits. All in one.",
  "hero.cta": "Start quiz — 15 seconds",
  "hero.secondary": "How it works",
  "hero.trust": "No credit card · 90-second setup · Free forever",
  "hero.proof": "People like you are sorting their life with Lomoura right now.",
  "hero.persona.student": "Lina · 17 · Student",
  "hero.persona.student.line": "Improved her grades in 6 weeks.",
  "hero.persona.worker": "Marco · 24 · Employee",
  "hero.persona.worker.line": "Made €1,840 on the side in 30 days.",
  "hero.persona.parent": "Sara · 31 · Mom",
  "hero.persona.parent.line": "12-day workout streak.",

  "quiz.intro.title": "Let's build your system.",
  "quiz.intro.sub": "3 quick questions. 15 seconds. Then you'll see your own dashboard.",
  "quiz.intro.cta": "Let's go",
  "quiz.skip": "Skip",
  "quiz.back": "Back",
  "quiz.next": "Next",
  "quiz.step": "Step",
  "quiz.of": "of",
  "quiz.q1.title": "What do you want to achieve in the next 30 days?",
  "quiz.q1.sub": "Pick the one that motivates you most.",
  "quiz.q1.money": "Make more money",
  "quiz.q1.money.desc": "Side income, business, raise",
  "quiz.q1.grades": "Better grades / degree",
  "quiz.q1.grades.desc": "School, college, exams, learning goal",
  "quiz.q1.discipline": "More discipline & routines",
  "quiz.q1.discipline.desc": "Sport, sleep, healthier living",
  "quiz.q1.start": "Finally get started",
  "quiz.q1.start.desc": "I know what to do, I just don't",
  "quiz.q2.title": "How old are you?",
  "quiz.q2.sub": "So we tune your system to your stage of life.",
  "quiz.q3.title": "What's your biggest time-waster?",
  "quiz.q3.sub": "Be honest — only you see this.",
  "quiz.q3.phone": "My phone / social media",
  "quiz.q3.procrast": "Procrastination",
  "quiz.q3.chaos": "Chaos & mental clutter",
  "quiz.q3.motivation": "Lack of motivation",
  "quiz.building.title": "Building your system...",
  "quiz.building.line1": "Creating personal mission",
  "quiz.building.line2": "Tuning your dashboard",
  "quiz.building.line3": "Preparing streak system",

  "preview.welcome": "Your dashboard, {name}",
  "preview.welcome.guest": "Your personal dashboard",
  "preview.briefing": "MORNING BRIEFING",
  "preview.morning": "Good morning",
  "preview.streak": "Streak",
  "preview.streak.unit": "day",
  "preview.streak.units": "days",
  "preview.focus": "Focus score",
  "preview.completion": "Done today",
  "preview.mission.today": "YOUR FIRST MISSION TODAY",
  "preview.mission.priority.high": "high",
  "preview.mission.priority.med": "med",
  "preview.save.title": "Save your profile — or it expires",
  "preview.save.timer": "Available for",
  "preview.save.sub": "You're already 70% done. Save your progress with one tap.",
  "preview.save.google": "Save with Google",
  "preview.save.email": "Save with email",
  "preview.save.or": "OR",
  "preview.save.legal": "By saving you agree to our {terms} and {privacy}.",
  "preview.save.terms": "Terms",
  "preview.save.privacy": "Privacy Policy",
  "preview.save.expired": "Profile expired",
  "preview.save.expired.sub": "No worries — just start again.",
  "preview.save.restart": "Restart",

  "auth.email.label": "Email",
  "auth.email.placeholder": "you@example.com",
  "auth.email.cta": "Send code",
  "auth.email.sending": "Sending code...",
  "auth.code.title": "Enter the code",
  "auth.code.sub": "We sent a 6-digit code to {email}.",
  "auth.code.placeholder": "123456",
  "auth.code.cta": "Save profile",
  "auth.code.verifying": "Verifying...",
  "auth.code.resend": "Resend code",
  "auth.code.change": "Use a different email",
  "auth.error.generic": "Something went wrong. Try again.",
  "auth.error.invalid": "That code is wrong or expired.",
  "auth.welcome.back": "Welcome back",
  "auth.welcome.sub": "Sign in with your code.",
  "auth.have.account": "Already with us?",
  "auth.no.account": "New here?",
  "auth.signup.link": "Get started free",
  "auth.login.link": "Log in",

  "cta.title": "Your system is waiting.",
  "cta.sub": "Stop switching between apps. Start every morning knowing exactly what to do. Lomoura is free: no credit card, no trial, no catch.",
  "cta.button": "Start the quiz",
  "cta.fineprint": "No credit card required",
};

export const dictionaries: Record<Locale, Dict> = { de, en };

export function translate(locale: Locale, key: string, vars?: Record<string, string>): string {
  const dict = dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
  let value = dict[key] ?? dictionaries.en[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      value = value.replace(new RegExp(`\\{${k}\\}`, "g"), v);
    }
  }
  return value;
}

export function detectLocaleFromHeader(acceptLanguage: string | null | undefined): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;
  const first = acceptLanguage.split(",")[0]?.toLowerCase() ?? "";
  if (first.startsWith("de")) return "de";
  if (first.startsWith("en")) return "en";
  return DEFAULT_LOCALE;
}

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "de" || value === "en";
}
