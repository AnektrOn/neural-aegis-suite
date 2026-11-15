import { useCallback, useState } from "react";
import { Check, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HeroBreakpointKey } from "./bioExecutiveHeroLabConfig";
import {
  MOBILE_DEVICE_GABARITS,
  type HeroMobileDeviceGabaritKey,
} from "./bioExecutiveMobileDeviceGabarits";
import {
  countMobileGabaritChecklistDone,
  loadMobileGabaritChecklist,
  mobileGabaritChecklistId,
  MOBILE_GABARIT_CHECKLIST_TOTAL,
  MOBILE_GABARIT_QA_HINTS,
  saveMobileGabaritChecklist,
  type MobileGabaritChecklistState,
  type MobileGabaritOrientation,
} from "./mobileGabaritChecklistStorage";

type Props = {
  mobileDeviceGabarit: HeroMobileDeviceGabaritKey;
  onMobileDeviceGabarit: (key: HeroMobileDeviceGabaritKey) => void;
  onEditBreakpoint: (key: HeroBreakpointKey) => void;
  activeConfigKey: HeroBreakpointKey;
};

export function BioExecutiveMobileGabaritChecklist({
  mobileDeviceGabarit,
  onMobileDeviceGabarit,
  onEditBreakpoint,
  activeConfigKey,
}: Props) {
  const [state, setState] = useState<MobileGabaritChecklistState>(() => loadMobileGabaritChecklist());
  const done = countMobileGabaritChecklistDone(state);

  const toggle = useCallback((id: string, checked: boolean) => {
    setState((prev) => {
      const next = { ...prev, [id]: checked };
      if (!checked) delete next[id as keyof typeof next];
      saveMobileGabaritChecklist(next);
      return next;
    });
  }, []);

  const resetAll = useCallback(() => {
    setState({});
    saveMobileGabaritChecklist({});
  }, []);

  const openFrame = useCallback(
    (device: HeroMobileDeviceGabaritKey, orientation: MobileGabaritOrientation) => {
      onMobileDeviceGabarit(device);
      onEditBreakpoint(orientation === "portrait" ? "mobilePortrait" : "mobileLandscape");
    },
    [onEditBreakpoint, onMobileDeviceGabarit],
  );

  const activeOrientation: MobileGabaritOrientation | null =
    activeConfigKey === "mobilePortrait"
      ? "portrait"
      : activeConfigKey === "mobileLandscape"
        ? "landscape"
        : null;

  return (
    <div className="mt-2.5 border-t border-[color:var(--bio-frame-border)] pt-2.5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] opacity-80">
          QA gabarits · {done}/{MOBILE_GABARIT_CHECKLIST_TOTAL}
        </p>
        <button
          type="button"
          onClick={resetAll}
          title="Réinitialiser la checklist"
          className="inline-flex items-center gap-1 rounded-md border border-[color:var(--bio-frame-border)] px-1.5 py-0.5 text-[9px] opacity-70 hover:opacity-100"
        >
          <RotateCcw size={11} />
          Reset
        </button>
      </div>
      <div
        className="mb-2 h-1 overflow-hidden rounded-full bg-[color:var(--bio-frame-border)]"
        role="progressbar"
        aria-valuenow={done}
        aria-valuemin={0}
        aria-valuemax={MOBILE_GABARIT_CHECKLIST_TOTAL}
      >
        <div
          className="h-full bg-[color:var(--bio-accent)] transition-[width] duration-300"
          style={{ width: `${(done / MOBILE_GABARIT_CHECKLIST_TOTAL) * 100}%` }}
        />
      </div>

      <ul className="max-h-[min(220px,28vh)] space-y-1.5 overflow-y-auto pr-0.5">
        {MOBILE_DEVICE_GABARITS.map((g) => {
          const portraitId = mobileGabaritChecklistId(g.key, "portrait");
          const landscapeId = mobileGabaritChecklistId(g.key, "landscape");
          const isActiveRow = mobileDeviceGabarit === g.key;
          return (
            <li
              key={g.key}
              className={cn(
                "rounded-lg border border-[color:var(--bio-frame-border)] px-2 py-1.5",
                isActiveRow && "bg-[color:var(--bio-chip)]/40",
              )}
            >
              <p className="text-[9px] font-medium leading-snug">
                {g.label}{" "}
                <span className="opacity-55 tabular-nums">
                  {g.widthPx}×{g.heightPx}
                </span>
              </p>
              <div className="mt-1 flex flex-wrap gap-1">
                {(
                  [
                    ["portrait", portraitId, "P"],
                    ["landscape", landscapeId, "L"],
                  ] as const
                ).map(([orient, id, short]) => {
                  const checked = Boolean(state[id]);
                  const isCurrent = isActiveRow && activeOrientation === orient;
                  return (
                    <div key={orient} className="flex items-center gap-0.5">
                      <label
                        className={cn(
                          "inline-flex cursor-pointer items-center gap-1 rounded-md border px-1.5 py-0.5 text-[9px]",
                          checked
                            ? "aegis-bio-exec-lab__chip-active border-transparent"
                            : "border-[color:var(--bio-frame-border)] opacity-85",
                          isCurrent && !checked && "ring-1 ring-[color:var(--bio-accent)]/50",
                        )}
                      >
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={checked}
                          onChange={(e) => toggle(id, e.target.checked)}
                        />
                        {checked ? <Check size={10} /> : null}
                        {short}
                      </label>
                      <button
                        type="button"
                        onClick={() => openFrame(g.key, orient)}
                        className="rounded px-1 text-[8px] uppercase tracking-wide opacity-45 hover:opacity-100"
                        title={`Ouvrir ${g.label} · ${orient}`}
                      >
                        →
                      </button>
                    </div>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ul>

      {activeOrientation ? (
        <ul className="mt-2 list-inside list-disc space-y-0.5 text-[9px] leading-snug opacity-55">
          {MOBILE_GABARIT_QA_HINTS[activeOrientation].map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}