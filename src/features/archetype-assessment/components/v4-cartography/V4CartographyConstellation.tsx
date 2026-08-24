import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";
import type { V4PoleAnalysis } from "@/features/archetype-assessment/domain/types";
import type { OrbZone } from "./v4CartographyUtils";
import {
  orbDiameterPx,
  orbDiameterVb,
  poleDisplayName,
  shortDisplayName,
  survivalActivation,
  ZONE_COLORS,
} from "./v4CartographyUtils";
import { V4ConstellationOrbNode } from "./V4ConstellationOrbNode";

interface Props {
  isFR: boolean;
  analysis: V4PoleAnalysis;
}

type Vec = { x: number; y: number };

type ConstellationLayout = {
  w: number;
  h: number;
  core: Vec;
  light: readonly [Vec, Vec, Vec];
  shadow: readonly [Vec, Vec, Vec];
  survival: readonly [Vec, Vec, Vec, Vec];
};

/** Desktop: roomy skill tree. Mobile: wings pulled to the edges so 48px hits do not overlap. */
const DESKTOP_LAYOUT: ConstellationLayout = {
  w: 600,
  h: 560,
  core: { x: 300, y: 280 },
  light: [
    { x: 300, y: 132 },
    { x: 220, y: 232 },
    { x: 380, y: 232 },
  ],
  shadow: [
    { x: 300, y: 428 },
    { x: 250, y: 328 },
    { x: 350, y: 328 },
  ],
  survival: [
    { x: 148, y: 242 },
    { x: 452, y: 242 },
    { x: 158, y: 318 },
    { x: 442, y: 318 },
  ],
};

const MOBILE_LAYOUT: ConstellationLayout = {
  w: 600,
  h: 540,
  core: { x: 300, y: 270 },
  light: [
    { x: 300, y: 48 },
    { x: 200, y: 192 },
    { x: 400, y: 192 },
  ],
  shadow: [
    { x: 300, y: 500 },
    { x: 200, y: 364 },
    { x: 400, y: 364 },
  ],
  survival: [
    { x: 0, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: 0 },
  ],
};

const NODE_LINKS: Record<string, string[]> = {
  "L-0": ["path-l1", "path-l2"],
  "L-1": ["path-l1", "path-l3", "path-lc1", "path-la1"],
  "L-2": ["path-l2", "path-l3", "path-lc2", "path-la2"],
  "S-0": ["path-s1", "path-s2"],
  "S-1": ["path-s1", "path-s3", "path-sc1", "path-sa1"],
  "S-2": ["path-s2", "path-s3", "path-sc2", "path-sa2"],
  "G-0": ["path-la1"],
  "G-1": ["path-la2"],
  "G-2": ["path-sa1"],
  "G-3": ["path-sa2"],
};

type PathKind = "light" | "shadow" | "survival";

function pathKindForNode(id: string): PathKind {
  if (id.startsWith("G-")) return "survival";
  if (id.startsWith("S-")) return "shadow";
  return "light";
}

function hudRingPx(
  activation: number,
  zone: OrbZone,
  isDominant: boolean,
  scale: number,
  compact: boolean,
) {
  const raw = orbDiameterPx(orbDiameterVb(activation, zone, isDominant), scale);
  const min = compact ? (zone === "survival" ? 28 : 32) : zone === "survival" ? 34 : 38;
  const max = compact ? (isDominant ? 40 : 36) : isDominant ? 48 : 44;
  return Math.round(Math.min(max, Math.max(min, raw * (compact ? 0.62 : 0.72))));
}

function buildTreeLines(layout: ConstellationLayout) {
  const [l0, l1, l2] = layout.light;
  const [s0, s1, s2] = layout.shadow;
  const [g0, g1, g2, g3] = layout.survival;
  const c = layout.core;
  return [
    { id: "path-l1", x1: l0.x, y1: l0.y, x2: l1.x, y2: l1.y, kind: "light" as const, rest: true },
    { id: "path-l2", x1: l0.x, y1: l0.y, x2: l2.x, y2: l2.y, kind: "light" as const, rest: true },
    { id: "path-l3", x1: l1.x, y1: l1.y, x2: l2.x, y2: l2.y, kind: "light" as const, rest: true },
    { id: "path-lc1", x1: c.x, y1: c.y, x2: l1.x, y2: l1.y, kind: "light" as const, rest: false },
    { id: "path-lc2", x1: c.x, y1: c.y, x2: l2.x, y2: l2.y, kind: "light" as const, rest: false },
    { id: "path-la1", x1: l1.x, y1: l1.y, x2: g0.x, y2: g0.y, kind: "light" as const, rest: false },
    { id: "path-la2", x1: l2.x, y1: l2.y, x2: g1.x, y2: g1.y, kind: "light" as const, rest: false },
    { id: "path-s1", x1: s0.x, y1: s0.y, x2: s1.x, y2: s1.y, kind: "shadow" as const, rest: true },
    { id: "path-s2", x1: s0.x, y1: s0.y, x2: s2.x, y2: s2.y, kind: "shadow" as const, rest: true },
    { id: "path-s3", x1: s1.x, y1: s1.y, x2: s2.x, y2: s2.y, kind: "shadow" as const, rest: true },
    { id: "path-sc1", x1: c.x, y1: c.y, x2: s1.x, y2: s1.y, kind: "shadow" as const, rest: false },
    { id: "path-sc2", x1: c.x, y1: c.y, x2: s2.x, y2: s2.y, kind: "shadow" as const, rest: false },
    { id: "path-sa1", x1: s1.x, y1: s1.y, x2: g2.x, y2: g2.y, kind: "shadow" as const, rest: false },
    { id: "path-sa2", x1: s2.x, y1: s2.y, x2: g3.x, y2: g3.y, kind: "shadow" as const, rest: false },
  ];
}

function parseNodeIndex(id: string): number {
  const part = id.split("-")[1];
  return part ? Number(part) : -1;
}

export function V4CartographyConstellation({ isFR, analysis }: Props) {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const { lightAlliance, shadowCouncil, survivalGuard, totalPolePoints } = analysis;
  const stageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [stageNarrow, setStageNarrow] = useState(false);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [lockId, setLockId] = useState<string | null>(null);

  const compact = isMobile || stageNarrow;
  const layout = compact ? MOBILE_LAYOUT : DESKTOP_LAYOUT;
  const treeLines = useMemo(() => buildTreeLines(layout), [layout]);
  const activeId = isMobile ? lockId : hoverId ?? lockId;

  const lightDom = lightAlliance.reduce(
    (best, e, i) => (e.activationPercent > lightAlliance[best].activationPercent ? i : best),
    0,
  );
  const shadowDom = shadowCouncil.reduce(
    (best, e, i) => (e.activationPercent > shadowCouncil[best].activationPercent ? i : best),
    0,
  );

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const sync = () => {
      const width = stage.clientWidth || 1;
      setScale(width / layout.w);
      setStageNarrow(width < 480);
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(stage);
    return () => ro.disconnect();
  }, [layout.w]);

  useEffect(() => {
    if (!lockId) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLockId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lockId]);

  const onHover = useCallback(
    (id: string) => {
      if (isMobile) return;
      setHoverId(id);
    },
    [isMobile],
  );
  const onLeave = useCallback(
    (id: string) => {
      if (isMobile) return;
      setHoverId((prev) => (prev === id ? null : prev));
    },
    [isMobile],
  );
  const onSelect = useCallback((id: string) => {
    setLockId((prev) => (prev === id ? null : id));
  }, []);

  const toPx = (vb: number) => vb * scale;

  const orbInstances = useMemo(() => {
    const out: {
      id: string;
      x: number;
      y: number;
      ringPx: number;
      zone: OrbZone;
      color: string;
      ariaLabel: string;
      dominant: boolean;
      quiet: boolean;
    }[] = [];

    lightAlliance.forEach((entry, i) => {
      const pos = layout.light[i];
      if (!pos) return;
      const name = poleDisplayName(entry, isFR);
      out.push({
        id: `L-${i}`,
        x: toPx(pos.x),
        y: toPx(pos.y),
        ringPx: hudRingPx(entry.activationPercent, "light", i === lightDom, scale, compact),
        zone: "light",
        color: ZONE_COLORS.light,
        ariaLabel: `${name} ${entry.activationPercent.toFixed(1)}%`,
        dominant: i === lightDom,
        quiet: i !== lightDom,
      });
    });

    shadowCouncil.forEach((entry, i) => {
      const pos = layout.shadow[i];
      if (!pos) return;
      const name = poleDisplayName(entry, isFR);
      out.push({
        id: `S-${i}`,
        x: toPx(pos.x),
        y: toPx(pos.y),
        ringPx: hudRingPx(entry.activationPercent, "shadow", i === shadowDom, scale, compact),
        zone: "shadow",
        color: ZONE_COLORS.shadow,
        ariaLabel: `${name} ${entry.activationPercent.toFixed(1)}%`,
        dominant: i === shadowDom,
        quiet: i !== shadowDom,
      });
    });

    survivalGuard.forEach((entry, i) => {
      const pos = layout.survival[i];
      if (!pos) return;
      const name = isFR ? entry.name_fr : entry.name_en;
      out.push({
        id: `G-${i}`,
        x: toPx(pos.x),
        y: toPx(pos.y),
        ringPx: hudRingPx(survivalActivation(entry), "survival", false, scale, compact),
        zone: "survival",
        color: ZONE_COLORS.survival,
        ariaLabel: `${name} ${isFR ? "lumière" : "light"} ${entry.lightPercent.toFixed(0)}% ${isFR ? "ombre" : "shadow"} ${entry.shadowPercent.toFixed(0)}%`,
        dominant: false,
        quiet: true,
      });
    });

    return out;
  }, [
    lightAlliance,
    shadowCouncil,
    survivalGuard,
    lightDom,
    shadowDom,
    scale,
    isFR,
    compact,
    layout,
  ]);

  const activePaths = activeId ? NODE_LINKS[activeId] ?? [] : [];
  const activeKind = activeId ? pathKindForNode(activeId) : null;

  const glanceLight = lightAlliance[lightDom]
    ? shortDisplayName(poleDisplayName(lightAlliance[lightDom], isFR))
    : null;
  const glanceShadow = shadowCouncil[shadowDom]
    ? shortDisplayName(poleDisplayName(shadowCouncil[shadowDom], isFR))
    : null;

  let detailName: string | null = null;
  let detailMeta: string | null = null;

  if (activeId?.startsWith("L-")) {
    const e = lightAlliance[parseNodeIndex(activeId)];
    if (e) {
      detailName = poleDisplayName(e, isFR);
      detailMeta = `${e.activationPercent.toFixed(1)}%`;
    }
  } else if (activeId?.startsWith("S-")) {
    const e = shadowCouncil[parseNodeIndex(activeId)];
    if (e) {
      detailName = poleDisplayName(e, isFR);
      detailMeta = `${e.activationPercent.toFixed(1)}%`;
    }
  } else if (activeId?.startsWith("G-")) {
    const e = survivalGuard[parseNodeIndex(activeId)];
    if (e) {
      detailName = isFR ? e.name_fr : e.name_en;
      detailMeta = `L ${e.lightPercent.toFixed(0)}% · ${isFR ? "O" : "S"} ${e.shadowPercent.toFixed(0)}%`;
    }
  }

  return (
    <div className="relative w-full select-none">
      <p className="sr-only">{t("assessment.v4InspectHint")}</p>

      <div
        ref={stageRef}
        data-slot="v4-constellation-stage"
        className="v4-constellation-stage relative mx-auto w-full max-w-lg overflow-visible rounded-lg sm:overflow-hidden sm:rounded-xl"
        style={{
          aspectRatio: `${layout.w} / ${layout.h}`,
          ["--v4-light" as string]: ZONE_COLORS.light,
          ["--v4-shadow" as string]: ZONE_COLORS.shadow,
          ["--v4-survival" as string]: ZONE_COLORS.survival,
        }}
        onClick={() => setLockId(null)}
      >
        <svg
          viewBox={`0 0 ${layout.w} ${layout.h}`}
          className="pointer-events-none absolute inset-0 z-[2] h-full w-full"
          aria-hidden
        >
          {treeLines.map((line) => {
            const active = activePaths.includes(line.id);
            if (!line.rest && !active) return null;
            if (compact && (line.id.startsWith("path-la") || line.id.startsWith("path-sa"))) return null;
            const activeClass =
              active && activeKind === "light"
                ? "v4-path-active-light"
                : active && activeKind === "shadow"
                  ? "v4-path-active-shadow"
                  : active && activeKind === "survival"
                    ? "v4-path-active-survival"
                    : "";
            return (
              <line
                key={line.id}
                id={line.id}
                x1={line.x1}
                y1={line.y1}
                x2={line.x2}
                y2={line.y2}
                className={cn(
                  line.kind === "light" && "v4-line-light",
                  line.kind === "shadow" && "v4-line-shadow",
                  activeClass,
                )}
              />
            );
          })}
        </svg>

        <div
          className="pointer-events-none absolute z-[8] -translate-x-1/2 -translate-y-1/2"
          style={{ left: toPx(layout.core.x), top: toPx(layout.core.y) }}
          aria-hidden
        >
          <div className={cn("v4-hud-core", compact && "v4-hud-core-compact")} />
        </div>

        <div className="absolute inset-0 z-10" aria-label={t("assessment.v4ConstellationAria")}>
          {orbInstances
            .filter((orb) => !(compact && orb.zone === "survival"))
            .map((orb) => (
            <V4ConstellationOrbNode
              key={orb.id}
              id={orb.id}
              x={orb.x}
              y={orb.y}
              sizePx={orb.ringPx}
              color={orb.color}
              zone={orb.zone}
              hot={hoverId === orb.id}
              selected={lockId === orb.id}
              dominant={orb.dominant}
              quiet={orb.quiet}
              touch={compact}
              allowHover={!isMobile}
              ariaLabel={orb.ariaLabel}
              onHover={onHover}
              onLeave={onLeave}
              onSelect={onSelect}
            />
          ))}
        </div>
      </div>

      {compact ? (
        <div
          className="mt-3 flex items-center justify-center gap-3"
          role="group"
          aria-label={t("assessment.v4ZoneSurvival")}
        >
          {orbInstances
            .filter((orb) => orb.zone === "survival")
            .map((orb) => (
              <V4ConstellationOrbNode
                key={orb.id}
                id={orb.id}
                x={0}
                y={0}
                sizePx={orb.ringPx}
                color={orb.color}
                zone={orb.zone}
                hot={hoverId === orb.id}
                selected={lockId === orb.id}
                dominant={orb.dominant}
                quiet={orb.quiet}
                touch
                flow
                allowHover={!isMobile}
                ariaLabel={orb.ariaLabel}
                onHover={onHover}
                onLeave={onLeave}
                onSelect={onSelect}
              />
            ))}
        </div>
      ) : null}

      <div
        data-slot="v4-cartography-dock"
        className="mt-3 min-h-11 px-3 pb-[max(0px,env(safe-area-inset-bottom))] text-center sm:mt-6 sm:min-h-12 sm:px-6 sm:pb-0"
        aria-live="polite"
      >
        {detailName ? (
          <>
            <p className="text-base font-medium leading-snug text-text-primary sm:text-sm">{detailName}</p>
            <p className="mt-1.5 text-xs tabular-nums text-text-tertiary">{detailMeta}</p>
          </>
        ) : (
          <p className="text-base leading-snug text-text-secondary sm:text-sm">
            {glanceLight ? (
              <span style={{ color: ZONE_COLORS.light }}>{glanceLight}</span>
            ) : null}
            {glanceLight && glanceShadow ? (
              <span className="text-text-tertiary/40"> · </span>
            ) : null}
            {glanceShadow ? (
              <span style={{ color: ZONE_COLORS.shadow }}>{glanceShadow}</span>
            ) : null}
            {totalPolePoints > 0 ? (
              <span className="text-xs tabular-nums text-text-tertiary/70">
                {" · "}
                {t("assessment.v4TotalScoreShort", { total: totalPolePoints.toFixed(0) })}
              </span>
            ) : null}
          </p>
        )}
      </div>
    </div>
  );
}
