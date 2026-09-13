import { PROMOTE_PERSONA, PROMOTE_USER, copy } from "../promoteDemoData";
import { usePromotePlayer } from "../PromotePlayerContext";

export function PersonaScene() {
  const { isFR } = usePromotePlayer();
  return (
    <div className="mx-auto w-full max-w-lg pb-8 pt-4 text-center">
      <p className="mb-6 text-left font-display text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
        {copy(isFR, "Aperçu", "Glimpse")}
      </p>
      <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full border-2 border-primary/40 bg-primary/10 font-cormorant text-3xl text-primary">
        {PROMOTE_USER.initial}
      </div>
      <h1 className="font-cormorant text-3xl font-light">{PROMOTE_USER.firstName}</h1>
      <p className="mt-1 font-display text-[11px] uppercase tracking-[0.2em] text-primary/80">
        {copy(isFR, PROMOTE_PERSONA.classFr, PROMOTE_PERSONA.classEn)}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">{copy(isFR, PROMOTE_PERSONA.themeFr, PROMOTE_PERSONA.themeEn)}</p>
      <div className="dashboard-panel mt-6 p-5 text-left">
        <p className="font-cormorant text-base font-light leading-relaxed">
          {copy(isFR, PROMOTE_PERSONA.bioFr, PROMOTE_PERSONA.bioEn)}
        </p>
        <p className="mt-4 font-display text-[10px] uppercase tracking-[0.16em] text-text-tertiary">
          {copy(isFR, "Pratique", "Practice")}
        </p>
        <p className="mt-1 text-sm text-foreground">{copy(isFR, PROMOTE_PERSONA.practiceFr, PROMOTE_PERSONA.practiceEn)}</p>
      </div>
    </div>
  );
}
