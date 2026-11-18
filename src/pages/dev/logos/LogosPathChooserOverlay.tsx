import { useState } from "react";
import { cn } from "@/lib/utils";
import { LogosPathCardNebula } from "./LogosPathCardNebula";
import { logosPathSculptureIndexFor } from "./logosPathSculptureAssets";

export type LogosPathDraft = {
  id: string;
  title: string;
  /** Optional expiry hint (days remaining). */
  daysUntilExpiry?: number;
  isFavorited?: boolean;
  /** DB category — picks which of the 5 fixed covers to render. */
  category?: string;
};

type Props = {
  isFR: boolean;
  /** Up to 3 weighted paths from `pickOpeningLogosPaths`. */
  paths: LogosPathDraft[];
  onSelectPath: (path: LogosPathDraft) => void;
  onOwnPath: () => void;
  /** Optional: keep path in memory (extend TTL + favorite weight). */
  onFavoritePath?: (path: LogosPathDraft) => void;
  loading?: boolean;
  className?: string;
};

/** Glass path cards: liquid sculpture per tile + readable dynamic title. */
export function LogosPathChooserOverlay({
  isFR,
  paths: pathsProp,
  onSelectPath,
  onOwnPath,
  onFavoritePath,
  loading = false,
  className,
}: Props) {
  const paths = pathsProp.slice(0, 3);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const heading = isFR ? "Choisis ton chemin" : "Choose your path";
  const sub = isFR
    ? "Trois directions pour ouvrir la conversation avec LOGOS."
    : "Three directions to open the conversation with LOGOS.";
  const ownPath = isFR ? "Je connais mon propre chemin" : "I know my own path";
  const keepLabel = isFR ? "Garder" : "Keep";
  const loadingLabel = isFR ? "Chargement des chemins…" : "Loading paths…";
  const emptyLabel = isFR
    ? "Aucun chemin disponible — ouvre en mode libre."
    : "No paths available — open in free mode.";

  const pick = (path: LogosPathDraft) => {
    setSelectedId(path.id);
    onSelectPath(path);
  };

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 z-10 flex flex-col items-center px-4 sm:px-6",
        className,
      )}
    >
      <div className="pointer-events-none flex w-full max-w-lg flex-col items-center pt-[max(5.5rem,calc(env(safe-area-inset-top)+4.5rem))] text-center">
        <p className="font-display text-[10px] uppercase tracking-[0.3em] text-primary/80">
          LOGOS
        </p>
        <h2 className="mt-2 font-cormorant-display text-3xl tracking-tight text-foreground sm:text-4xl">
          {heading}
        </h2>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          {loading ? loadingLabel : paths.length === 0 ? emptyLabel : sub}
        </p>
      </div>

      <div className="relative flex w-full flex-1 items-center justify-center py-3">
        <div
          className={cn(
            "pointer-events-auto grid w-full gap-4",
            "max-w-[19rem] grid-cols-1",
            "md:max-w-[52rem] md:grid-cols-3 md:gap-5",
          )}
          role="listbox"
          aria-label={heading}
          aria-busy={loading}
        >
          {paths.map((path, index) => {
            const selected = selectedId === path.id;
            const sculptureIndex = logosPathSculptureIndexFor({
              category: path.category,
              pathId: path.id,
              fallbackSlot: index,
            });
            const days =
              typeof path.daysUntilExpiry === "number"
                ? Math.max(0, Math.ceil(path.daysUntilExpiry))
                : null;
            return (
              <div key={path.id} className="relative flex flex-col gap-2">
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  disabled={loading}
                  aria-label={`${isFR ? "Chemin" : "Path"} ${index + 1}: ${path.title}`}
                  onClick={() => pick(path)}
                  className={cn(
                    "group relative flex aspect-[4/5] max-h-[44vh] w-full flex-col justify-end overflow-hidden rounded-2xl border text-left transition-colors duration-200",
                    "border-border/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                    selected ? "border-primary/35" : "hover:border-border/40",
                    "md:aspect-[3/5] md:max-h-[52vh]",
                    loading && "opacity-60",
                  )}
                >
                  <LogosPathCardNebula index={sculptureIndex} />
                  <div
                    className={cn(
                      "pointer-events-none absolute inset-0 z-[2] bg-gradient-to-t from-black/75 via-black/15 to-transparent transition-opacity duration-200",
                      "group-hover:from-black/80",
                      selected && "from-black/80",
                    )}
                    aria-hidden
                  />
                  <div className="relative z-[3] flex min-h-[42%] flex-col items-center justify-center px-3 py-4 text-center">
                    <span className="font-display text-[9px] uppercase tracking-[0.28em] text-muted-foreground">
                      {isFR ? `Chemin ${index + 1}` : `Path ${index + 1}`}
                      {path.isFavorited ? (isFR ? " · mémoire" : " · saved") : ""}
                    </span>
                    <span className="mt-2 font-cormorant-display text-xl leading-snug tracking-tight text-foreground drop-shadow-[0_1px_10px_rgba(0,0,0,0.85)] sm:text-2xl">
                      {path.title}
                    </span>
                    {days != null ? (
                      <span className="mt-2 font-display text-[9px] uppercase tracking-[0.18em] text-muted-foreground/90">
                        {isFR
                          ? days <= 3
                            ? `Effacé dans ${days} j`
                            : `${days} j restants`
                          : days <= 3
                            ? `Gone in ${days}d`
                            : `${days}d left`}
                      </span>
                    ) : null}
                  </div>
                </button>
                {onFavoritePath ? (
                  <button
                    type="button"
                    disabled={loading || path.isFavorited}
                    onClick={() => onFavoritePath(path)}
                    className="pointer-events-auto mx-auto font-display text-[9px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
                  >
                    {path.isFavorited
                      ? isFR
                        ? "En mémoire"
                        : "Saved"
                      : keepLabel}
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <div className="pointer-events-auto flex w-full max-w-md flex-col items-center pb-[max(1.75rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={onOwnPath}
          disabled={loading}
          className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full border border-white/12 bg-black/35 px-5 py-2.5 font-display text-[10px] uppercase tracking-[0.22em] text-muted-foreground backdrop-blur-sm transition-colors duration-200 hover:border-white/22 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50"
        >
          {ownPath}
        </button>
      </div>
    </div>
  );
}
