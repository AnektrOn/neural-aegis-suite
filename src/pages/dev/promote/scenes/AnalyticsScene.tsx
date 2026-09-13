import { MiniSparkline } from "@/components/MiniSparkline";
import { copy, PROMOTE_ANALYTICS } from "../promoteDemoData";
import { usePromotePlayer } from "../PromotePlayerContext";

export function AnalyticsScene() {
  const { isFR } = usePromotePlayer();
  return (
    <div className="space-y-4 pb-6 pt-2">
      <p className="font-display text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Insights</p>
      <h1 className="font-cormorant text-3xl font-light">{copy(isFR, "Corrélations", "Correlations")}</h1>
      <div className="space-y-3">
        {PROMOTE_ANALYTICS.map((row) => (
          <div key={row.titleFr} className="dashboard-panel p-4">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-barlow text-[15px]">{copy(isFR, row.titleFr, row.titleEn)}</h2>
              <MiniSparkline values={row.series} height={28} />
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{copy(isFR, row.bodyFr, row.bodyEn)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
