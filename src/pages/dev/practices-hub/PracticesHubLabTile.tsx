import { ChevronRight } from "lucide-react";
import { forwardRef, memo } from "react";
import type { PracticesHubStats } from "@/features/practices-hub/services/fetchPracticesHubStats";
import type { PracticesHubTileId } from "@/features/practices-hub/practicesHubTiles";
import { PracticesHubLabTileFeatured } from "./featured/PracticesHubLabTileFeatured";
import { PracticesHubLabDienChanFace } from "./featured/PracticesHubLabDienChanFace";
import { PracticesHubLabTileNebula } from "./PracticesHubLabTileNebula";

type PracticesHubLabTileProps = {
  tileId: PracticesHubTileId;
  title: string;
  metric: string;
  label: string;
  focused: boolean;
  stats: PracticesHubStats | null;
  loading: boolean;
  onActivate: () => void;
};

export const PracticesHubLabTile = memo(
  forwardRef<HTMLButtonElement, PracticesHubLabTileProps>(function PracticesHubLabTile(
    { tileId, title, metric, label, focused, stats, loading, onActivate },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type="button"
        className={`practices-hub-lab__tile${focused ? " practices-hub-lab__tile--vedette" : ""}${
          focused && tileId === "dien_chan" ? " practices-hub-lab__tile--dien" : ""
        }`}
        aria-label={label}
        aria-current={focused ? "true" : undefined}
        onClick={onActivate}
      >
        <div className="practices-hub-lab__tile-media" aria-hidden>
          {focused && tileId === "dien_chan" ? (
            <PracticesHubLabDienChanFace protocolName={stats?.dienChanProtocolName ?? null} />
          ) : focused ? (
            <PracticesHubLabTileNebula tileId={tileId} />
          ) : null}
        </div>
        <div className="practices-hub-lab__t-head">
          <div style={{ minWidth: 0 }}>
            <p className="practices-hub-lab__t-title font-barlow">{title}</p>
            <p className="practices-hub-lab__t-met font-barlow">{metric}</p>
          </div>
          <span className="practices-hub-lab__chev">
            <ChevronRight aria-hidden />
          </span>
        </div>
        {focused && tileId !== "dien_chan" ? (
          <div className="practices-hub-lab__feat">
            <PracticesHubLabTileFeatured tileId={tileId} stats={stats} loading={loading} />
          </div>
        ) : null}
      </button>
    );
  }),
);
