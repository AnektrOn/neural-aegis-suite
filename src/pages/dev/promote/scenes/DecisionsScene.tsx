import { copy, PROMOTE_DECISIONS } from "../promoteDemoData";
import { usePromotePlayer } from "../PromotePlayerContext";
import { priorityBadge } from "@/pages/dashboard/dashboard-shared";

export function DecisionsScene() {
  const { isFR } = usePromotePlayer();
  return (
    <div className="space-y-4 pb-6 pt-2">
      <p className="font-display text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
        {copy(isFR, "Journal de décisions", "Decision log")}
      </p>
      <h1 className="font-cormorant text-3xl font-light">{copy(isFR, "Arbitrages", "Calls")}</h1>
      <div className="space-y-2">
        {PROMOTE_DECISIONS.map((d) => {
          const badge = priorityBadge(d.priority);
          return (
            <div key={d.id} className="dashboard-panel flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="font-barlow text-[15px] text-foreground">{copy(isFR, d.nameFr, d.nameEn)}</p>
                <p className="mt-1 font-display text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  {copy(isFR, d.statusFr, d.statusEn)}
                </p>
              </div>
              <span className={`rounded-md px-2 py-0.5 font-barlow text-[10px] ${badge.cls}`}>{badge.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
