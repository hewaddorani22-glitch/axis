"use client";

import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "dark";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-all duration-200 rounded-xl whitespace-nowrap",
          // Sizes
          size === "sm" && "text-sm px-4 py-2 gap-1.5",
          size === "md" && "text-sm px-6 py-3 gap-2",
          size === "lg" && "text-base px-8 py-4 gap-2.5",
          // Variants
          variant === "primary" &&
            "bg-axis-text1 text-white hover:bg-axis-text1/90 active:scale-[0.98] shadow-sm",
          variant === "secondary" &&
            "bg-white text-axis-text1 border border-axis-border hover:border-axis-border2 hover:shadow-sm active:scale-[0.98]",
          variant === "ghost" &&
            "text-axis-text2 hover:text-axis-text1 hover:bg-axis-text1/[0.04]",
          variant === "dark" &&
            "bg-axis-accent text-axis-text1 font-semibold hover:bg-axis-accent/90 active:scale-[0.98] shadow-sm",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export { Button };
