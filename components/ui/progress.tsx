import { cn } from "@/lib/utils";

interface ProgressProps {
  value: number;
  max?: number;
  variant?: "accent" | "success" | "warning" | "danger";
  size?: "sm" | "md" | "lg";
  className?: string;
  showLabel?: boolean;
}

export function Progress({
  value,
  max = 100,
  variant = "accent",
  size = "md",
  className,
  showLabel = false,
}: ProgressProps) {
  const percentage = Math.min(Math.round((value / max) * 100), 100);

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs font-mono text-white/50">Progress</span>
          <span className="text-xs font-mono text-white/70">{percentage}%</span>
        </div>
      )}
      <div
        className={cn(
          "w-full rounded-full overflow-hidden bg-white/[0.06]",
          size === "sm" && "h-1.5",
          size === "md" && "h-2.5",
          size === "lg" && "h-4"
        )}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            variant === "accent" && "bg-axis-accent",
            variant === "success" && "bg-emerald-500",
            variant === "warning" && "bg-amber-500",
            variant === "danger" && "bg-red-500"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
