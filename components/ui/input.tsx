"use client";

import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  variant?: "light" | "dark";
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant = "light", ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full rounded-xl px-4 py-3 text-sm font-display transition-all duration-200 outline-none",
          variant === "light" &&
            "bg-white border border-axis-border text-axis-text1 placeholder:text-axis-text3 focus:border-axis-text1 focus:ring-2 focus:ring-axis-text1/10",
          variant === "dark" &&
            "bg-white/[0.06] border border-white/[0.08] text-white placeholder:text-white/40 focus:border-axis-accent/50 focus:ring-2 focus:ring-axis-accent/10",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
export { Input };
