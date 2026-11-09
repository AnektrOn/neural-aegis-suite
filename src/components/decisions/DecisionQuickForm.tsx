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
    <form onSubmit={handleSubmit} className="aegis-dock-tile space-y-4 rounded-2xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
      <div className="flex items-center gap-2 border-b border-white/[0.08] pb-2.5">
        <div className="w-1.5 h-3.5 rounded-full bg-[#c9a24b]" />
        <h2 className="font-cinzel text-[10.5px] font-semibold tracking-[0.2em] uppercase text-[#c9a24b]">
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
                "min-h-10 min-w-10 rounded-xl border px-3 text-xs font-mono font-semibold tabular-nums transition-all cursor-pointer",
                priority === p
                  ? "border-[#c9a24b]/60 bg-[#c9a24b]/20 text-[#c9a24b] shadow-[0_0_12px_rgba(201,162,75,0.2)]"
                  : "border-white/10 bg-black/25 text-muted-foreground hover:border-white/20 hover:text-foreground",
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
        className="btn-solaire w-full py-2.5 rounded-xl font-cinzel text-xs uppercase tracking-[0.16em] font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
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
      aria-label={label}
      className="fixed bottom-[calc(var(--safe-bottom)+5.5rem)] right-4 z-30 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_0_24px_hsl(var(--primary)/0.45)] transition-transform hover:scale-105 active:scale-95 md:hidden"
    >
      <Plus className="size-6" aria-hidden />
    </button>
  );
}
