import type { SampleProfile } from "@/features/archetype-deepdive-v2/domain/sampleProfile";
import type { AnyArchetypeKey } from "@/features/archetype-deepdive-v2/domain/types";
import { archetypeMeta } from "@/features/archetype-assessment/services/assessmentService";
import type { ArchetypeKey } from "@/features/archetype-assessment/domain/types";
import { useLanguage } from "@/i18n/LanguageContext";
import { themeFor } from "../lib/archetypeTheme";
import { PersonaStatBar } from "./PersonaStatBar";

function archName(key: AnyArchetypeKey, locale: "fr" | "en"): string {
  const meta = archetypeMeta(key as ArchetypeKey);
  if (!meta) return key;
  const raw = locale === "fr" ? meta.name_fr : meta.name_en;
  return raw.replace(/^The |^Le |^L'|^La /i, "").trim();
}

function StatTile({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-border/30 bg-background/35 px-3 py-3 min-h-[72px] flex flex-col justify-between">
      <span className="font-display text-[9px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <p className="font-display text-2xl tabular-nums leading-none" style={accent ? { color: accent } : undefined}>
        {value}
      </p>
      {sub ? <span className="text-[10px] text-muted-foreground tabular-nums">{sub}</span> : <span className="h-3" />}
    </div>
  );
}

interface PersonaStatsSectionProps {
  profile: SampleProfile;
}

export function PersonaStatsSection({ profile }: PersonaStatsSectionProps) {
  const { locale, t } = useLanguage();
  const triad = profile.narrative.archetypeBlocks;
  const dominantKey = triad[0]?.archetype;
  const dominantMajor = profile.majors.find((m) => m.archetype === dominantKey);

  const domIntensity = dominantMajor ? Math.round(dominantMajor.intensity * 100) : 0;
  const domLight = dominantMajor ? Math.round(dominantMajor.light * 100) : 0;
  const domShadow = dominantMajor ? Math.round(dominantMajor.shadow * 100) : 0;

  const activeShadows = profile.survival.filter((s) => s.intensity >= 0.35);
  const topShadow = [...activeShadows].sort((a, b) => b.intensity - a.intensity)[0];
  const veryActiveCount = profile.wheelBuckets.veryActive.length;

  return (
    <section className="glass-card rounded-2xl p-4 space-y-4">
      <h2 className="font-display text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
        {t("persona.glimpse.stats")}
      </h2>

      <div className="grid grid-cols-2 gap-2">
        <StatTile
          label={t("persona.glimpse.statIntensity")}
          value={`${domIntensity}%`}
          sub={dominantKey ? archName(dominantKey, locale) : undefined}
          accent={dominantKey ? themeFor(dominantKey).color : undefined}
        />
        <StatTile
          label={t("persona.glimpse.statActive")}
          value={String(veryActiveCount)}
          sub={t("persona.glimpse.statActiveSub")}
        />
        <StatTile
          label={t("persona.profile.light")}
          value={`${domLight}%`}
          accent="hsl(var(--success))"
        />
        <StatTile
          label={t("persona.profile.shadow")}
          value={`${domShadow}%`}
          accent="hsl(var(--warning))"
        />
      </div>

      <div className="space-y-3 pt-1 border-t border-border/20">
        <p className="font-display text-[9px] uppercase tracking-wider text-muted-foreground">
          {t("persona.glimpse.triadIntensity")}
        </p>
        {triad.map((b) => {
          const major = profile.majors.find((m) => m.archetype === b.archetype);
          const pct = major ? Math.round(major.intensity * 100) : 0;
          const color = themeFor(b.archetype).color;
          return (
            <div key={b.archetype} className="space-y-1">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="text-muted-foreground truncate">{archName(b.archetype, locale)}</span>
                <span className="tabular-nums text-foreground font-display">{pct}%</span>
              </div>
              <PersonaStatBar value={pct} color={color} />
            </div>
          );
        })}
      </div>

      {topShadow ? (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-border/25 bg-background/30 px-3 py-2.5 text-xs">
          <span className="text-muted-foreground">{t("persona.glimpse.statSurvival")}</span>
          <span className="font-display uppercase tracking-wider text-foreground/90">
            {archName(topShadow.archetype, locale)}
            <span className="ml-2 tabular-nums text-muted-foreground">
              {Math.round(topShadow.intensity * 100)}%
            </span>
          </span>
        </div>
      ) : null}
    </section>
  );
}
