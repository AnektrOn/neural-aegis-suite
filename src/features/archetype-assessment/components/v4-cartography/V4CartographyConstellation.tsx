import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";
import type { V4PoleAnalysis } from "@/features/archetype-assessment/domain/types";
import type { OrbZone } from "./v4CartographyUtils";
import {
  orbDiameterPx,
  orbDiameterVb,
  poleDisplayName,
  survivalActivation,
  ZONE_COLORS,
} from "./v4CartographyUtils";
import { V4ConstellationOrbCanvas } from "./V4ConstellationOrbCanvas";
import { V4ConstellationOrbNode } from "./V4ConstellationOrbNode";

interface Props {
  isFR: boolean;
  analysis: V4PoleAnalysis;
}

const W = 360;
const H = 380;
const CX = 180;
const CY = 190;

/** Triangles compacts, orbs légèrement plus espacés. */
const LIGHT_POS = [
  { x: 180, y: 96 },
  { x: 152, y: 160 },
  { x: 208, y: 160 },
] as const;

const SHADOW_POS = [
  { x: 180, y: 284 },
  { x: 152, y: 220 },
  { x: 208, y: 220 },
] as const;

const SURVIVAL_POS = [
  { x: 118, y: 168 },
  { x: 242, y: 168 },
  { x: 118, y: 212 },
  { x: 242, y: 212 },
] as const;

const TRI_EDGES: [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 0],
];
const WARM = ZONE_COLORS.light;
const SHADOW_TINT = ZONE_COLORS.shadow;

function parseNodeIndex(id: string): number {
  const part = id.split("-")[1];
  return part ? Number(part) : -1;
}

interface TipState {
  id: string;
  x: number;
  y: number;
}

export function V4CartographyConstellation({ isFR, analysis }: Props) {
  const { t } = useLanguage();
  const { lightAlliance, shadowCouncil, survivalGuard } = analysis;
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [tip, setTip] = useState<TipState | null>(null);
  const [placeAbove, setPlaceAbove] = useState(false);

  const lightDom = lightAlliance.reduce(
    (best, e, i) => (e.activationPercent > lightAlliance[best].activationPercent ? i : best),
    0,
  );
  const shadowDom = shadowCouncil.reduce(
    (best, e, i) => (e.activationPercent > shadowCouncil[best].activationPercent ? i : best),
    0,
  );
  const survDom = survivalGuard.reduce(
    (best, e, i) => (survivalActivation(e) > survivalActivation(survivalGuard[best]) ? i : best),
    0,
  );

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const sync = () => {
      const w = stage.clientWidth || 1;
      setScale(w / W);
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(stage);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const mqCoarse = window.matchMedia("(pointer: coarse)");
    const mqNarrow = window.matchMedia("(max-width: 640px)");
    const sync = () => setPlaceAbove(mqCoarse.matches || mqNarrow.matches);
    sync();
    mqCoarse.addEventListener("change", sync);
    mqNarrow.addEventListener("change", sync);
    return () => {
      mqCoarse.removeEventListener("change", sync);
      mqNarrow.removeEventListener("change", sync);
    };
  }, []);

  const positionFromClient = useCallback((clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return { x: clientX - rect.left, y: clientY - rect.top };
  }, []);

  const showTip = useCallback(
    (id: string, clientX: number, clientY: number) => {
      const pos = positionFromClient(clientX, clientY);
      if (!pos) return;
      setTip({ id, ...pos });
    },
    [positionFromClient],
  );

  const moveTip = useCallback(
    (clientX: number, clientY: number) => {
      const pos = positionFromClient(clientX, clientY);
      if (!pos) return;
      setTip((prev) => (prev ? { ...prev, ...pos } : null));
    },
    [positionFromClient],
  );

  const deactivateTip = useCallback((id: string) => {
    setTip((prev) => (prev?.id === id ? null : prev));
  }, []);

  const toPx = (vb: number) => vb * scale;

  const orbInstances = useMemo(() => {
    const out: {
      id: string;
      x: number;
      y: number;
      sizePx: number;
      zone: OrbZone;
      hot: boolean;
    }[] = [];

    lightAlliance.forEach((entry, i) => {
      const pos = LIGHT_POS[i];
      if (!pos) return;
      const id = `L-${i}`;
      out.push({
        id,
        x: toPx(pos.x),
        y: toPx(pos.y),
        sizePx: orbDiameterPx(orbDiameterVb(entry.activationPercent, "light", i === lightDom), scale),
        zone: "light",
        hot: tip?.id === id,
      });
    });

    shadowCouncil.forEach((entry, i) => {
      const pos = SHADOW_POS[i];
      if (!pos) return;
      const id = `S-${i}`;
      out.push({
        id,
        x: toPx(pos.x),
        y: toPx(pos.y),
        sizePx: orbDiameterPx(orbDiameterVb(entry.activationPercent, "shadow", i === shadowDom), scale),
        zone: "shadow",
        hot: tip?.id === id,
      });
    });

    survivalGuard.forEach((entry, i) => {
      const pos = SURVIVAL_POS[i];
      if (!pos) return;
      const id = `G-${i}`;
      out.push({
        id,
        x: toPx(pos.x),
        y: toPx(pos.y),
        sizePx: orbDiameterPx(
          orbDiameterVb(survivalActivation(entry), "survival", i === survDom),
          scale,
        ),
        zone: "survival",
        hot: tip?.id === id,
      });
    });

    return out;
  }, [
    lightAlliance,
    shadowCouncil,
    survivalGuard,
    lightDom,
    shadowDom,
    survDom,
    scale,
    tip?.id,
  ]);

  let tooltip: React.ReactNode = null;
  if (tip?.id.startsWith("L-")) {
    const e = lightAlliance[parseNodeIndex(tip.id)];
    if (e) {
      tooltip = (
        <>
          <span className="font-semibold tracking-wide" style={{ color: ZONE_COLORS.light }}>
            {poleDisplayName(e, isFR)}
          </span>
          <span className="ml-2 tabular-nums text-text-tertiary">{e.activationPercent.toFixed(1)}%</span>
        </>
      );
    }
  } else if (tip?.id.startsWith("S-")) {
    const e = shadowCouncil[parseNodeIndex(tip.id)];
    if (e) {
      tooltip = (
        <>
          <span className="font-semibold tracking-wide" style={{ color: ZONE_COLORS.shadow }}>
            {poleDisplayName(e, isFR)}
          </span>
          <span className="ml-2 tabular-nums text-text-tertiary">{e.activationPercent.toFixed(1)}%</span>
        </>
      );
    }
  } else if (tip?.id.startsWith("G-")) {
    const e = survivalGuard[parseNodeIndex(tip.id)];
    if (e) {
      const name = isFR ? e.name_fr : e.name_en;
      tooltip = (
        <>
          <span className="font-semibold tracking-wide" style={{ color: ZONE_COLORS.survival }}>
            {name}
          </span>
          <span className="ml-2 tabular-nums text-text-tertiary">
            {isFR ? "L" : "L"} {e.lightPercent.toFixed(0)}%
            <span className="mx-1 opacity-30">·</span>
            {isFR ? "O" : "S"} {e.shadowPercent.toFixed(0)}%
          </span>
        </>
      );
    }
  }

  return (
    <div ref={containerRef} className="relative w-full select-none overflow-visible">
      <div
        ref={stageRef}
        className="v4-constellation-stage relative mx-auto w-full overflow-visible rounded-xl"
        style={{ aspectRatio: `${W} / ${H}` }}
      >
        <V4ConstellationOrbCanvas instances={orbInstances} />

        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="pointer-events-none absolute inset-0 z-[2] h-full w-full overflow-visible"
          aria-hidden
        >
          <defs>
            <linearGradient id="v4-survival-line" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={ZONE_COLORS.survival} stopOpacity="0.45" />
              <stop offset="100%" stopColor={ZONE_COLORS.survival} stopOpacity="0.06" />
            </linearGradient>
          </defs>

          <text
            x={CX}
            y={28}
            textAnchor="middle"
            fontSize={8}
            fontWeight={600}
            letterSpacing="0.28em"
            fill={WARM}
            fillOpacity={0.55}
          >
            {t("assessment.v4ZoneLight")}
          </text>
          <text
            x={CX}
            y={H - 12}
            textAnchor="middle"
            fontSize={8}
            fontWeight={600}
            letterSpacing="0.28em"
            fill={SHADOW_TINT}
            fillOpacity={0.45}
          >
            {t("assessment.v4ZoneShadow")}
          </text>
          <text
            x={18}
            y={CY - 4}
            textAnchor="start"
            fontSize={7}
            fontWeight={600}
            letterSpacing="0.22em"
            fill={ZONE_COLORS.survival}
            fillOpacity={0.7}
            transform={`rotate(-90 18 ${CY})`}
          >
            {t("assessment.v4ZoneSurvival")}
          </text>
          <text
            x={W - 18}
            y={CY - 4}
            textAnchor="end"
            fontSize={7}
            fontWeight={600}
            letterSpacing="0.22em"
            fill={ZONE_COLORS.survival}
            fillOpacity={0.7}
            transform={`rotate(90 ${W - 18} ${CY})`}
          >
            {t("assessment.v4ZoneSurvival")}
          </text>
          <line
            x1={60}
            y1={CY}
            x2={W - 60}
            y2={CY}
            stroke="currentColor"
            strokeOpacity={0.06}
            strokeWidth={0.5}
            strokeDasharray="3 5"
          />
          {TRI_EDGES.map(([a, b]) => (
            <line
              key={`le-${a}${b}`}
              x1={LIGHT_POS[a].x}
              y1={LIGHT_POS[a].y}
              x2={LIGHT_POS[b].x}
              y2={LIGHT_POS[b].y}
              stroke={WARM}
              strokeOpacity={0.18}
              strokeWidth={0.6}
            />
          ))}
          {TRI_EDGES.map(([a, b]) => (
            <line
              key={`se-${a}${b}`}
              x1={SHADOW_POS[a].x}
              y1={SHADOW_POS[a].y}
              x2={SHADOW_POS[b].x}
              y2={SHADOW_POS[b].y}
              stroke={SHADOW_TINT}
              strokeOpacity={0.14}
              strokeWidth={0.6}
            />
          ))}
          {survivalGuard.map((_, i) => {
            const pos = SURVIVAL_POS[i];
            if (!pos) return null;
            return (
              <line
                key={`gc-${i}`}
                x1={pos.x}
                y1={pos.y}
                x2={CX}
                y2={CY}
                stroke="url(#v4-survival-line)"
                strokeOpacity={0.6}
                strokeWidth={0.9}
              />
            );
          })}
          <circle cx={CX} cy={CY} r={3} fill={WARM} fillOpacity={0.15} />
          <circle cx={CX} cy={CY} r={1.2} fill={WARM} fillOpacity={0.5} />
        </svg>

        <div
          className="absolute inset-0 z-[3]"
          aria-label={t("assessment.v4ConstellationAria")}
        >
          {orbInstances.map((orb) => {
            const isDom =
              orb.id === `L-${lightDom}` ||
              orb.id === `S-${shadowDom}` ||
              orb.id === `G-${survDom}`;
            const ariaLabel =
              orb.id.startsWith("L-") || orb.id.startsWith("S-")
                ? (() => {
                    const list = orb.id.startsWith("L-") ? lightAlliance : shadowCouncil;
                    const e = list[parseNodeIndex(orb.id)];
                    return e
                      ? `${poleDisplayName(e, isFR)} ${e.activationPercent.toFixed(1)}%`
                      : orb.id;
                  })()
                : (() => {
                    const e = survivalGuard[parseNodeIndex(orb.id)];
                    return e ? (isFR ? e.name_fr : e.name_en) : orb.id;
                  })();

            return (
              <V4ConstellationOrbNode
                key={orb.id}
                id={orb.id}
                x={orb.x}
                y={orb.y}
                sizePx={orb.sizePx}
                hot={orb.hot}
                dominant={isDom}
                ariaLabel={ariaLabel}
                onActivate={showTip}
                onMove={moveTip}
                onDeactivate={deactivateTip}
              />
            );
          })}
        </div>
      </div>

      {tip && tooltip ? (
        <div
          className={cn(
            "pointer-events-none absolute z-[60] whitespace-nowrap rounded-lg border border-white/10",
            "bg-[hsl(var(--card)/0.92)] px-3 py-1.5 text-xs shadow-lg",
          )}
          style={{
            left: tip.x,
            top: tip.y,
            transform: placeAbove
              ? "translate(-50%, calc(-100% - 14px))"
              : "translate(-50%, 16px)",
          }}
          role="tooltip"
        >
          {tooltip}
        </div>
      ) : null}

      <div className="mt-4 flex items-center justify-center gap-6 pointer-events-none">
        {[
          { color: ZONE_COLORS.light, label: t("assessment.v4LegendLight") },
          { color: ZONE_COLORS.shadow, label: t("assessment.v4LegendShadow") },
          { color: ZONE_COLORS.survival, label: t("assessment.v4LegendSurvival") },
        ].map(({ color, label }) => (
          <span
            key={label}
            className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-text-tertiary/70"
          >
            <span className="inline-block size-[6px] shrink-0 rounded-full" style={{ background: color, opacity: 0.85 }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
