import type { BioExecutiveHabitRow, BioExecutiveViewModel, BioNodeId } from "./types";
import type { BioExecutiveTileSlotId } from "./bioExecutiveTiles";
import type { PreviewSlideChrome } from "./BioExecutivePreviewTileDots";
import {
  BioExecutiveDecisionActionTile,
  BioExecutivePulseActionTile,
  BioExecutiveToolboxActionTile,
} from "./BioExecutiveActionTiles";
import {
  BioExecutiveHabitsColorTile,
  BioExecutiveScoreColorTile,
  BioExecutiveSleepColorTile,
  BioExecutiveStressColorTile,
} from "./BioExecutiveColorTiles";

type TileRenderProps = {
  viewModel: BioExecutiveViewModel;
  habits: BioExecutiveHabitRow[];
  calmMode: boolean;
  selectedBioNode?: BioNodeId;
  className?: string;
  slideProps?: { "data-bento-slide"?: number };
  previewSlideChrome?: PreviewSlideChrome;
};

export function renderBioExecutiveDesktopTile(slotId: BioExecutiveTileSlotId, props: TileRenderProps) {
  const { viewModel, habits, calmMode, selectedBioNode, className, slideProps, previewSlideChrome } = props;

  switch (slotId) {
    case "decision":
      return (
        <BioExecutiveDecisionActionTile
          key={slotId}
          viewModel={viewModel}
          className={className}
          slideProps={slideProps}
          previewSlideChrome={previewSlideChrome}
        />
      );
    case "score":
      return (
        <BioExecutiveScoreColorTile
          key={slotId}
          viewModel={viewModel}
          calmMode={calmMode}
          className={className}
          slideProps={slideProps}
          previewSlideChrome={previewSlideChrome}
        />
      );
    case "stress":
      return (
        <BioExecutiveStressColorTile
          key={slotId}
          viewModel={viewModel}
          calmMode={calmMode}
          className={className}
          slideProps={slideProps}
          previewSlideChrome={previewSlideChrome}
        />
      );
    case "habits":
      return (
        <BioExecutiveHabitsColorTile
          key={slotId}
          viewModel={viewModel}
          habits={habits}
          calmMode={calmMode}
          className={className}
          slideProps={slideProps}
          previewSlideChrome={previewSlideChrome}
        />
      );
    case "sleep":
      return (
        <BioExecutiveSleepColorTile
          key={slotId}
          viewModel={viewModel}
          className={className}
          slideProps={slideProps}
          previewSlideChrome={previewSlideChrome}
        />
      );
    case "pulse":
      return (
        <BioExecutivePulseActionTile
          key={slotId}
          viewModel={viewModel}
          className={className}
          slideProps={slideProps}
          previewSlideChrome={previewSlideChrome}
        />
      );
    case "toolbox":
      return (
        <BioExecutiveToolboxActionTile
          key={slotId}
          viewModel={viewModel}
          className={className}
          slideProps={slideProps}
          previewSlideChrome={previewSlideChrome}
        />
      );
    default:
      return null;
  }
}

export function BioExecutiveDesktopTilesGrid({
  viewModel,
  habits,
  calmMode,
  selectedBioNode,
}: Omit<TileRenderProps, "className" | "slideProps">) {
  return (
    <div className="aegis-bio-exec-lab__desktop-tiles-grid">
      {renderBioExecutiveDesktopTile("decision", { viewModel, habits, calmMode, selectedBioNode })}
      {renderBioExecutiveDesktopTile("score", { viewModel, habits, calmMode, selectedBioNode })}
      {renderBioExecutiveDesktopTile("stress", { viewModel, habits, calmMode, selectedBioNode })}
      {renderBioExecutiveDesktopTile("habits", { viewModel, habits, calmMode, selectedBioNode })}
      {renderBioExecutiveDesktopTile("sleep", { viewModel, habits, calmMode, selectedBioNode })}
      {renderBioExecutiveDesktopTile("pulse", { viewModel, habits, calmMode, selectedBioNode })}
      {renderBioExecutiveDesktopTile("toolbox", { viewModel, habits, calmMode, selectedBioNode })}
    </div>
  );
}
