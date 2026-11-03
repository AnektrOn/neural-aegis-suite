import { cn } from "@/lib/utils";

export type PreviewSlideChrome = {
  activeIndex: number;
  total: number;
  onSelect?: (index: number) => void;
  className?: string;
};

type BioExecutivePreviewTileDotsProps = PreviewSlideChrome;

/** Pagination carousel (aperçu canvas ou barre sous le carrousel). */
export function BioExecutivePreviewTileDots({
  activeIndex,
  total,
  onSelect,
  className,
}: BioExecutivePreviewTileDotsProps) {
  return (
    <div
      className={cn(
        "aegis-bio-exec-lab__preview-tile-dots z-10 flex shrink-0 items-center justify-center gap-1.5 border-t border-current/15 pt-2",
        className,
      )}
      role={onSelect ? "tablist" : undefined}
      aria-label={onSelect ? "Slides métriques" : undefined}
    >
      {Array.from({ length: total }, (_, index) =>
        onSelect ? (
          <button
            key={index}
            type="button"
            role="tab"
            aria-selected={index === activeIndex}
            aria-label={`Slide ${index + 1} sur ${total}`}
            onClick={(event) => {
              event.stopPropagation();
              onSelect(index);
            }}
            className={cn(
              "h-1 rounded-full transition-all duration-200 p-0 border-0 min-w-0",
              index === activeIndex
                ? "w-4 bg-[color:var(--bio-warm)] opacity-95"
                : "w-1 bg-[color:var(--bio-ink)] opacity-35 hover:opacity-60",
            )}
          />
        ) : (
          <span
            key={index}
            className={cn(
              "h-1 rounded-full transition-all duration-200",
              index === activeIndex
                ? "w-4 bg-[color:var(--bio-warm)] opacity-95"
                : "w-1 bg-[color:var(--bio-ink)] opacity-35",
            )}
            aria-hidden
          />
        ),
      )}
    </div>
  );
}
