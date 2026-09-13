import { copy, PROMOTE_JOURNAL } from "../promoteDemoData";
import { usePromotePlayer } from "../PromotePlayerContext";

export function JournalScene() {
  const { isFR } = usePromotePlayer();
  return (
    <div className="space-y-4 pb-6 pt-2">
      <p className="font-display text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Journal</p>
      <h1 className="font-cormorant text-3xl font-light">{copy(isFR, "Entrée du matin", "Morning entry")}</h1>
      <div className="dashboard-panel p-5">
        <p className="font-display text-[10px] uppercase tracking-[0.16em] text-primary/80">
          {copy(isFR, PROMOTE_JOURNAL.promptFr, PROMOTE_JOURNAL.promptEn)}
        </p>
        <p className="mt-4 font-cormorant text-lg font-light italic leading-relaxed text-foreground/90">
          {copy(isFR, PROMOTE_JOURNAL.contentFr, PROMOTE_JOURNAL.contentEn)}
        </p>
      </div>
    </div>
  );
}
