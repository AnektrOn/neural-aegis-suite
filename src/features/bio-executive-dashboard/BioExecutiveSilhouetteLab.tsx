import { useCallback, useEffect, useRef, useState } from "react";
import { Copy, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DEFAULT_BIO_EXEC_SILHOUETTE_LAYOUT,
  formatSilhouetteLayoutForCopy,
  loadBioExecutiveSilhouetteLayout,
  saveBioExecutiveSilhouetteLayout,
  type BioExecutiveSilhouetteLayout,
} from "./bioExecutiveSilhouetteLayout";

type BioExecutiveSilhouetteLabProps = {
  layout: BioExecutiveSilhouetteLayout;
  onChange: (layout: BioExecutiveSilhouetteLayout) => void;
  className?: string;
};

export function useBioExecutiveSilhouetteLayout(enabled: boolean) {
  const [layout, setLayout] = useState<BioExecutiveSilhouetteLayout>(() =>
    enabled ? loadBioExecutiveSilhouetteLayout() : DEFAULT_BIO_EXEC_SILHOUETTE_LAYOUT,
  );

  useEffect(() => {
    if (!enabled) return;
    setLayout(loadBioExecutiveSilhouetteLayout());
  }, [enabled]);

  const persist = useCallback(
    (next: BioExecutiveSilhouetteLayout) => {
      setLayout(next);
      if (enabled) saveBioExecutiveSilhouetteLayout(next);
    },
    [enabled],
  );

  return [layout, persist] as const;
}

export function BioExecutiveSilhouetteLab({ layout, onChange, className }: BioExecutiveSilhouetteLabProps) {
  const [copyLabel, setCopyLabel] = useState<string | null>(null);

  const patch = (partial: Partial<BioExecutiveSilhouetteLayout>) => {
    onChange({ ...layout, ...partial });
  };

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyLabel(label);
      window.setTimeout(() => setCopyLabel(null), 2000);
    } catch {
      setCopyLabel("Erreur copie");
    }
  };

  const formatted = formatSilhouetteLayoutForCopy(layout);

  return (
    <div
      className={cn(
        "fixed bottom-24 left-4 z-[80] w-[min(100vw-2rem,340px)] rounded-2xl border border-[color:var(--bio-frame-border)] bg-[color:var(--bio-frame)]/95 p-3 shadow-xl backdrop-blur-md text-[color:var(--bio-ink)]",
        className,
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] opacity-70 mb-2">
        Lab silhouette · glisser l&apos;image
      </p>

      <label className="block text-[11px] mb-2">
        Largeur {layout.widthPct.toFixed(1)}%
        <input
          type="range"
          min={35}
          max={130}
          step={0.5}
          value={layout.widthPct}
          onChange={(e) => patch({ widthPct: Number(e.target.value) })}
          className="mt-1 w-full accent-[hsl(var(--aegis-warm))]"
        />
      </label>

      <label className="block text-[11px] mb-2">
        Position X {layout.leftPct.toFixed(1)}%
        <input
          type="range"
          min={0}
          max={100}
          step={0.5}
          value={layout.leftPct}
          onChange={(e) => patch({ leftPct: Number(e.target.value) })}
          className="mt-1 w-full accent-[hsl(var(--aegis-warm))]"
        />
      </label>

      <label className="block text-[11px] mb-3">
        Bas {layout.bottomPct.toFixed(1)}%
        <input
          type="range"
          min={-25}
          max={45}
          step={0.5}
          value={layout.bottomPct}
          onChange={(e) => patch({ bottomPct: Number(e.target.value) })}
          className="mt-1 w-full accent-[hsl(var(--aegis-warm))]"
        />
      </label>

      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => copy(formatted.json, "JSON")}
          className="inline-flex items-center gap-1 rounded-lg border border-[color:var(--bio-frame-border)] px-2 py-1 text-[10px] font-medium hover:bg-[color:var(--bio-chip)]"
        >
          <Copy size={11} /> JSON
        </button>
        <button
          type="button"
          onClick={() => copy(formatted.cssVariables, "CSS vars")}
          className="inline-flex items-center gap-1 rounded-lg border border-[color:var(--bio-frame-border)] px-2 py-1 text-[10px] font-medium hover:bg-[color:var(--bio-chip)]"
        >
          <Copy size={11} /> CSS vars
        </button>
        <button
          type="button"
          onClick={() => copy(formatted.css, "CSS")}
          className="inline-flex items-center gap-1 rounded-lg border border-[color:var(--bio-frame-border)] px-2 py-1 text-[10px] font-medium hover:bg-[color:var(--bio-chip)]"
        >
          <Copy size={11} /> CSS bloc
        </button>
        <button
          type="button"
          onClick={() => copy(formatted.reactStyle, "style React")}
          className="inline-flex items-center gap-1 rounded-lg border border-[color:var(--bio-frame-border)] px-2 py-1 text-[10px] font-medium hover:bg-[color:var(--bio-chip)]"
        >
          <Copy size={11} /> style React
        </button>
        <button
          type="button"
          onClick={() => onChange(DEFAULT_BIO_EXEC_SILHOUETTE_LAYOUT)}
          className="inline-flex items-center gap-1 rounded-lg border border-[color:var(--bio-frame-border)] px-2 py-1 text-[10px] font-medium hover:bg-[color:var(--bio-chip)]"
        >
          <RotateCcw size={11} /> Reset
        </button>
      </div>

      {copyLabel ? <p className="mt-2 text-[10px] aegis-bio-exec-lab__accent-text">Copié · {copyLabel}</p> : null}
    </div>
  );
}

type SilhouetteDragProps = {
  enabled: boolean;
  figureRef: React.RefObject<HTMLDivElement | null>;
  layout: BioExecutiveSilhouetteLayout;
  onChange: (layout: BioExecutiveSilhouetteLayout) => void;
};

export function useSilhouetteDragHandlers({ enabled, figureRef, layout, onChange }: SilhouetteDragProps) {
  const layoutRef = useRef(layout);
  layoutRef.current = layout;

  const onImagePointerDown = useCallback(
    (event: React.PointerEvent<HTMLImageElement>) => {
      if (!enabled || event.button !== 0) return;
      const figure = figureRef.current;
      if (!figure) return;

      event.preventDefault();
      const target = event.currentTarget;
      target.setPointerCapture(event.pointerId);

      const startX = event.clientX;
      const startY = event.clientY;
      const startLeft = layoutRef.current.leftPct;
      const startBottom = layoutRef.current.bottomPct;
      const rect = figure.getBoundingClientRect();

      const onMove = (ev: PointerEvent) => {
        const dx = ((ev.clientX - startX) / rect.width) * 100;
        const dy = ((startY - ev.clientY) / rect.height) * 100;
        onChange({
          ...layoutRef.current,
          leftPct: Math.min(100, Math.max(0, startLeft + dx)),
          bottomPct: Math.min(45, Math.max(-25, startBottom + dy)),
        });
      };

      const onUp = () => {
        target.releasePointerCapture(event.pointerId);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [enabled, figureRef, onChange],
  );

  return { onImagePointerDown };
}
