import { Shield } from "lucide-react";
import { NeuralCard } from "@/components/ui/neural-card";
import type { CartographyGuardian } from "@/lib/archetype-cartography/types";

interface BalanceGuardianCardProps {
  guardian: CartographyGuardian;
}

export function BalanceGuardianCard({ guardian }: BalanceGuardianCardProps) {
  const rows = [
    { label: "Shadow", value: guardian.shadow, tone: "text-destructive" },
    { label: "Light", value: guardian.light, tone: "text-success" },
    { label: "Balance", value: guardian.balance, tone: "text-[hsl(var(--aegis-warm))]" },
  ] as const;

  return (
    <NeuralCard variant="premium" glow="purple" className="p-0 overflow-hidden">
      <div className="flex items-center gap-3 border-b border-border-subtle/60 px-4 py-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04]">
          <Shield size={16} strokeWidth={1.5} className="text-[hsl(var(--neural-accent))]" aria-hidden />
        </span>
        <h3 className="font-display text-sm uppercase tracking-[0.12em] text-text-primary">
          {guardian.name}
        </h3>
      </div>
      <dl className="divide-y divide-border-subtle/50">
        {rows.map((row) => (
          <div key={row.label} className="grid gap-1 px-4 py-3 sm:grid-cols-[5.5rem_1fr] sm:gap-4">
            <dt className={`text-[10px] font-display uppercase tracking-[0.2em] ${row.tone}`}>
              {row.label}
            </dt>
            <dd className="text-sm leading-relaxed text-text-secondary">{row.value}</dd>
          </div>
        ))}
      </dl>
    </NeuralCard>
  );
}
