import { useState } from "react";
import { Plus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { decisionFieldClass, decisionLabelClass } from "@/components/decisions/DecisionLogUi";
import { cn } from "@/lib/utils";

interface Props {
  onSubmit: (data: { name: string; priority: number; responsibility: number }) => void;
  isPending?: boolean;
  labels: {
    title: string;
    name: string;
    placeholder: string;
    priority: string;
    save: string;
  };
}

const PRIORITY_LEVELS = [1, 2, 3, 4, 5] as const;

export function DecisionQuickForm({ onSubmit, isPending, labels }: Props) {
  const [name, setName] = useState("");
  const [priority, setPriority] = useState(3);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onSubmit({ name: trimmed, priority, responsibility: 5 });
    setName("");
    setPriority(3);
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card space-y-4 border-0 p-4 sm:p-5">
      <h2 className="font-display text-[10px] tracking-[0.18em] uppercase text-text-tertiary/70">
        {labels.title}
      </h2>
      <div className="space-y-2">
        <label htmlFor="decision-quick-name" className={decisionLabelClass}>
          {labels.name}
        </label>
        <input
          id="decision-quick-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder={labels.placeholder}
          className={decisionFieldClass}
          autoComplete="off"
        />
      </div>
      <div className="space-y-2">
        <p className={decisionLabelClass}>{labels.priority}</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label={labels.priority}>
          {PRIORITY_LEVELS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPriority(p)}
              aria-pressed={priority === p}
              className={cn(
                "min-h-11 min-w-11 rounded-xl border px-3 text-sm font-medium tabular-nums transition-colors",
                priority === p
                  ? "border-primary/40 bg-primary/15 text-primary"
                  : "border-border/50 bg-card/40 text-muted-foreground hover:border-primary/25",
              )}
            >
              P{p}
            </button>
          ))}
        </div>
      </div>
      <Button type="submit" className="w-full sm:w-auto" disabled={isPending || !name.trim()}>
        <Save className="size-4" aria-hidden />
        {labels.save}
      </Button>
    </form>
  );
}

export function DecisionQuickAddFab({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="fixed bottom-[calc(var(--safe-bottom)+5.5rem)] right-4 z-30 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_0_24px_hsl(var(--primary)/0.45)] transition-transform hover:scale-105 active:scale-95 md:hidden"
    >
      <Plus className="size-6" aria-hidden />
    </button>
  );
}
