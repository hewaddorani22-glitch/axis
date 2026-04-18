"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type EmptyStateAction = {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary";
};

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  eyebrow?: string;
  hint?: string;
  actions?: EmptyStateAction[];
  compact?: boolean;
  className?: string;
}

const baseButtonClassName =
  "inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-all";

export function EmptyState({
  icon,
  title,
  description,
  eyebrow,
  hint,
  actions = [],
  compact = false,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed text-center",
        compact ? "px-5 py-7" : "px-6 py-10",
        className
      )}
      style={{ borderColor: "var(--border-primary)", backgroundColor: "var(--bg-tertiary)" }}
    >
      <div
        className={cn(
          "mx-auto flex items-center justify-center rounded-2xl",
          compact ? "mb-4 h-12 w-12" : "mb-5 h-14 w-14"
        )}
        style={{ backgroundColor: "var(--bg-accent-soft)" }}
      >
        {icon}
      </div>

      {eyebrow && (
        <p className="mb-2 text-[10px] font-mono uppercase tracking-[0.22em]" style={{ color: "var(--text-tertiary)" }}>
          {eyebrow}
        </p>
      )}

      <h3 className={cn("font-semibold", compact ? "text-base" : "text-lg")} style={{ color: "var(--text-primary)" }}>
        {title}
      </h3>
      <p
        className={cn("mx-auto mt-2 max-w-md text-sm leading-relaxed", compact ? "max-w-xs" : "")}
        style={{ color: "var(--text-secondary)" }}
      >
        {description}
      </p>

      {actions.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
          {actions.map((action) => {
            const variant = action.variant || "primary";
            const className = cn(
              baseButtonClassName,
              variant === "primary" ? "bg-axis-accent text-axis-dark hover:bg-axis-accent/90" : "hover:opacity-90"
            );
            const style =
              variant === "secondary"
                ? {
                    backgroundColor: "var(--bg-secondary)",
                    border: "1px solid var(--border-primary)",
                    color: "var(--text-secondary)",
                  }
                : undefined;

            if (action.href) {
              return (
                <Link key={action.label} href={action.href} className={className} style={style}>
                  {action.label}
                </Link>
              );
            }

            return (
              <button key={action.label} onClick={action.onClick} className={className} style={style}>
                {action.label}
              </button>
            );
          })}
        </div>
      )}

      {hint && (
        <p className="mt-4 text-xs font-mono" style={{ color: "var(--text-tertiary)" }}>
          {hint}
        </p>
      )}
    </div>
  );
}
