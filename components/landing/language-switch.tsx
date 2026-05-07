"use client";

import { useLocale } from "@/lib/i18n/provider";
import type { Locale } from "@/lib/i18n/dict";

export function LanguageSwitch({ className = "" }: { className?: string }) {
  const { locale, setLocale } = useLocale();
  const options: { code: Locale; label: string }[] = [
    { code: "de", label: "DE" },
    { code: "en", label: "EN" },
  ];
  return (
    <div className={`inline-flex items-center rounded-full border border-axis-border bg-white p-0.5 text-[11px] font-mono ${className}`}>
      {options.map((o) => (
        <button
          key={o.code}
          type="button"
          onClick={() => setLocale(o.code)}
          aria-pressed={locale === o.code}
          className={`px-2 py-0.5 rounded-full transition-colors ${
            locale === o.code
              ? "bg-axis-text1 text-white"
              : "text-axis-text2 hover:text-axis-text1"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
