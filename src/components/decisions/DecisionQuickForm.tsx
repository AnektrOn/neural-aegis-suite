import { useState } from "react";
import { Save } from "lucide-react";
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
    <form
      onSubmit={handleSubmit}
      className="aegis-dock-tile space-y-4 rounded-2xl p-5 shadow-[0_8px_28px_rgba(20,20,18,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
    >
      <div className="flex items-center gap-2 border-b border-border pb-2.5 dark:border-white/[0.08]">
        <div className="h-3.5 w-1.5 rounded-full bg-[color:var(--aegis-gold)]" />
        <h2 className="font-cinzel text-[10.5px] font-semibold uppercase tracking-[0.2em] text-[color:var(--aegis-gold)]">
          {labels.title}
        </h2>
      </div>
      <div className="space-y-1.5">
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
      <div className="space-y-1.5">
        <p className={decisionLabelClass}>{labels.priority}</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label={labels.priority}>
          {PRIORITY_LEVELS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPriority(p)}
              aria-pressed={priority === p}
              className={cn(
                "min-h-10 min-w-10 cursor-pointer rounded-xl border px-3 font-mono text-xs font-semibold tabular-nums transition-all",
                priority === p
                  ? "border-[color:var(--aegis-gold)]/60 bg-[color:var(--aegis-gold)]/15 text-[color:var(--aegis-gold)] shadow-sm"
                  : "border-border bg-muted/40 text-muted-foreground hover:border-[color:var(--aegis-gold)]/35 hover:text-foreground dark:border-white/10 dark:bg-black/25",
              )}
            >
              P{p}
            </button>
          ))}
        </div>
      </div>
      <button
        type="submit"
        disabled={isPending || !name.trim()}
        className="btn-solaire flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl py-2.5 font-cinzel text-xs font-semibold uppercase tracking-[0.16em] shadow-md disabled:opacity-50"
      >
        <Save className="size-3.5" aria-hidden />
        <span>{labels.save}</span>
      </button>
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
      className="btn-solaire fixed bottom-[calc(var(--mobile-dock-padding)+0.75rem)] right-4 z-[55] min-h-12 rounded-full px-4 shadow-lg md:hidden"
      aria-label={label}
    >
      {label}
    </button>
  );
}
