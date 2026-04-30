import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

const MONTHS_FR = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];

export interface MonthKey { year: number; month: number } // month 0-11

function key(m: MonthKey) { return `${m.year}-${m.month}`; }

interface Props {
  selected: MonthKey[];
  onToggle: (m: MonthKey) => void;
}

export default function MonthGrid({ selected, onToggle }: Props) {
  const [year, setYear] = useState(new Date().getFullYear());
  const selectedSet = new Set(selected.map(key));
  const now = new Date();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setYear((y) => y - 1)}
          className="p-1.5 rounded-md text-text-tertiary hover:text-accent-warning hover:bg-bg-elevated transition"
        >
          <ChevronLeft size={16} strokeWidth={1.5} />
        </button>
        <span className="font-display text-sm tracking-[0.2em] text-text-secondary">{year}</span>
        <button
          type="button"
          onClick={() => setYear((y) => y + 1)}
          className="p-1.5 rounded-md text-text-tertiary hover:text-accent-warning hover:bg-bg-elevated transition"
        >
          <ChevronRight size={16} strokeWidth={1.5} />
        </button>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {MONTHS_FR.map((label, m) => {
          const k = key({ year, month: m });
          const isSel = selectedSet.has(k);
          const isFuture = year > now.getFullYear() || (year === now.getFullYear() && m > now.getMonth());
          return (
            <button
              key={k}
              type="button"
              disabled={isFuture}
              onClick={() => onToggle({ year, month: m })}
              className={`px-2 py-2 rounded-lg text-[11px] font-medium tracking-wider uppercase border transition-all ${
                isSel
                  ? "bg-accent-warning/15 border-accent-warning/50 text-accent-warning shadow-[0_0_12px_-4px_hsl(var(--accent-warning)/0.5)]"
                  : isFuture
                  ? "border-border-subtle/40 text-text-tertiary/30 cursor-not-allowed"
                  : "border-border-subtle text-text-secondary hover:border-accent-warning/30 hover:text-text-primary"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function monthsToRanges(months: MonthKey[]): { from: Date; to: Date }[] {
  return months.map((m) => ({
    from: new Date(m.year, m.month, 1, 0, 0, 0, 0),
    to: new Date(m.year, m.month + 1, 0, 23, 59, 59, 999),
  }));
}
