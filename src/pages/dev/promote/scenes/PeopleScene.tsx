import { copy, PROMOTE_PEOPLE } from "../promoteDemoData";
import { usePromotePlayer } from "../PromotePlayerContext";

export function PeopleScene() {
  const { isFR } = usePromotePlayer();
  return (
    <div className="space-y-4 pb-6 pt-2">
      <p className="font-display text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
        {copy(isFR, "Réseau", "Network")}
      </p>
      <h1 className="font-cormorant text-3xl font-light">{copy(isFR, "Personnes", "People")}</h1>
      <div className="space-y-2">
        {PROMOTE_PEOPLE.map((p) => (
          <div key={p.id} className="dashboard-panel px-4 py-3.5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-primary/25 bg-primary/10 font-display text-[11px] text-primary">
                  {p.name[0]}
                </span>
                <div>
                  <p className="font-barlow text-[15px]">{p.name}</p>
                  <p className="font-display text-[10px] uppercase tracking-[0.14em] text-text-tertiary">
                    {copy(isFR, p.roleFr, p.roleEn)}
                  </p>
                </div>
              </div>
              <span className="font-mono text-sm tabular-nums text-primary">{p.score.toFixed(1)}</span>
            </div>
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-border/50">
              <div className="h-full rounded-full bg-primary" style={{ width: `${(p.score / 10) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
