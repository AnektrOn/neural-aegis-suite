/**
 * 12-archetype radar chart for the Deep Dive report.
 *
 * Plots intensity (0..1) for each of the 12 major archetypes around the wheel.
 * Light/shadow shown as overlay rings. Pure presentational — derives data
 * from a SampleProfile + the ARCH_ALL_KEYS list.
 */

import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip,
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
  child: "Child", victim: "Victim", saboteur: "Saboteur", prostitute: "Prostitute",
};

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

  return (
    <Card className="neural-card p-6 backdrop-blur-3xl bg-white/[0.03] border border-white/10">
      <div className="flex items-center gap-2 text-text-tertiary text-xs uppercase tracking-[0.2em] font-display mb-1">
        <Compass size={14} strokeWidth={1.5} />
        {title}
      </div>
      <p className="text-xs text-text-tertiary mb-4">
        Cartographie de l'intensité (orange) avec décomposition lumière (vert) / ombre (ambre) sur les 12 archétypes majeurs.
      </p>

      <div className="w-full h-[420px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius="78%">
            <PolarGrid stroke="hsl(var(--border))" strokeOpacity={0.25} />
            <PolarAngleAxis
              dataKey="archetype"
              tick={{ fill: "hsl(var(--text-secondary, var(--muted-foreground)))", fontSize: 11, fontFamily: "Cinzel, serif", letterSpacing: "0.08em" }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }}
              stroke="transparent"
              tickCount={5}
            />
            <Radar
              name="Intensité"
              dataKey="intensity"
              stroke="hsl(24 70% 60%)"
              fill="hsl(24 70% 60%)"
              fillOpacity={0.18}
              strokeWidth={1.5}
            />
            <Radar
              name="Lumière"
              dataKey="light"
              stroke="hsl(160 70% 55%)"
              fill="hsl(160 70% 55%)"
              fillOpacity={0.08}
              strokeWidth={1}
            />
            <Radar
              name="Ombre"
              dataKey="shadow"
              stroke="hsl(38 92% 60%)"
              fill="transparent"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 12,
                fontFamily: "'Space Grotesk', sans-serif",
              }}
              labelStyle={{ color: "hsl(var(--foreground))", fontFamily: "Cinzel, serif", letterSpacing: "0.08em" }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap items-center gap-4 mt-3 text-[11px] text-text-tertiary font-display tracking-wider">
        <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-[hsl(24_70%_60%)]" /> Intensité</span>
        <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-[hsl(160_70%_55%)]" /> Lumière</span>
        <span className="flex items-center gap-1.5"><span className="size-2 rounded-full border border-[hsl(38_92%_60%)] border-dashed" /> Ombre</span>
      </div>
    </Card>
  );
}
