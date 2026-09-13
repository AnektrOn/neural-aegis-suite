import { lazy, Suspense } from "react";
import { Play } from "lucide-react";
import { getToolboxNebulaPreset } from "@/features/toolbox/nebula/toolboxNebulaPresets";
import { copy, PROMOTE_TOOLBOX } from "../promoteDemoData";
import { usePromotePlayer } from "../PromotePlayerContext";

const ToolboxNebula = lazy(() =>
  import("@/features/toolbox/nebula/ToolboxNebula").then((mod) => ({ default: mod.ToolboxNebula })),
);

const BREATH_PRESET = getToolboxNebulaPreset("breathwork", "regulation");

export function ToolboxScene() {
  const { isFR, goTo } = usePromotePlayer();
  return (
    <div className="space-y-5 pb-6 pt-2">
      <p className="font-display text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Toolbox</p>
      <h1 className="font-cormorant text-3xl font-light">{copy(isFR, "Pratiques guidées", "Guided practices")}</h1>
      <button
        type="button"
        onClick={() => goTo("toolbox-session")}
        className="relative block h-44 w-full overflow-hidden rounded-2xl border border-border-subtle bg-black text-left"
      >
        <Suspense fallback={<div className="h-full bg-black" />}>
          <ToolboxNebula preset={BREATH_PRESET} stateOverride="mouvement" fullscreen={false} className="absolute inset-0 z-0" />
        </Suspense>
        <span className="pointer-events-none absolute inset-x-0 bottom-3 z-10 text-center font-display text-[10px] uppercase tracking-[0.2em] text-white/80">
          {copy(isFR, "Inspirez · 4 · retenez · 7 · expirez · 8", "Inhale · 4 · hold · 7 · exhale · 8")}
        </span>
      </button>
      <div className="space-y-2">
        {PROMOTE_TOOLBOX.map((item, index) => {
          const inner = (
            <>
              <div className="flex min-w-0 items-center gap-3">
                {index === 0 ? (
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary">
                    <Play size={16} className="ml-0.5" />
                  </span>
                ) : null}
                <div>
                  <p className="font-barlow text-[15px]">{copy(isFR, item.titleFr, item.titleEn)}</p>
                  <p className="mt-0.5 font-display text-[10px] uppercase tracking-[0.14em] text-text-tertiary">{item.type}</p>
                </div>
              </div>
              <span className="font-mono text-[11px] text-muted-foreground">{item.duration}</span>
            </>
          );
          const className = "dashboard-panel flex w-full items-center justify-between px-4 py-3.5 text-left";
          if (index === 0) {
            return (
              <button key={item.id} type="button" onClick={() => goTo("toolbox-session")} className={className}>
                {inner}
              </button>
            );
          }
          return (
            <div key={item.id} className={className}>
              {inner}
            </div>
          );
        })}
      </div>
    </div>
  );
}
