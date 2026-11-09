import { cn } from "@/lib/utils";
import { HTMLAttributes, forwardRef } from "react";

interface NeuralCardProps extends HTMLAttributes<HTMLDivElement> {
  glow?: "blue" | "purple" | "green" | "warm" | "none";
  variant?: "default" | "elevated" | "ghost" | "premium";
}

export const NeuralCard = forwardRef<HTMLDivElement, NeuralCardProps>(
  ({ className, glow = "none", variant = "default", ...props }, ref) => {
    const glowClass = {
      blue: "shadow-[0_0_0_1px_rgba(59,130,246,0.18),0_0_24px_rgba(59,130,246,0.06)]",
      purple: "shadow-[0_0_0_1px_rgba(201,162,75,0.22),0_0_24px_rgba(201,162,75,0.08)]",
      green: "shadow-[0_0_0_1px_rgba(52,211,153,0.18),0_0_24px_rgba(52,211,153,0.06)]",
      warm: "shadow-[0_0_0_1px_rgba(201,162,75,0.28),0_0_24px_rgba(201,162,75,0.10)]",
      none: "shadow-[0_4px_28px_rgba(0,0,0,0.32),inset_0_1px_0_rgba(233,228,216,0.05)]",
    }[glow];

    const variantClass = {
      default: "bg-[#161614] dark:bg-[#161614] bg-white border border-[#e9e4d8]/10 dark:border-[#e9e4d8]/10 border-black/8",
      elevated: "bg-[#1e1e1c] dark:bg-[#1e1e1c] bg-[#faf8f5] border border-[#e9e4d8]/15 dark:border-[#e9e4d8]/15 border-black/10",
      ghost: "bg-transparent border border-border-subtle/50",
      premium: "dashboard-panel border-0 shadow-none",
    }[variant];

    const isPremium = variant === "premium";

    return (
      <div
        ref={ref}
        className={cn(
          "p-4 transition-all duration-300",
          isPremium ? "rounded-[18px]" : "rounded-xl",
          variantClass,
          !isPremium && glowClass,
          className,
        )}
        {...props}
      />
    );
  }
);
NeuralCard.displayName = "NeuralCard";
