import { useMemo, useState } from "react";
import { X, Lock, Unlock } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import type { GrimoireLoadState, RuneProgress } from "../domain/types";

import { SacredGeometry } from "./SacredGeometry";

interface PulseRuneTrackerProps {
  state: GrimoireLoadState;
  onClose: () => void;
}

interface GlyphGroup {
  collectionCode: string;
  collectionName: string;
  runes: RuneProgress[];
  unlockedCount: number;
  totalCount: number;
  progress: number;
}

function buildGlyphGroups(runes: RuneProgress[]): GlyphGroup[] {
  const map = new Map<string, GlyphGroup>();
  for (const r of runes) {
    const key = r.collectionCode ?? "__none__";
    if (!map.has(key)) {
      map.set(key, {
        collectionCode: key,
        collectionName: r.collectionName ?? "Runes",
        runes: [],
        unlockedCount: 0,
        totalCount: 0,
        progress: 0,
      });
    }
    const g = map.get(key)!;
    g.runes.push(r);
    g.totalCount++;
    if (r.isUnlocked) g.unlockedCount++;
  }
  for (const g of map.values()) {
    g.progress = g.totalCount > 0 ? g.unlockedCount / g.totalCount : 0;
  }
  return Array.from(map.values());
}

function GlyphCard({
  group,
  isSelected,
  onSelect,
}: {
  group: GlyphGroup;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const { t } = useLanguage();
  const isComplete = group.progress >= 1;
  const firstRune = group.runes[0];
  const glyphCode = group.collectionCode === "__none__" ? "AEGIS" : group.collectionCode;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex flex-col items-center gap-2 sm:gap-3 p-3 sm:p-4 md:p-5 rounded-2xl border transition-all duration-300 active:scale-[0.97] w-[120px] sm:w-[160px] md:w-[190px] shrink-0 ${
        isSelected
          ? "border-amber-400/40 bg-amber-400/5 shadow-[0_0_20px_rgba(251,191,36,0.12)]"
          : "border-border-subtle bg-bg-surface/50 hover:border-border hover:bg-bg-elevated/50"
      }`}
    >
      <div className="w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 relative">
        <SacredGeometry
          type={glyphCode}
          glowIntensity={group.progress}
          glyphSvg={firstRune?.glyphSvg}
        />
        {isComplete && (
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center shadow-[0_0_10px_rgba(251,191,36,0.5)]">
            <Unlock size={10} className="text-black" />
          </div>
        )}
      </div>

      <div className="text-center">
        <p className="font-cormorant text-xs sm:text-sm md:text-base text-text-primary leading-tight">
          {group.collectionName}
        </p>
        <p className="font-mono text-[8px] sm:text-[9px] tracking-widest text-muted-foreground mt-0.5 sm:mt-1">
          {isComplete
            ? t("pulse.glyphComplete")
            : t("pulse.glyphProgress", {
                unlocked: String(group.unlockedCount),
                total: String(group.totalCount),
              })}
        </p>
      </div>

      <div className="w-full h-[3px] bg-border-subtle rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{
            width: `${group.progress * 100}%`,
            background: group.progress > 0
              ? "linear-gradient(90deg, #d97706, #fbbf24)"
              : "hsl(var(--muted-foreground) / 0.3)",
            boxShadow: isComplete ? "0 0 8px rgba(251,191,36,0.6)" : "none",
          }}
        />
      </div>
    </button>
  );
}

function RuneRow({ rune }: { rune: RuneProgress }) {
  const { t } = useLanguage();
  const total = rune.totalCards ?? 0;
  const intensity = total > 0 ? Math.min(rune.pulsesCount / total, 1) : 0;
  const progressPercent = intensity * 100;

  return (
    <div
      className={`flex items-center gap-2.5 sm:gap-3 md:gap-4 p-2.5 sm:p-3 md:p-4 rounded-xl border transition-all duration-500 ${
        intensity > 0
          ? "border-amber-400/20 bg-amber-400/[0.02]"
          : "border-border bg-bg-surface/60"
      }`}
    >
      <div
        className="w-9 h-9 sm:w-11 sm:h-11 md:w-13 md:h-13 shrink-0 transition-all duration-700"
        style={{
          filter: intensity > 0
            ? `drop-shadow(0 0 ${Math.round(4 + intensity * 8)}px rgba(251,191,36,${(0.2 + intensity * 0.5).toFixed(2)}))`
            : "none",
        }}
      >
        <SacredGeometry
          type={rune.principleCode}
          glowIntensity={intensity}
          glyphSvg={rune.glyphSvg}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <p className="font-cormorant text-[13px] sm:text-sm md:text-base text-text-primary leading-tight truncate">
            {rune.principleName}
          </p>
          {rune.isUnlocked && (
            <span className="shrink-0 font-barlow text-[7px] sm:text-[8px] font-medium uppercase tracking-[0.1em] px-1.5 py-0.5 rounded-full bg-amber-400/15 text-amber-400 border border-amber-400/20">
              {t("pulse.runeUnlockedBadge")}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 h-[2px] sm:h-[3px] bg-border-subtle rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${progressPercent}%`,
                background: intensity > 0
                  ? "linear-gradient(90deg, #d97706, #fbbf24)"
                  : "hsl(var(--muted-foreground) / 0.15)",
                boxShadow: intensity > 0.5 ? "0 0 6px rgba(251,191,36,0.5)" : "none",
              }}
            />
          </div>
          <span className="font-mono text-[8px] sm:text-[9px] tracking-wider text-muted-foreground shrink-0">
            {rune.pulsesCount}/{total}
          </span>
        </div>
      </div>

      <div className="shrink-0">
        {rune.isUnlocked ? (
          <Unlock size={13} className="text-amber-400" />
        ) : (
          <Lock size={13} className="text-muted-foreground/30" />
        )}
      </div>
    </div>
  );
}

export function PulseRuneTracker({ state, onClose }: PulseRuneTrackerProps) {
  const { t } = useLanguage();
  const runes = state.status === "ready" ? state.runes : [];
  const groups = useMemo(() => buildGlyphGroups(runes), [runes]);
  const [selectedGlyph, setSelectedGlyph] = useState<string | null>(null);

  const activeGroup = selectedGlyph
    ? groups.find((g) => g.collectionCode === selectedGlyph) ?? groups[0]
    : groups[0];

  return (
    <div className="min-h-[calc(100vh-8rem)] -m-4 md:-m-6 bg-bg-base rounded-[18px] relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle, hsl(var(--foreground) / 0.3) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }}
      />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vw] h-[100vw] max-w-[600px] max-h-[600px] rounded-full blur-[120px] pointer-events-none bg-[hsla(var(--neural-glow)/0.03)]" />

      <div className="max-w-xl md:max-w-2xl lg:max-w-3xl mx-auto relative z-10 flex flex-col min-h-[80vh]">
        {/* Header */}
        <div className="px-4 sm:px-5 md:px-6 py-4 flex justify-between items-center border-b border-border-subtle">
          <h1 className="font-barlow text-xs font-medium uppercase tracking-[0.2em] text-text-secondary">
            {t("pulse.runeTrackerTitle")}
          </h1>
          <button
            type="button"
            onClick={onClose}
            className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors active:scale-95"
            aria-label={t("pulse.close")}
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex-1 p-4 sm:p-5 md:p-6 overflow-y-auto">
          {state.status === "loading" && (
            <div className="py-20 flex justify-center">
              <div className="w-6 h-6 border-2 border-border-subtle border-t-accent-primary rounded-full animate-spin" />
            </div>
          )}

          {state.status === "error" && (
            <p className="text-center text-muted-foreground font-sans text-sm py-20">
              {state.message}
            </p>
          )}

          {state.status === "ready" && (
            <>
              {/* Glyphs overview */}
              <div className="mb-5 sm:mb-7">
                <h2 className="font-barlow text-[9px] sm:text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground mb-3 sm:mb-4 text-center">
                  Glyphes
                </h2>

                {groups.length === 1 ? (
                  <div className="flex justify-center">
                    <GlyphCard
                      group={groups[0]}
                      isSelected={true}
                      onSelect={() => setSelectedGlyph(groups[0].collectionCode)}
                    />
                  </div>
                ) : (
                  <div className="flex gap-2.5 sm:gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-none -mx-4 px-4 sm:-mx-5 sm:px-5 md:mx-0 md:px-0 md:flex-wrap md:justify-center md:overflow-x-visible md:snap-none">
                    {groups.map((group) => (
                      <GlyphCard
                        key={group.collectionCode}
                        group={group}
                        isSelected={activeGroup?.collectionCode === group.collectionCode}
                        onSelect={() => setSelectedGlyph(group.collectionCode)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Runes detail for selected glyph */}
              {activeGroup && (
                <div className="space-y-1.5 sm:space-y-2">
                  <div className="dashboard-section-label mb-2 sm:mb-3 flex items-center gap-2">
                    <div className="w-1 h-1 bg-amber-400 rounded-full" />
                    <span>
                      {activeGroup.collectionName} — {activeGroup.unlockedCount}/{activeGroup.totalCount}
                    </span>
                  </div>
                  {activeGroup.runes.map((rune) => (
                    <RuneRow key={rune.principleCode} rune={rune} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
