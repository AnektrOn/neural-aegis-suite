import { useState } from "react";
import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { archetypeMeta } from "../services/assessmentService";
import type { ArchetypeKey } from "../domain/types";

interface Props {
  isFR: boolean;
  /** Raw scores per archetype key (any scale; only relative bar lengths matter). */
  rawScores: Record<string, number>;
}

/**
 * Discreet collapsible widget anchored bottom-right that reveals the top 3
 * emerging archetypes via relative bar lengths. No scores, no percentages —
 * suspense preserved until the final reveal.
 */
export function MiniRadarThumb({ isFR, rawScores }: Props) {
  const [open, setOpen] = useState(true);

  const top3 = Object.entries(rawScores)
    .filter(([, v]) => Number(v) > 0)
    .sort((a, b) => Number(b[1]) - Number(a[1]))
    .slice(0, 3);

  const max = Math.max(1, ...top3.map(([, v]) => Number(v) || 0));

  return (
    <div
      className="fixed bottom-4 right-4 z-30 w-56 max-w-[80vw] rounded-2xl
                 border border-border/40 bg-card/70 backdrop-blur-3xl shadow-lg
                 overflow-hidden"
      role="status"
      aria-live="polite"
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2
                   text-xs text-muted-foreground hover:bg-accent/20 transition"
      >
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span className="font-medium text-foreground">
            {isFR ? "Ton profil émerge…" : "Your profile is emerging…"}
          </span>
        </span>
        {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
      </button>

      {open && (
        <div className="px-3 pb-3 pt-1 space-y-2">
          {top3.length === 0 ? (
            <p className="text-[11px] text-muted-foreground italic">
              {isFR ? "En attente de signaux…" : "Waiting for signals…"}
            </p>
          ) : (
            top3.map(([key, val]) => {
              const meta = archetypeMeta(key as ArchetypeKey);
              const label = meta ? (isFR ? meta.name_fr : meta.name_en) : key;
              const pct = Math.max(8, Math.round((Number(val) / max) * 100));
              return (
                <div key={key}>
                  <div className="text-[11px] text-foreground/80 mb-0.5 truncate">
                    {label}
                  </div>
                  <div className="h-1.5 bg-secondary/30 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: `${pct}%`,
                        background: meta?.color ?? "hsl(var(--primary))",
                      }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
