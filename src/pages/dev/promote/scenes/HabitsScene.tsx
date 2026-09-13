import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { copy, PROMOTE_HABITS } from "../promoteDemoData";
import { usePromotePlayer } from "../PromotePlayerContext";

export function HabitsScene() {
  const { isFR } = usePromotePlayer();
  const done = PROMOTE_HABITS.filter((h) => h.completed).length;
  return (
    <div className="space-y-4 pb-6 pt-2">
      <p className="font-display text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
        {copy(isFR, "Boucle du jour", "Daily loop")}
      </p>
      <h1 className="font-cormorant text-3xl font-light">{copy(isFR, "Habitudes", "Habits")}</h1>
      <p className="font-barlow text-sm text-muted-foreground">
        {done}/{PROMOTE_HABITS.length} {copy(isFR, "complétées", "done")}
      </p>
      <div className="space-y-2">
        {PROMOTE_HABITS.map((h) => (
          <div key={h.id} className="dashboard-panel flex min-h-[52px] items-center gap-3 px-4 py-3">
            <div
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-lg border",
                h.completed ? "border-primary/40 bg-primary/15 text-primary" : "border-[hsl(var(--aegis-border))]",
              )}
            >
              {h.completed ? <Check size={14} strokeWidth={2} /> : null}
            </div>
            <div>
              <p className={cn("font-barlow text-[15px]", h.completed && "text-muted-foreground line-through")}>{h.name}</p>
              <p className="font-display text-[10px] uppercase tracking-[0.14em] text-text-tertiary">{h.category}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
