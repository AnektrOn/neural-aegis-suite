import { useState } from "react";
import { ChevronDown, Moon, Sun, Scale } from "lucide-react";
import { NeuralCard } from "@/components/ui/neural-card";
import { cn } from "@/lib/utils";
import type { CartographyHouse } from "@/lib/archetype-cartography/types";
import { BalanceRichText } from "./BalanceRichText";

const POLE_STYLES = {
  shadow: {
    icon: Moon,
    label: "Shadow",
    border: "border-destructive/25",
    bg: "bg-destructive/5",
    labelClass: "text-destructive",
  },
  light: {
    icon: Sun,
    label: "Light",
    border: "border-success/30",
    bg: "bg-success/5",
    labelClass: "text-success",
  },
  balance: {
    icon: Scale,
    label: "Balance",
    border: "border-[hsl(var(--aegis-warm)/0.35)]",
    bg: "bg-[hsl(var(--aegis-warm-muted)/0.4)]",
    labelClass: "text-[hsl(var(--aegis-warm))]",
  },
} as const;

interface BalanceHouseCardProps {
  house: CartographyHouse;
  defaultOpen?: boolean;
}

export function BalanceHouseCard({ house, defaultOpen = false }: BalanceHouseCardProps) {
  const [open, setOpen] = useState(defaultOpen);

  const poles = [
    { key: "shadow" as const, body: house.shadow },
    { key: "light" as const, body: house.light },
    { key: "balance" as const, body: house.balance },
  ];

  return (
    <article
      id={`maison-${house.id}`}
      className="scroll-mt-[calc(var(--safe-top)+7.5rem)]"
    >
      <NeuralCard variant="premium" glow="warm" className="overflow-hidden p-0">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full min-h-[44px] items-start gap-4 p-4 text-left transition-colors hover:bg-white/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-expanded={open}
          aria-controls={`maison-${house.id}-body`}
        >
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[hsl(var(--aegis-border-ice)/0.5)] bg-[hsl(var(--aegis-s1))] text-xl leading-none"
            aria-hidden
          >
            {house.sign}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-sm uppercase tracking-[0.1em] text-text-primary sm:text-base">
              {house.title}
            </h3>
            <p className="mt-1 text-sm italic text-text-tertiary">{house.tagline}</p>
          </div>
          <ChevronDown
            size={18}
            strokeWidth={1.5}
            className={cn(
              "mt-1 shrink-0 text-text-tertiary transition-transform duration-200",
              open && "rotate-180",
            )}
            aria-hidden
          />
        </button>

        {open && (
          <div
            id={`maison-${house.id}-body`}
            className="space-y-3 border-t border-border-subtle/60 px-4 pb-4 pt-3"
          >
            {poles.map(({ key, body }) => {
              const style = POLE_STYLES[key];
              const Icon = style.icon;
              return (
                <div
                  key={key}
                  className={cn("rounded-xl border p-3.5", style.border, style.bg)}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <Icon size={14} strokeWidth={1.5} className={style.labelClass} aria-hidden />
                    <span
                      className={cn(
                        "text-[10px] font-display uppercase tracking-[0.2em]",
                        style.labelClass,
                      )}
                    >
                      {style.label}
                    </span>
                  </div>
                  <BalanceRichText
                    text={body}
                    className="text-sm leading-relaxed text-text-secondary"
                  />
                </div>
              );
            })}
          </div>
        )}
      </NeuralCard>
    </article>
  );
}
