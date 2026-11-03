import { ChevronRight } from "lucide-react";
import { memo } from "react";
import { cn } from "@/lib/utils";

type PracticesHubTileProps = {
  title: string;
  metric: string;
  label: string;
  /** Décoratif uniquement : varie la forme du blob (index de la tuile). */
  variant?: number;
  onActivate: () => void;
};

const BLOB_SHAPES = [
  "rounded-[58%_42%_46%_54%/46%_58%_42%_54%]",
  "rounded-[46%_54%_58%_42%/54%_44%_56%_46%]",
  "rounded-[52%_48%_40%_60%/44%_56%_44%_56%]",
] as const;

export const PracticesHubTile = memo(function PracticesHubTile({
  title,
  metric,
  label,
  variant = 0,
  onActivate,
}: PracticesHubTileProps) {
  const shape = BLOB_SHAPES[variant % BLOB_SHAPES.length];

  return (
    <button
      type="button"
      onClick={onActivate}
      aria-label={label}
      className={cn(
        "relative flex h-full min-h-[300px] w-full flex-col overflow-hidden rounded-[26px] p-4 text-left",
        "bg-[radial-gradient(120%_80%_at_50%_100%,#1b2a0a_0%,#0c0c0c_72%)]",
        "ring-1 ring-inset ring-white/[0.06]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(84_80%_55%/0.6)]",
      )}
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute inset-x-[4%] bottom-[2%] h-[66%] rounded-full bg-[#7fae12] opacity-50 blur-[34px]" />
        <div
          className={cn(
            "absolute inset-x-[10%] bottom-[6%] h-[58%] bg-[#b6e22a] opacity-95 blur-[16px]",
            shape,
          )}
        />
        <div className="absolute left-[18%] top-[48%] h-[26%] w-[46%] rounded-full bg-[#e6ff7a] opacity-80 blur-[18px]" />
        <div className="absolute left-1/2 top-[70%] h-[26%] w-[34%] -translate-x-1/2 rounded-full bg-[#3f5a06] opacity-80 blur-[16px]" />
        <div className="absolute inset-0 bg-[radial-gradient(90%_70%_at_50%_70%,transparent_40%,rgba(0,0,0,0.55)_100%)]" />
      </div>

      <div className="relative z-10 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-barlow text-[15px] font-medium text-white/95">{title}</p>
          <p className="mt-0.5 truncate font-barlow text-[13px] font-light tabular-nums tracking-wide text-white/60">
            {metric}
          </p>
        </div>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/90 backdrop-blur-sm">
          <ChevronRight className="h-4 w-4" strokeWidth={2} aria-hidden />
        </span>
      </div>
    </button>
  );
});
