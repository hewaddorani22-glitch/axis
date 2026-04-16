import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "accent" | "success" | "warning" | "danger" | "pro";
}

export function Badge({
  className,
  variant = "default",
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center font-mono text-xs font-medium px-2.5 py-1 rounded-lg whitespace-nowrap",
        variant === "default" && "bg-axis-bg text-axis-text2 border border-axis-border",
        variant === "accent" && "bg-axis-accent/20 text-axis-accent border border-axis-accent/30",
        variant === "success" && "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
        variant === "warning" && "bg-amber-500/10 text-amber-400 border border-amber-500/20",
        variant === "danger" && "bg-red-500/10 text-red-400 border border-red-500/20",
        variant === "pro" && "bg-axis-accent text-axis-text1 font-semibold",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
