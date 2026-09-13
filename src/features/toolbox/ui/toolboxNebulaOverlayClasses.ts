import { cn } from "@/lib/utils";
import { hslWithAlpha, sceneColorForIndex } from "./toolboxPhaseColors";

/** Readable text over particle/matter canvas (tray uses bg-background/70). */
export const toolboxNebulaOverlayRootClass = "space-y-2 px-1 pb-1 pt-0.5";

export const toolboxNebulaOverlayTextShadowClass =
  "drop-shadow-[0_1px_8px_rgba(0,0,0,0.85)]";

export const toolboxNebulaMicroLabelClass =
  "text-[10px] uppercase tracking-[0.35em] text-muted-foreground/90";

export const toolboxNebulaHeadlineClass =
  "mt-0.5 font-cinzel text-lg text-foreground";

export const toolboxNebulaInstructionClass =
  "mx-auto mt-0.5 max-w-md line-clamp-3 text-xs leading-relaxed text-muted-foreground";

export const toolboxNebulaMetaClass =
  "mt-0.5 text-[11px] tabular-nums text-muted-foreground/75";

export function toolboxNebulaScenePillClass(active: boolean, done: boolean, accent: string) {
  return cn(
    "rounded-full px-1.5 py-0.5 text-[9px] transition-colors border",
    active
      ? "text-primary-foreground border-transparent"
      : done
        ? "border-border/25 text-muted-foreground"
        : "border-border/15 text-muted-foreground/60",
  );
}

export function toolboxNebulaScenePillStyle(active: boolean, accent: string) {
  if (!active) return undefined;
  return {
    backgroundColor: hslWithAlpha(accent, 0.55),
    borderColor: hslWithAlpha(accent, 0.35),
  } as const;
}

export function accentForSceneIndex(index: number) {
  return sceneColorForIndex(index);
}
