import { ChevronLeft, ChevronRight, Eye, EyeOff } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { cn } from "@/lib/utils";
import { PROMOTE_SCENES } from "./promoteScenes";

export function PromoteDirectorHud({
  index,
  title,
  filmMode,
  onPrev,
  onNext,
  onToggleFilm,
}: {
  index: number;
  title: string;
  filmMode: boolean;
  onPrev: () => void;
  onNext: () => void;
  onToggleFilm: () => void;
}) {
  const total = PROMOTE_SCENES.length;

  return (
    <div
      className={cn(
        "absolute inset-x-0 top-0 z-[90] flex justify-center px-3 pt-[max(0.5rem,env(safe-area-inset-top))]",
        filmMode ? "pointer-events-none opacity-0" : "pointer-events-none",
      )}
      aria-hidden={filmMode}
    >
      <div className="pointer-events-auto flex max-w-full items-center gap-2 rounded-full border border-border/40 bg-background/80 px-2 py-1.5 shadow-lg backdrop-blur-md">
        <button
          type="button"
          onClick={onPrev}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
          aria-label="Plan précédent"
        >
          <ChevronLeft size={16} />
        </button>
        <p className="min-w-0 max-w-[11rem] truncate font-display text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          {index + 1} / {total}
          <span className="ml-2 text-foreground/80">{title}</span>
        </p>
        <button
          type="button"
          onClick={onNext}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
          aria-label="Plan suivant"
        >
          <ChevronRight size={16} />
        </button>
        <button
          type="button"
          onClick={onToggleFilm}
          className="inline-flex h-8 items-center gap-1 rounded-full px-2 text-[10px] uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground"
        >
          {filmMode ? <EyeOff size={13} /> : <Eye size={13} />}
          Film
        </button>
        <ThemeToggle collapsed />
        <LanguageSwitcher collapsed />
      </div>
    </div>
  );
}
