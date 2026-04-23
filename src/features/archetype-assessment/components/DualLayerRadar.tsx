import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { archetypeMeta } from "../services/assessmentService";
import { ARCHETYPE_KEYS } from "../domain/archetypes";
import type { ArchetypeKey } from "../domain/types";

const SHADOW_KEYS = ["control", "victim", "prostitute", "saboteur"] as const;
type ShadowKey = (typeof SHADOW_KEYS)[number];

interface Props {
  isFR: boolean;
  /** Current session normalized light scores (0..100). */
  lightScores: Array<{ archetype_key: string; normalized_score: number }>;
  /** Current session shadow signals (0..1 from analysis_results). */
  shadowSignals: Record<string, number>;
  /** Optional previous session light scores for ghost overlay. */
  previousLightScores?: Array<{ archetype_key: string; normalized_score: number }> | null;
  showPrevious?: boolean;
}

const SHADOW_LABELS_FR: Record<ShadowKey, string> = {
  control: "Contrôle",
  victim: "Victime",
  prostitute: "Prostitué·e",
  saboteur: "Saboteur",
};
const SHADOW_LABELS_EN: Record<ShadowKey, string> = {
  control: "Control",
  victim: "Victim",
  prostitute: "Prostitute",
  saboteur: "Saboteur",
};

export function DualLayerRadar({
  isFR,
  lightScores,
  shadowSignals,
  previousLightScores,
  showPrevious = false,
}: Props) {
  // Build a unified axis list: 12 archetypes + 4 shadows.
  const lightMap = new Map(
    lightScores.map((s) => [s.archetype_key, Number(s.normalized_score) || 0])
  );
  const prevMap = new Map(
    (previousLightScores ?? []).map((s) => [s.archetype_key, Number(s.normalized_score) || 0])
  );

  const archetypeRows = ARCHETYPE_KEYS.map((k) => {
    const meta = archetypeMeta(k as ArchetypeKey);
    return {
      axis: isFR ? meta?.name_fr ?? k : meta?.name_en ?? k,
      light: Math.round(lightMap.get(k) ?? 0),
      previous: showPrevious ? Math.round(prevMap.get(k) ?? 0) : 0,
      shadow: 0,
    };
  });

  // Shadow signals are stored in 0..1 — scale to 0..100 to share the same axis.
  const shadowRows = SHADOW_KEYS.map((k) => ({
    axis: isFR ? SHADOW_LABELS_FR[k] : SHADOW_LABELS_EN[k],
    light: 0,
    previous: 0,
    shadow: Math.round((Number(shadowSignals[k] ?? 0) || 0) * 100),
  }));

  const data = [...archetypeRows, ...shadowRows];
  const maxVal = Math.max(20, ...data.map((d) => Math.max(d.light, d.shadow, d.previous)));

  return (
    <div className="w-full h-[420px]">
      <ResponsiveContainer>
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis dataKey="axis" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
          <PolarRadiusAxis domain={[0, maxVal]} tick={{ fontSize: 9 }} angle={90} />

          {showPrevious && previousLightScores && previousLightScores.length > 0 && (
            <Radar
              name={isFR ? "Session précédente" : "Previous session"}
              dataKey="previous"
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="2 4"
              strokeWidth={1}
              fill="hsl(var(--muted-foreground))"
              fillOpacity={0.06}
            />
          )}

          <Radar
            name={isFR ? "Profil lumière" : "Light profile"}
            dataKey="light"
            stroke="hsl(var(--primary))"
            strokeWidth={1.5}
            fill="hsl(var(--primary))"
            fillOpacity={0.35}
          />

          <Radar
            name={isFR ? "Profil ombre" : "Shadow profile"}
            dataKey="shadow"
            stroke="hsl(var(--secondary-foreground))"
            strokeDasharray="5 4"
            strokeWidth={1.5}
            fill="hsl(var(--secondary-foreground))"
            fillOpacity={0.08}
          />

          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
            iconType="line"
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
