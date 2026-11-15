/**
 * 12-archetype radar chart for the Deep Dive report.
 *
 * Plots intensity (0..1) for each of the 12 major archetypes around the wheel.
 * Light/shadow shown as overlay rings. Pure presentational — derives data
 * from a SampleProfile + the ARCH_ALL_KEYS list.
 *
 * Uses measured fixed width/height (not ResponsiveContainer %) so the SVG
 * viewBox stays aligned with the grid — avoids the classic Recharts shift
 * under backdrop-blur / transform parents and during html2canvas export.
 */

import { useLayoutEffect, useRef, useState } from "react";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Tooltip,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Compass } from "lucide-react";
import type { SampleProfile } from "../domain/sampleProfile";
import type { AnyArchetypeKey } from "../domain/types";

/** Canonical 12 major archetypes (Myss wheel). */
const TWELVE_ARCHETYPES: AnyArchetypeKey[] = [
  "sovereign", "warrior", "lover", "caregiver",
  "creator", "explorer", "rebel", "sage",
  "mystic", "healer", "magician", "jester",
];

const ARCH_LABEL_FR: Record<AnyArchetypeKey, string> = {
  sovereign: "Sovereign", warrior: "Warrior", lover: "Lover", caregiver: "Caregiver",
  creator: "Creator", explorer: "Explorer", rebel: "Rebel", sage: "Sage",
  mystic: "Mystique", healer: "Healer", magician: "Magicien", jester: "Jester",
  child: "Child", victim: "Victim", saboteur: "Saboteur", prostitute: "Prostituée",
};

const CHART_H_DESKTOP = 420;
const CHART_H_MOBILE = 340;
const MIN_W = 200;
/** Matches exportDeepDiveScreenshot DESKTOP_EXPORT_WIDTH_PX - 120 */
const EXPORT_CHART_W = 1160;

/** Solid colors — html2canvas mishandles hsl(var(--token)) on SVG strokes. */
const STROKE_GRID = "rgba(255,255,255,0.22)";
const STROKE_TICK = "rgba(232,220,205,0.85)";
const COLOR_INTENSITY = "#e8955a";
const COLOR_LIGHT = "#3ecf9a";
const COLOR_SHADOW = "#e8b84a";

interface DeepDiveRadarChartProps {
  profile: SampleProfile;
  /** Optional title override. */
  title?: string;
}

/**
 * Build a per-archetype score map from the profile.
 * Archetypes not present in `majors` get a baseline derived from their wheel
 * bucket (veryActive=0.7, moderate=0.5, discreet=0.25, default=0.2).
 */
function buildScores(profile: SampleProfile) {
  const explicit = new Map<AnyArchetypeKey, { intensity: number; light: number; shadow: number }>();
  for (const m of profile.majors) {
    explicit.set(m.archetype, { intensity: m.intensity, light: m.light, shadow: m.shadow });
  }

  const bucketDefaults: Record<string, number> = {
    veryActive: 0.72,
    moderate: 0.5,
    discreet: 0.28,
  };

  function bucketFor(arch: AnyArchetypeKey): number {
    if (profile.wheelBuckets.veryActive.includes(arch)) return bucketDefaults.veryActive;
    if (profile.wheelBuckets.moderate.includes(arch))   return bucketDefaults.moderate;
    if (profile.wheelBuckets.discreet.includes(arch))   return bucketDefaults.discreet;
    return 0.22;
  }

  return TWELVE_ARCHETYPES.map((arch) => {
    const e = explicit.get(arch);
    if (e) {
      return {
        archetype: ARCH_LABEL_FR[arch],
        key: arch,
        intensity: Math.round(e.intensity * 100),
        light: Math.round(e.light * e.intensity * 100),
        shadow: Math.round(e.shadow * e.intensity * 100),
      };
    }
    const baseline = bucketFor(arch);
    return {
      archetype: ARCH_LABEL_FR[arch],
      key: arch,
      intensity: Math.round(baseline * 100),
      light: Math.round(baseline * 0.6 * 100),
      shadow: Math.round(baseline * 0.4 * 100),
    };
  });
}

export function DeepDiveRadarChart({ profile, title = "Roue archétypale" }: DeepDiveRadarChartProps) {
  const data = buildScores(profile);
  const hostRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(MIN_W);

  useLayoutEffect(() => {
    const el = hostRef.current;
    if (!el) return;

    const measure = () => {
      const capturing =
        !!el.closest(".deep-dive-jpeg-capture-active") ||
        document.body.classList.contains("deep-dive-jpeg-capture-active");
      const next = capturing
        ? EXPORT_CHART_W
        : Math.max(MIN_W, Math.floor(el.getBoundingClientRect().width));
      setWidth((prev) => (prev === next ? prev : next));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    const mo = new MutationObserver(measure);
    mo.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    const root = document.getElementById("deep-dive-report-export");
    if (root) mo.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => {
      ro.disconnect();
      mo.disconnect();
    };
  }, []);

  const narrow = width < 480;
  const chartH = narrow ? CHART_H_MOBILE : CHART_H_DESKTOP;
  const outerRadius = Math.round(Math.min(width, chartH) * (narrow ? 0.27 : 0.34));
  const pad = narrow ? 22 : 40;
  const tickSize = narrow ? 9 : 11;

  return (
    <Card className="neural-card deep-dive-radar overflow-visible p-6 backdrop-blur-3xl bg-white/[0.03] border border-white/10 mb-8">
      <div className="flex items-center gap-2 text-text-tertiary text-xs uppercase tracking-[0.2em] font-display mb-1">
        <Compass size={14} strokeWidth={1.5} />
        {title}
      </div>
      <p className="text-xs text-text-tertiary mb-4">
        Cartographie de l'intensité (orange) avec décomposition lumière (vert) / ombre (ambre) sur les 12 archétypes majeurs.
      </p>

      <div
        ref={hostRef}
        className="deep-dive-radar-host w-full overflow-visible"
        style={{ height: chartH, scrollMarginBottom: "6.5rem" }}
      >
        {width > 0 ? (
          <RadarChart
            width={width}
            height={chartH}
            data={data}
            cx={width / 2}
            cy={chartH / 2}
            outerRadius={outerRadius}
            margin={{ top: pad, right: pad, bottom: pad, left: pad }}
          >
            <PolarGrid stroke={STROKE_GRID} />
            <PolarAngleAxis
              dataKey="archetype"
              tick={{
                fill: STROKE_TICK,
                fontSize: tickSize,
                fontFamily: "Cinzel, Georgia, serif",
                letterSpacing: narrow ? "0.02em" : "0.06em",
              }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={false}
              axisLine={false}
              tickCount={5}
            />
            <Radar
              name="Intensité"
              dataKey="intensity"
              stroke={COLOR_INTENSITY}
              fill={COLOR_INTENSITY}
              fillOpacity={0.22}
              strokeWidth={1.5}
              isAnimationActive={false}
            />
            <Radar
              name="Lumière"
              dataKey="light"
              stroke={COLOR_LIGHT}
              fill={COLOR_LIGHT}
              fillOpacity={0.1}
              strokeWidth={1.25}
              isAnimationActive={false}
            />
            <Radar
              name="Ombre"
              dataKey="shadow"
              stroke={COLOR_SHADOW}
              fill="transparent"
              strokeWidth={1.25}
              strokeDasharray="4 3"
              isAnimationActive={false}
            />
            <Tooltip
              wrapperClassName="deep-dive-radar-tooltip"
              contentStyle={{
                background: "#141c24",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 8,
                fontSize: 12,
                fontFamily: "'Space Grotesk', sans-serif",
                color: "#f5ebe0",
              }}
              labelStyle={{ color: "#f5ebe0", fontFamily: "Cinzel, serif", letterSpacing: "0.08em" }}
            />
          </RadarChart>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-4 mt-3 text-[11px] text-text-tertiary font-display tracking-wider">
        <span className="flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ background: COLOR_INTENSITY }} /> Intensité</span>
        <span className="flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ background: COLOR_LIGHT }} /> Lumière</span>
        <span className="flex items-center gap-1.5"><span className="size-2 rounded-full border border-dashed" style={{ borderColor: COLOR_SHADOW }} /> Ombre</span>
      </div>
    </Card>
  );
}
