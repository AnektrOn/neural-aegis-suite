import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { PRACTICES_HUB_TILES } from "../practicesHubTiles";
import {
  practicesHubTileDataLine,
  practicesHubTileMetric,
} from "../practicesHubTileCopy";
import type { PracticesHubStats } from "../services/fetchPracticesHubStats";
import { PracticesHubTile } from "./PracticesHubTile";

type PracticesHubTileRailProps = {
  stats: PracticesHubStats | null;
  loading: boolean;
};

export function PracticesHubTileRail({ stats, loading }: PracticesHubTileRailProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [selectedIndex, setSelectedIndex] = useState(0);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "start",
    skipSnaps: false,
  });

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    const snap = emblaApi.selectedScrollSnap();
    const n = PRACTICES_HUB_TILES.length;
    setSelectedIndex(((snap % n) + n) % n);
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!emblaApi) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        emblaApi.scrollPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        emblaApi.scrollNext();
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const tile = PRACTICES_HUB_TILES[selectedIndex];
        if (tile) navigate(tile.to);
      }
    },
    [emblaApi, navigate, selectedIndex],
  );

  const selectedTitle = t(PRACTICES_HUB_TILES[selectedIndex]?.nameKey ?? "hub.title");

  return (
    <section
      className="flex min-h-0 w-full flex-1 flex-col bg-black pt-[4.75rem] text-white"
      aria-label={t("hub.practices.railLabel")}
    >
      <h2 className="mb-3 px-4 font-barlow text-[17px] font-light tracking-tight text-white sm:px-6">
        {t("hub.practices.programSection")}
      </h2>

      <div
        ref={emblaRef}
        className={`flex min-h-[300px] flex-1 flex-col overflow-hidden touch-pan-x pl-4 sm:pl-6 ${loading ? "opacity-60" : ""}`}
        style={{ touchAction: "pan-x pinch-zoom" }}
        tabIndex={0}
        role="region"
        aria-roledescription="carousel"
        onKeyDown={onKeyDown}
      >
        <div className="flex min-h-0 flex-1 gap-3 pb-6">
          {PRACTICES_HUB_TILES.map((tile, index) => {
            const title = t(tile.nameKey);
            const metric = practicesHubTileMetric(tile.id, stats, t);
            const detail = practicesHubTileDataLine(tile.id, stats, t);
            return (
              <div
                key={tile.id}
                className="min-h-[300px] w-[min(50vw,230px)] shrink-0 grow-0"
              >
                <PracticesHubTile
                  title={title}
                  metric={metric}
                  label={`${title}. ${detail}`}
                  variant={index}
                  onActivate={() => navigate(tile.to)}
                />
              </div>
            );
          })}
        </div>
      </div>
      <p className="sr-only" aria-live="polite">
        {t("hub.practices.tileSelected", { name: selectedTitle })}
      </p>
    </section>
  );
}
