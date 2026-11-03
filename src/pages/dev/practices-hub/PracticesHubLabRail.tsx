import { useCallback, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { PRACTICES_HUB_LAB_TILES } from "./practicesHubLabTiles";
import {
  practicesHubTileDataLine,
  practicesHubTileMetric,
} from "@/features/practices-hub/practicesHubTileCopy";
import type { PracticesHubStats } from "@/features/practices-hub/services/fetchPracticesHubStats";
import { PracticesHubLabTile } from "./PracticesHubLabTile";
import { usePracticesHubLabMaquetteCarousel } from "./usePracticesHubLabMaquetteCarousel";

type PracticesHubLabRailProps = {
  stats: PracticesHubStats | null;
  loading: boolean;
};

export function PracticesHubLabRail({ stats, loading }: PracticesHubLabRailProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const {
    viewportRef,
    setTileRef,
    focusedIndex,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onKeyDown,
  } = usePracticesHubLabMaquetteCarousel({ tileCount: PRACTICES_HUB_LAB_TILES.length });

  const onViewportKeyDown = useCallback(
    (e: KeyboardEvent) => {
      onKeyDown(e);
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const tile = PRACTICES_HUB_LAB_TILES[focusedIndex];
        if (tile) navigate(tile.to);
      }
    },
    [focusedIndex, navigate, onKeyDown],
  );

  const selectedTitle = t(PRACTICES_HUB_LAB_TILES[focusedIndex]?.nameKey ?? "hub.title");

  return (
    <section
      id="practices-lab-rail"
      className={`practices-hub-lab__dark${loading ? " practices-hub-lab__dark--loading" : ""}`}
      aria-label={t("hub.practices.railLabel")}
    >
      <h2 className="practices-hub-lab__dark-title font-barlow font-light">Practices</h2>

      <div
        ref={viewportRef}
        className="practices-hub-lab__vp"
        data-mode="vedette"
        tabIndex={0}
        role="region"
        aria-roledescription="carousel"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onKeyDown={onViewportKeyDown}
      >
        {PRACTICES_HUB_LAB_TILES.map((tile, index) => {
          const title = t(tile.nameKey);
          const metric = practicesHubTileMetric(tile.id, stats, t);
          const detail = practicesHubTileDataLine(tile.id, stats, t);
          const focused = index === focusedIndex;
          return (
            <PracticesHubLabTile
              key={tile.id}
              ref={(el) => setTileRef(index, el)}
              tileId={tile.id}
              title={title}
              metric={metric}
              label={`${title}. ${detail}`}
              focused={focused}
              stats={stats}
              loading={loading}
              onActivate={() => navigate(tile.to)}
            />
          );
        })}
      </div>

      <p className="sr-only" aria-live="polite">
        {t("hub.practices.tileSelected", { name: selectedTitle })}
      </p>
    </section>
  );
}
