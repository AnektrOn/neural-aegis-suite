import { cn } from "@/lib/utils";
import { HTMLAttributes, forwardRef } from "react";

interface NeuralCardProps extends HTMLAttributes<HTMLDivElement> {
  glow?: "blue" | "purple" | "green" | "warm" | "none";
  variant?: "default" | "elevated" | "ghost" | "premium";
}

export const NeuralCard = forwardRef<HTMLDivElement, NeuralCardProps>(
  ({ className, glow = "none", variant = "default", ...props }, ref) => {
    const glowClass = {
      blue: "shadow-[0_0_0_1px_rgba(79,142,247,0.15),0_0_24px_rgba(79,142,247,0.07)]",
      purple: "shadow-[0_0_0_1px_rgba(124,109,250,0.15),0_0_24px_rgba(124,109,250,0.07)]",
      green: "shadow-[0_0_0_1px_rgba(52,211,153,0.15),0_0_24px_rgba(52,211,153,0.07)]",
      warm: "shadow-[0_0_0_1px_hsla(38,72%,58%,0.2),0_0_24px_hsla(38,72%,58%,0.08)]",
      none: "shadow-[0_1px_3px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.04)]",
    }[glow];

    const variantClass = {
      default: "bg-bg-surface border border-border-subtle",
      elevated: "bg-bg-elevated border border-border-active",
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
