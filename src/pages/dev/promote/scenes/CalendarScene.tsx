import { copy, PROMOTE_CALENDAR } from "../promoteDemoData";
import { usePromotePlayer } from "../PromotePlayerContext";

export function CalendarScene() {
  const { isFR } = usePromotePlayer();
  const now = new Date();
  const label = now.toLocaleDateString(isFR ? "fr-FR" : "en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return (
    <div className="space-y-4 pb-6 pt-2">
      <p className="font-display text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
        {copy(isFR, "Calendrier", "Calendar")}
      </p>
      <h1 className="font-cormorant text-3xl font-light capitalize">{label}</h1>
      <div className="space-y-2">
        {PROMOTE_CALENDAR.map((row) => (
          <div key={row.time} className="dashboard-panel flex items-center gap-4 px-4 py-3">
            <span className="w-12 shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">{row.time}</span>
            <div>
              <p className="font-barlow text-[15px]">{copy(isFR, row.fr, row.en)}</p>
              <p className="font-display text-[10px] uppercase tracking-[0.14em] text-text-tertiary">{row.kind}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
