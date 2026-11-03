import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DragTarget } from "./bioExecutiveHeroLabDrag";
import { heroElementBoxStyle, heroElementVisible, type HeroBreakpointSlice } from "./bioExecutiveHeroLabConfig";
import { heroTypographyProps } from "./heroLabTypography";
import type { BioExecutiveViewModel } from "./types";

type BioExecutiveHeroTitlesProps = {
  slice: HeroBreakpointSlice;
  heroLab: boolean;
  labTarget: DragTarget;
  onLabTargetSelect: (target: DragTarget) => void;
  onPointerDown: (target: DragTarget) => (event: React.PointerEvent<HTMLElement>) => void;
  viewModel: BioExecutiveViewModel;
  nodeTitle: string;
  /** Desktop exocortex v2 : remplace sessionLabel + titre héros */
  exocortexStatusLine?: string | null;
  exocortexConstatTitle?: string | null;
  showAiTransparency: boolean;
  onToggleAiTransparency: () => void;
};

function titleShell(
  id: "sessionLabel" | "nodeTitle",
  slice: HeroBreakpointSlice,
  heroLab: boolean,
  labTarget: DragTarget,
) {
  const layout = slice.elements[id];
  return {
    style: heroElementBoxStyle(layout),
    className: cn(
      "z-30 touch-none",
      !heroElementVisible(layout, heroLab, labTarget === id) && "hidden",
      heroLab && labTarget === id && "ring-1 ring-[hsl(var(--aegis-warm))] ring-offset-2 ring-offset-transparent rounded-lg",
      heroLab && "cursor-grab active:cursor-grabbing",
    ),
  };
}

export function BioExecutiveHeroTitles({
  slice,
  heroLab,
  labTarget,
  onLabTargetSelect,
  onPointerDown,
  viewModel,
  nodeTitle,
  exocortexStatusLine = null,
  exocortexConstatTitle = null,
  showAiTransparency,
  onToggleAiTransparency,
}: BioExecutiveHeroTitlesProps) {
  const sessionText = exocortexStatusLine ?? viewModel.sessionLabel;
  const heroTitle = exocortexConstatTitle ?? nodeTitle;
  const sessionShell = titleShell("sessionLabel", slice, heroLab, labTarget);
  const nodeShell = titleShell("nodeTitle", slice, heroLab, labTarget);

  return (
    <>
      <div
        {...sessionShell}
        onPointerDown={onPointerDown("sessionLabel")}
        onClick={() => onLabTargetSelect("sessionLabel")}
      >
        <span className="block" {...heroTypographyProps(slice.elements.sessionLabel.typography)}>
          {sessionText}
        </span>
      </div>

      <div
        {...nodeShell}
        onPointerDown={onPointerDown("nodeTitle")}
        onClick={() => onLabTargetSelect("nodeTitle")}
        className={cn(nodeShell.className, "aegis-bio-exec-lab__node-title")}
      >
        <h2 className="aegis-bio-exec-lab__type-title m-0 p-0" {...heroTypographyProps(slice.elements.nodeTitle.typography)}>
          {heroTitle}
        </h2>
      </div>

      <div className="absolute right-0 top-0 z-40 flex gap-1.5">
        <button
          type="button"
          onClick={onToggleAiTransparency}
          title="Transparence IA"
          className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all ${
            showAiTransparency
              ? "aegis-bio-exec-lab__chip-active border-transparent"
              : "border-[color:var(--bio-frame-border)] bg-[color:var(--bio-chip)] shadow-sm"
          }`}
        >
          <Info size={14} />
        </button>
      </div>
    </>
  );
}
