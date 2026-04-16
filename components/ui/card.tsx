"use client";

import { cn } from "@/lib/utils";
import { HTMLAttributes, forwardRef } from "react";

const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "bg-white border border-axis-border rounded-2xl p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:border-axis-border2",
          className
        )}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";

const CardDark = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "bg-axis-dark2 border border-white/[0.06] rounded-2xl p-6 transition-all duration-200 hover:border-white/[0.12] hover:-translate-y-0.5",
          className
        )}
        style={{ boxShadow: "0 0 0 0 transparent" }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.3)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = "0 0 0 0 transparent";
        }}
        {...props}
      />
    );
  }
);
CardDark.displayName = "CardDark";

export { Card, CardDark };
