import { Button } from "@/components/ui/button";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ThemeToggle from "@/components/ThemeToggle";
import aegisLogo from "@/assets/aegis-logo.png";
import { copy } from "../promoteDemoData";
import { usePromotePlayer } from "../PromotePlayerContext";

export function LandingScene() {
  const { isFR, next } = usePromotePlayer();
  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto bg-background px-6 pb-10 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={aegisLogo} alt="" className="h-8 w-8 rounded-lg object-contain" />
          <span className="font-display text-sm uppercase tracking-[0.24em] text-foreground">Aegis</span>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher collapsed />
          <ThemeToggle collapsed />
        </div>
      </header>
      <main className="flex flex-1 flex-col justify-center py-10 text-center">
        <p className="font-display text-[10px] uppercase tracking-[0.28em] text-primary/80">
          {copy(isFR, "Protocole Nomos", "Protocole Nomos")}
        </p>
        <h1 className="mt-4 font-display text-[2rem] leading-tight tracking-wide text-foreground">
          {copy(isFR, "Le protocole qui rend vos décisions lisibles", "The protocol that makes your decisions legible")}
        </h1>
        <p className="mx-auto mt-5 max-w-sm text-sm leading-relaxed text-muted-foreground">
          {copy(
            isFR,
            "Journal de décisions, humeur, habitudes, cartographie d’archétypes et pratiques guidées — un système pour diriger avec clarté.",
            "Decision log, mood, habits, archetype cartography and guided practices — a system for leading with clarity.",
          )}
        </p>
        <div className="mt-8 flex flex-col items-center gap-3">
          <Button size="lg" className="min-w-[220px]" onClick={next}>
            {copy(isFR, "Commencer gratuitement", "Start for free")}
          </Button>
          <p className="text-[11px] text-text-tertiary">
            {copy(isFR, "Initiation gratuite · Garantie 30 jours", "Free Initiation · 30-day guarantee")}
          </p>
        </div>
      </main>
    </div>
  );
}
