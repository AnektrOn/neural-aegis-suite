import { getActiveMetaInsight } from "@/lib/tools/metaInsights";
import { toolsBentoElevated, toolsKicker } from "./toolsDesign";

export function ToolCrossInsights({ className = "" }: { className?: string }) {
  const insight = getActiveMetaInsight();
  if (!insight) return null;

  return (
    <section
      className={`${toolsBentoElevated} mt-6 border-primary/30 ${className}`}
      aria-label="Insight cross-outils"
    >
      <p className={toolsKicker}>Insight cross-outils</p>
      <p className="mt-3 text-sm leading-relaxed text-foreground">{insight}</p>
    </section>
  );
}