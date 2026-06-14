/**
 * PerspectiveRadarComparison
 *
 * Dual-overlay radar chart — baseline (initial Deep Dive) vs. tracking scores.
 * Shows the evolution of all 12 Myss archetypes.
 */

import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip, Legend,
} from "recharts";
import { Compass } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { ArchetypeScoresMap } from "../domain/types";
import type { AnyArchetypeKey } from "@/features/archetype-deepdive-v2/domain/types";

const TWELVE_ARCHETYPES: AnyArchetypeKey[] = [
  "sovereign", "warrior", "lover", "caregiver",
  "creator", "explorer", "rebel", "sage",
  "mystic", "healer", "magician", "jester",
];

const ARCH_LABEL_FR: Record<AnyArchetypeKey, string> = {
  sovereign: "Souverain", warrior: "Guerrier", lover: "Amant", caregiver: "Gardien",
  creator: "Créateur", explorer: "Explorateur", rebel: "Rebelle", sage: "Sage",
  mystic: "Mystique", healer: "Guérisseur", magician: "Magicien", jester: "Bouffon",
  child: "Enfant", victim: "Victime", saboteur: "Saboteur", prostitute: "Prostituée",
};

interface Props {
  baselineScores: ArchetypeScoresMap;
  trackingScores: ArchetypeScoresMap;
  locale?: "fr" | "en";
}

interface RadarDataPoint {
  archetype: string;
  baseline: number;
  tracking: number;
}

function toPercent(v: number, maxV: number): number {
  if (maxV === 0) return 0;
  return Math.round((v / maxV) * 100);
}

export function PerspectiveRadarComparison({ baselineScores, trackingScores, locale = "fr" }: Props) {
  // Find global max for normalisation
  const allValues = TWELVE_ARCHETYPES.flatMap((arch) => [
    baselineScores[arch]?.intensity ?? 0,
    trackingScores[arch]?.intensity ?? 0,
  ]);
  const maxVal = Math.max(...allValues, 0.01);

  const data: RadarDataPoint[] = TWELVE_ARCHETYPES.map((arch) => ({
    archetype: ARCH_LABEL_FR[arch],
    baseline:  toPercent(baselineScores[arch]?.intensity ?? 0, maxVal),
    tracking:  toPercent(trackingScores[arch]?.intensity ?? 0, maxVal),
  }));

  const hasTracking = Object.keys(trackingScores).length > 0;

  return (
    <Card className="neural-card p-5 sm:p-6 backdrop-blur-3xl bg-white/[0.03] border border-white/10">
      <div className="flex items-center gap-2 text-text-tertiary text-xs uppercase tracking-[0.2em] font-display mb-1">
        <Compass size={13} strokeWidth={1.5} />
        {locale === "fr" ? "Roue d'évolution" : "Evolution wheel"}
      </div>
      <p className="text-xs text-text-tertiary mb-5">
        {locale === "fr"
          ? "Comparaison baseline (orange) vs. période de tracking (violet) sur les 12 archétypes Myss."
          : "Baseline (orange) vs. tracking period (purple) across the 12 Myss archetypes."}
      </p>

      <div className="w-full h-[360px] sm:h-[420px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius="76%">
            <PolarGrid stroke="hsl(var(--border))" strokeOpacity={0.2} />
            <PolarAngleAxis
              dataKey="archetype"
              tick={{
                fill: "hsl(var(--text-secondary, var(--muted-foreground)))",
                fontSize: 10,
                fontFamily: "Cinzel, serif",
                letterSpacing: "0.06em",
              }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }}
              stroke="transparent"
              tickCount={4}
            />
            <Radar
              name={locale === "fr" ? "Baseline (Deep Dive)" : "Baseline (Deep Dive)"}
              dataKey="baseline"
              stroke="hsl(24 70% 60%)"
              fill="hsl(24 70% 60%)"
              fillOpacity={0.15}
              strokeWidth={2}
              strokeDasharray="4 2"
            />
            {hasTracking && (
              <Radar
                name={locale === "fr" ? "Période actuelle" : "Current period"}
                dataKey="tracking"
                stroke="hsl(265 65% 65%)"
                fill="hsl(265 65% 65%)"
                fillOpacity={0.18}
                strokeWidth={1.5}
              />
            )}
            <Tooltip
              contentStyle={{
                background: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 12,
                fontFamily: "'Space Grotesk', sans-serif",
              }}
              labelStyle={{
                color: "hsl(var(--foreground))",
                fontFamily: "Cinzel, serif",
                letterSpacing: "0.06em",
              }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(value) => (
                <span style={{ fontSize: 11, color: "hsl(var(--muted-foreground))", fontFamily: "'Space Grotesk', sans-serif" }}>
                  {value}
                </span>
              )}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {!hasTracking && (
        <p className="text-center text-xs text-text-tertiary mt-3 italic">
          {locale === "fr"
            ? "Répondez à votre check-in quotidien pour voir votre évolution ici."
            : "Answer your daily check-in to see your evolution here."}
        </p>
      )}
    </Card>
  );
}
