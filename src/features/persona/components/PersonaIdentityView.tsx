import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  Sparkles,
  ArrowUpRight,
  Flame,
  Eye,
  ShieldAlert,
  Clock,
  Layers,
} from "lucide-react";
import { NeuralCard } from "@/components/ui/neural-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SampleProfile } from "@/features/archetype-deepdive-v2/domain/sampleProfile";
import type { AnyArchetypeKey } from "@/features/archetype-deepdive-v2/domain/types";
import { archetypeMeta } from "@/features/archetype-assessment/services/assessmentService";
import type { ArchetypeKey } from "@/features/archetype-assessment/domain/types";
import { useLanguage } from "@/i18n/LanguageContext";
import { parseProfileLabel } from "../lib/parseProfileLabel";

const RANK_LABEL = {
  dominant: { fr: "Dominant", en: "Dominant" },
  secondaire: { fr: "Secondaire", en: "Secondary" },
  tertiaire: { fr: "Tertiaire", en: "Tertiary" },
} as const;

function archName(key: AnyArchetypeKey, locale: "fr" | "en"): string {
  const meta = archetypeMeta(key as ArchetypeKey);
  if (!meta) return key;
  return locale === "fr" ? meta.name_fr : meta.name_en;
}

function archColor(key: AnyArchetypeKey): string {
  return archetypeMeta(key as ArchetypeKey)?.color ?? "hsl(var(--primary))";
}

interface PersonaIdentityViewProps {
  profile: SampleProfile;
}

export function PersonaIdentityView({ profile }: PersonaIdentityViewProps) {
  const { locale, t } = useLanguage();
  const isFR = locale === "fr";
  const reduceMotion = useReducedMotion();
  const n = profile.narrative;
  const { name, classTitle } = parseProfileLabel(profile.label);
  const triad = n.archetypeBlocks;

  const fade = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 16 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: "-40px" },
        transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
      };

  return (
    <div className="space-y-10 sm:space-y-12">
      {/* Cover — identity manifesto, not a report deck */}
      <motion.section {...fade} className="relative">
        <NeuralCard variant="premium" glow="warm" className="p-6 sm:p-10 md:p-12 overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 right-0 h-64 w-64 rounded-full opacity-40 blur-3xl"
            style={{
              background: `radial-gradient(circle, ${archColor(triad[0]?.archetype ?? "mystic")} 0%, transparent 70%)`,
            }}
          />

          <div className="relative space-y-6">
            <div className="inline-flex items-center gap-2 text-primary text-xs uppercase tracking-[0.2em] font-display">
              <Sparkles className="w-4 h-4" strokeWidth={1.5} aria-hidden />
              {t("persona.eyebrow")}
            </div>

            {/* Triad constellation — signature visuelle Persona */}
            <div className="flex items-center gap-0 max-w-md" aria-hidden>
              {triad.map((b, i) => (
                <div key={b.archetype} className="flex items-center flex-1 min-w-0">
                  <div
                    className="size-3 sm:size-3.5 rounded-full shrink-0 ring-2 ring-background/80"
                    style={{ backgroundColor: archColor(b.archetype) }}
                  />
                  {i < triad.length - 1 ? (
                    <div
                      className="h-px flex-1 mx-1 opacity-50"
                      style={{
                        background: `linear-gradient(90deg, ${archColor(b.archetype)}, ${archColor(triad[i + 1].archetype)})`,
                      }}
                    />
                  ) : null}
                </div>
              ))}
            </div>

            <div className="space-y-3">
              {name ? (
                <p className="font-display text-xs uppercase tracking-[0.25em] text-muted-foreground">
                  {name}
                </p>
              ) : null}
              <h2 className="font-cormorant-display text-4xl sm:text-5xl md:text-6xl text-foreground leading-[1.08] tracking-tight">
                {classTitle}
              </h2>
              {profile.subtitle ? (
                <p className="font-body text-sm text-muted-foreground max-w-xl">{profile.subtitle}</p>
              ) : null}
            </div>

            <blockquote className="border-l-2 border-primary/40 pl-5 font-serif text-lg sm:text-xl text-foreground/90 leading-relaxed italic max-w-3xl">
              {n.overviewLead}
            </blockquote>

            <div className="flex flex-wrap gap-2 pt-1">
              {triad.map((b) => (
                <Badge
                  key={b.archetype}
                  variant="outline"
                  className="border-border/50 bg-background/30 font-display text-[10px] tracking-wider uppercase"
                >
                  {archName(b.archetype, locale)}
                </Badge>
              ))}
              <Badge
                variant="outline"
                className="border-accent-warning/30 text-accent-warning font-display text-[10px] tracking-wider uppercase"
              >
                {isFR ? "Ombre" : "Shadow"} · {n.primaryShadowTheme}
              </Badge>
            </div>
          </div>
        </NeuralCard>
      </motion.section>

      {/* Pillars — static identity columns (no flip deck) */}
      <motion.section {...fade} className="space-y-4">
        <div className="flex items-center justify-between gap-4 border-b border-border/20 pb-3">
          <h3 className="font-display text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {t("persona.identity.pillars")}
          </h3>
          <span className="hidden sm:inline font-display text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
            {t("persona.identity.pillarsHint")}
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {n.archetypeBlocks.map((b) => {
            const color = archColor(b.archetype);
            const major = profile.majors.find((m) => m.archetype === b.archetype);
            const pct = major ? Math.round(major.intensity * 100) : null;

            return (
              <NeuralCard
                key={b.archetype}
                variant="elevated"
                className="p-5 sm:p-6 flex flex-col gap-4 border-t-2"
                style={{ borderTopColor: color }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    {RANK_LABEL[b.rank][locale]}
                  </span>
                  {pct !== null ? (
                    <span className="font-display text-xs tabular-nums text-muted-foreground">{pct}%</span>
                  ) : null}
                </div>

                <div>
                  <h4 className="font-serif text-2xl text-foreground leading-tight">
                    {archName(b.archetype, locale)}
                  </h4>
                  <p className="mt-2 text-sm italic text-muted-foreground leading-relaxed">{b.tagline}</p>
                </div>

                <div className="space-y-3 mt-auto pt-2 border-t border-border/15 text-sm">
                  <div>
                    <p className="font-display text-[10px] uppercase tracking-[0.18em] text-emerald-400/80 mb-1">
                      {t("persona.identity.gives")}
                    </p>
                    <p className="text-muted-foreground leading-relaxed">{b.gives}</p>
                  </div>
                  <div>
                    <p className="font-display text-[10px] uppercase tracking-[0.18em] text-accent-warning/80 mb-1">
                      {t("persona.identity.watch")}
                    </p>
                    <p className="text-muted-foreground leading-relaxed">{b.watchOut}</p>
                  </div>
                </div>
              </NeuralCard>
            );
          })}
        </div>
      </motion.section>

      {/* Narrative mirror */}
      <motion.section {...fade} className="grid gap-4 lg:grid-cols-5">
        <NeuralCard variant="default" glow="purple" className="lg:col-span-3 p-6 sm:p-8 space-y-4">
          <h3 className="font-display text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {t("persona.identity.mirror")}
          </h3>
          <p className="font-serif text-base sm:text-lg text-foreground/90 leading-relaxed">
            {n.closingNarrativeUser}
          </p>
        </NeuralCard>

        <div className="lg:col-span-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <NeuralCard variant="default" className="p-5 space-y-3">
            <div className="flex items-center gap-1.5 font-display text-[10px] uppercase tracking-[0.2em] text-emerald-400/80">
              <Flame size={12} strokeWidth={1.5} aria-hidden />
              {t("persona.identity.strengths")}
            </div>
            <ul className="space-y-2">
              {n.strengths.slice(0, 4).map((s, i) => (
                <li key={i} className="text-sm text-muted-foreground leading-relaxed pl-3 border-l border-emerald-500/20">
                  <span
                    dangerouslySetInnerHTML={{
                      __html: s.replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground">$1</strong>'),
                    }}
                  />
                </li>
              ))}
            </ul>
          </NeuralCard>

          <NeuralCard variant="default" className="p-5 space-y-3">
            <div className="flex items-center gap-1.5 font-display text-[10px] uppercase tracking-[0.2em] text-accent-warning/80">
              <Eye size={12} strokeWidth={1.5} aria-hidden />
              {t("persona.identity.vigilance")}
            </div>
            <ul className="space-y-2">
              {n.vigilance.slice(0, 4).map((v, i) => (
                <li key={i} className="text-sm text-muted-foreground leading-relaxed pl-3 border-l border-accent-warning/25">
                  {v}
                </li>
              ))}
            </ul>
          </NeuralCard>
        </div>
      </motion.section>

      {/* Shadow signal — condensed, not full deep-dive grid */}
      <motion.section {...fade}>
        <NeuralCard variant="ghost" className="p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2 font-display text-xs uppercase tracking-[0.2em] text-muted-foreground">
            <ShieldAlert size={14} strokeWidth={1.5} aria-hidden />
            {t("persona.identity.shadowSignal")}
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">{n.survivalUser}</p>
          <div className="flex flex-wrap gap-2">
            {profile.survival
              .filter((s) => s.intensity >= 0.35)
              .slice(0, 4)
              .map((s) => (
                <span
                  key={s.archetype}
                  className="inline-flex items-center gap-2 rounded-full border border-border/40 bg-background/40 px-3 py-1 text-[11px] font-display uppercase tracking-wider text-muted-foreground"
                >
                  {archName(s.archetype, locale)}
                  <span className="tabular-nums text-foreground/80">{Math.round(s.intensity * 100)}%</span>
                </span>
              ))}
          </div>
        </NeuralCard>
      </motion.section>

      {/* Practices teaser + bridge to Deep Dive */}
      <motion.section {...fade} className="space-y-4">
        <h3 className="font-display text-xs uppercase tracking-[0.2em] text-muted-foreground border-b border-border/20 pb-3">
          {t("persona.identity.practices")}
        </h3>
        <ul className="grid gap-3 sm:grid-cols-2">
          {n.practices.slice(0, 4).map((p, i) => {
            const m = p.title.match(/(\d+)\s*min/i);
            const duration = m ? `${m[1]} min` : null;
            const cleanTitle = p.title.replace(/\s*[—-]\s*\d+\s*min/i, "").trim();
            return (
              <li key={i}>
                <NeuralCard variant="default" className="p-4 h-full flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-display text-sm uppercase tracking-wide text-foreground leading-snug">
                      {cleanTitle}
                    </span>
                    {duration ? (
                      <Badge variant="outline" className="shrink-0 text-[10px] border-border/50">
                        <Clock size={10} className="mr-1" aria-hidden />
                        {duration}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{p.description}</p>
                </NeuralCard>
              </li>
            );
          })}
        </ul>

        <NeuralCard variant="elevated" glow="blue" className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div className="space-y-2 min-w-0">
            <div className="flex items-center gap-2 text-primary">
              <Layers size={16} strokeWidth={1.5} aria-hidden />
              <span className="font-display text-xs uppercase tracking-[0.2em]">
                {t("persona.identity.deepDiveLabel")}
              </span>
            </div>
            <p className="font-serif text-lg text-foreground">{t("persona.identity.deepDiveTitle")}</p>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
              {t("persona.identity.deepDiveBody")}
            </p>
          </div>
          <Button asChild size="lg" className="min-h-[44px] shrink-0 font-display text-xs tracking-wider">
            <Link to="/deep-dive">
              {t("persona.identity.deepDiveCta")}
              <ArrowUpRight className="ml-2 w-4 h-4" aria-hidden />
            </Link>
          </Button>
        </NeuralCard>
      </motion.section>
    </div>
  );
}
