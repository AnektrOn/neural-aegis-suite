/**
 * Card-based renderer of the User Deep Dive report.
 *
 * Consumes the structured `narrative` of a SampleProfile and renders it as a
 * modular dashboard of cards (overview, archetypes, shadows, narrative,
 * practices) — preserves the "Neural & Ethereal" visual identity.
 *
 * Archetype cards behave as a flippable neural deck (front: identity, back:
 * details). Other cards use the `neural-card` hover lift utility.
 */

import { useState, type ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sparkles, ShieldAlert, BookOpen, Compass, AlertTriangle, Flame,
  Clock, Play, Eye, RotateCcw,
} from "lucide-react";
import type { SampleProfile } from "../domain/sampleProfile";
import { DeepDiveRadarChart } from "./DeepDiveRadarChart";
import type { AnyArchetypeKey } from "../domain/types";
import { useLanguage } from "@/i18n/LanguageContext";
import { V4CartographyHeroPanel } from "@/features/archetype-assessment/components/v4-cartography/V4CartographyHeroPanel";
import type { V4PoleAnalysis } from "@/features/archetype-assessment/domain/types";
import { DeepDiveSection } from "./DeepDiveSection";
import { archLabel } from "../domain/narrativeContent";
import { cn } from "@/lib/utils";

const ARCH_ACCENT: Partial<Record<AnyArchetypeKey, { ring: string; glow: string; chip: string; gradient: string }>> = {
  mystic:    { ring: "border-indigo-400/30",  glow: "shadow-[0_0_40px_-20px_rgba(129,140,248,0.6)]", chip: "bg-indigo-500/10 text-indigo-200",   gradient: "from-indigo-500/[0.08] to-transparent" },
  sage:      { ring: "border-sky-400/30",     glow: "shadow-[0_0_40px_-20px_rgba(56,189,248,0.5)]",  chip: "bg-sky-500/10 text-sky-200",         gradient: "from-sky-500/[0.08] to-transparent" },
  magician:  { ring: "border-emerald-400/30", glow: "shadow-[0_0_40px_-20px_rgba(52,211,153,0.5)]",  chip: "bg-emerald-500/10 text-emerald-200", gradient: "from-emerald-500/[0.08] to-transparent" },
  warrior:   { ring: "border-rose-400/30",    glow: "shadow-[0_0_40px_-20px_rgba(251,113,133,0.5)]", chip: "bg-rose-500/10 text-rose-200",       gradient: "from-rose-500/[0.08] to-transparent" },
  sovereign: { ring: "border-amber-400/30",   glow: "shadow-[0_0_40px_-20px_rgba(251,191,36,0.5)]",  chip: "bg-amber-500/10 text-amber-200",     gradient: "from-amber-500/[0.08] to-transparent" },
  creator:   { ring: "border-fuchsia-400/30", glow: "shadow-[0_0_40px_-20px_rgba(232,121,249,0.5)]", chip: "bg-fuchsia-500/10 text-fuchsia-200", gradient: "from-fuchsia-500/[0.08] to-transparent" },
  healer:    { ring: "border-teal-400/30",    glow: "shadow-[0_0_40px_-20px_rgba(45,212,191,0.5)]",  chip: "bg-teal-500/10 text-teal-200",       gradient: "from-teal-500/[0.08] to-transparent" },
};

const DEFAULT_ACCENT = {
  ring: "border-white/10",
  glow: "",
  chip: "bg-white/5 text-text-secondary",
  gradient: "from-white/[0.04] to-transparent",
};

const RANK_LABEL: Record<"dominant" | "secondaire" | "tertiaire", { fr: string; en: string }> = {
  dominant:   { fr: "Dominant",   en: "Dominant" },
  secondaire: { fr: "Secondaire", en: "Secondary" },
  tertiaire:  { fr: "Tertiaire",  en: "Tertiary" },
};

/** Bold **markers** and line breaks for narrative copy from narrativeContent. */
function narrativeInlineHtml(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-text-primary">$1</strong>')
    .replace(/\n/g, "<br />");
}

function padStep(n: number) {
  return String(n).padStart(2, "0");
}

const DEEP_DIVE_TAB_LIST = cn(
  "no-scrollbar flex h-auto w-full snap-x snap-mandatory gap-1 overflow-x-auto overscroll-x-contain rounded-xl border border-white/10 bg-white/[0.04] p-1",
  "[-webkit-overflow-scrolling:touch] sm:flex-wrap sm:overflow-visible sm:snap-none",
);
const DEEP_DIVE_TAB_TRIGGER = cn(
  "flex min-h-11 shrink-0 snap-start items-center gap-2 rounded-lg px-3 py-2 sm:min-w-[7.5rem] sm:flex-1",
  "text-xs font-medium text-text-tertiary transition-all hover:text-text-secondary",
  "data-[state=active]:border data-[state=active]:border-white/10 data-[state=active]:bg-white/[0.08]",
  "data-[state=active]:text-text-primary data-[state=active]:shadow-sm",
);

/* -------------------------------------------------------------------------- */
/* Flippable Archetype Card                                                   */
/* -------------------------------------------------------------------------- */

interface ArchetypeFlipCardProps {
  archetype: AnyArchetypeKey;
  rank: "dominant" | "secondaire" | "tertiaire";
  tagline: string;
  gives: string;
  watchOut: string;
}

function ArchetypeFlipCard({ archetype, rank, tagline, gives, watchOut }: ArchetypeFlipCardProps) {
  const { locale, t } = useLanguage();
  const [flipped, setFlipped] = useState(false);
  const a = ARCH_ACCENT[archetype] ?? DEFAULT_ACCENT;

  return (
    <div
      className={`flip-card perspective-1200 cursor-pointer min-h-[340px] ${flipped ? "is-flipped" : ""}`}
      onClick={() => setFlipped((f) => !f)}
      role="button"
      tabIndex={0}
      aria-pressed={flipped}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setFlipped((f) => !f);
        }
      }}
    >
      <div className="flip-card-inner h-full min-h-[340px]">
        {/* FRONT */}
        <div className="flip-face">
          <Card
            className={`h-full p-5 backdrop-blur-3xl bg-gradient-to-br ${a.gradient} bg-white/[0.03] border ${a.ring} ${a.glow} neural-card flex flex-col`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase tracking-[0.25em] text-text-tertiary font-display">
                {RANK_LABEL[rank][locale]}
              </span>
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-full border text-[10px] font-display tabular-nums",
                  rank === "dominant"
                    ? "border-[hsl(var(--aegis-warm)/0.4)] bg-[hsl(var(--aegis-warm-muted)/0.35)] text-[hsl(var(--aegis-warm))]"
                    : "border-white/10 bg-white/[0.03] text-text-tertiary",
                )}
                aria-hidden
              >
                {rank === "dominant" ? "1" : rank === "secondaire" ? "2" : "3"}
              </span>
            </div>

            <div className="flex-1 flex flex-col justify-center text-center">
              <h3 className="font-display text-2xl tracking-[0.12em] uppercase text-text-primary mb-3">
                {t("deepDive.archetypeWithArticle", { name: archLabel(archetype, locale) })}
              </h3>
              <p className="text-sm italic text-text-tertiary px-2">{tagline}</p>
            </div>

            <div
              className="flip-export-hide mt-4 flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.25em] text-text-tertiary font-display opacity-60"
            >
              <RotateCcw size={11} strokeWidth={1.5} /> {t("deepDive.flipCard")}
            </div>
          </Card>
        </div>

        {/* BACK */}
        <div className="flip-face flip-face-back">
          <Card
            className={`h-full p-5 backdrop-blur-3xl bg-white/[0.04] border ${a.ring} ${a.glow} flex flex-col`}
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-display text-sm tracking-[0.12em] uppercase text-text-primary">
                {archLabel(archetype, locale)}
              </h4>
              <RotateCcw size={12} strokeWidth={1.5} className="text-text-tertiary" />
            </div>
            <div className="space-y-3 flex-1 overflow-auto">
              <div>
                <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-text-tertiary mb-1">
                  <Flame size={11} strokeWidth={1.5} /> {t("deepDive.whatItGives")}
                </div>
                <p className="text-sm text-text-secondary leading-relaxed">{gives}</p>
              </div>
              <div className="border-t border-white/5 pt-3">
                <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-accent-warning/80 mb-1">
                  <AlertTriangle size={11} strokeWidth={1.5} /> {t("deepDive.watchOut")}
                </div>
                <p className="text-sm text-text-secondary leading-relaxed">{watchOut}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

export function DeepDiveUserCards({
  profile,
  hidePractices = false,
  v4Analysis = null,
  showV4Cartography = true,
  layout = "tabs",
}: {
  profile: SampleProfile;
  hidePractices?: boolean;
  v4Analysis?: V4PoleAnalysis | null;
  showV4Cartography?: boolean;
  layout?: "tabs" | "stack";
}) {
  const { locale, t } = useLanguage();
  const n = profile.narrative;

  const tabDefs: { id: string; step: string; label: string }[] = [];
  let stepNum = 1;
  if (showV4Cartography && v4Analysis) {
    tabDefs.push({
      id: "v4",
      step: padStep(stepNum++),
      label: t("deepDive.tabCartography"),
    });
  }
  tabDefs.push({
    id: "overview",
    step: padStep(stepNum++),
    label: t("deepDive.tabOverview"),
  });
  tabDefs.push({
    id: "archetypes",
    step: padStep(stepNum++),
    label: t("deepDive.tabArchetypes"),
  });
  tabDefs.push({
    id: "survival",
    step: padStep(stepNum++),
    label: t("deepDive.tabSurvival"),
  });
  tabDefs.push({
    id: "narrative",
    step: padStep(stepNum++),
    label: t("deepDive.tabNarrative"),
  });
  if (!hidePractices) {
    tabDefs.push({
      id: "practices",
      step: padStep(stepNum++),
      label: t("deepDive.tabPractices"),
    });
  }

  const v4Section = showV4Cartography && v4Analysis ? (
    <V4CartographyHeroPanel analysis={v4Analysis} />
  ) : null;

  const overviewSection = (
    <DeepDiveSection
      icon={Sparkles}
      kicker={t("deepDive.tabOverview")}
      title={t("deepDive.landscapeTitle")}
    >
        <Card className="neural-card overflow-hidden backdrop-blur-3xl bg-white/[0.04] border border-white/10 shadow-[0_0_60px_-30px_rgba(255,255,255,0.15)]">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-0">
            <div className="relative p-6 sm:p-8 border-b lg:border-b-0 lg:border-r border-white/10 bg-gradient-to-br from-[hsl(var(--aegis-warm-muted)/0.25)] to-transparent">
              <p className="text-[10px] uppercase tracking-[0.22em] text-text-tertiary font-display mb-4">
                {t("deepDive.lightAlliance")}
              </p>
              <ul className="space-y-3">
                {n.archetypeBlocks.map((b, i) => {
                  const a = ARCH_ACCENT[b.archetype] ?? DEFAULT_ACCENT;
                  return (
                    <li key={b.archetype} className="flex items-center gap-3">
                      <span
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-full border font-display text-xs",
                          i === 0
                            ? "border-[hsl(var(--aegis-warm)/0.45)] text-[hsl(var(--aegis-warm))] bg-[hsl(var(--aegis-warm-muted)/0.35)]"
                            : "border-white/10 text-text-tertiary",
                        )}
                      >
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="font-display text-sm tracking-[0.1em] uppercase text-text-primary truncate">
                          {archLabel(b.archetype, locale)}
                        </p>
                        <p className="text-[11px] text-text-tertiary truncate">{b.tagline}</p>
                      </div>
                      <Badge variant="outline" className={cn("ml-auto shrink-0 border-0 text-[10px]", a.chip)}>
                        {RANK_LABEL[b.rank][locale]}
                      </Badge>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-5 pt-4 border-t border-white/10">
                <p className="text-[10px] uppercase tracking-[0.2em] text-accent-warning/80 font-display mb-1">
                  {t("deepDive.dominantShadow")}
                </p>
                <p className="text-sm font-medium text-text-primary">{n.primaryShadowTheme}</p>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-4">
              <p
                className="text-text-secondary leading-relaxed text-[15px]"
                dangerouslySetInnerHTML={{ __html: narrativeInlineHtml(n.overviewLead) }}
              />
              <p className="text-sm text-text-secondary leading-relaxed deep-dive-clinical-panel">
                {t("deepDive.shadowIntroPrefix")}
                <span className="text-text-primary font-medium">{n.primaryShadowTheme}</span>
                {t("deepDive.shadowIntroSuffix")}
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {n.archetypeBlocks.map((b) => {
                  const a = ARCH_ACCENT[b.archetype] ?? DEFAULT_ACCENT;
                  return (
                    <Badge key={b.archetype} variant="outline" className={`${a.chip} border-0 px-3 py-1 font-display tracking-wider`}>
                      {archLabel(b.archetype, locale)}
                    </Badge>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>

        <DeepDiveRadarChart profile={profile} />
    </DeepDiveSection>
  );

  const archetypesSection = (
      <DeepDiveSection
        icon={Compass}
        kicker={t("deepDive.majorArchetypesKicker")}
        title={t("deepDive.neuralDeckTitle")}
        description={t("deepDive.neuralDeckDesc")}
        badge={
          <span className="flip-export-hide text-[10px] uppercase tracking-[0.2em] text-text-tertiary/70 font-display hidden sm:inline">
            {t("deepDive.interactive")}
          </span>
        }
      >
        <div className="grid gap-4 md:grid-cols-3">
          {n.archetypeBlocks.map((b) => (
            <ArchetypeFlipCard
              key={b.archetype}
              archetype={b.archetype}
              rank={b.rank}
              tagline={b.tagline}
              gives={b.gives}
              watchOut={b.watchOut}
            />
          ))}
        </div>
      </DeepDiveSection>
  );

  const survivalSection = (
      <DeepDiveSection
        icon={ShieldAlert}
        kicker={t("deepDive.survivalShadowsKicker")}
        title={t("deepDive.shadowCouncil")}
      >
        <Card className="neural-card p-6 sm:p-8 backdrop-blur-3xl bg-white/[0.03] border border-white/10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {profile.survival.map((s) => {
              const pct = Math.round(s.intensity * 100);
              const isHot = s.intensity >= 0.5;
              return (
                <div
                  key={s.archetype}
                  className={cn(
                    "rounded-xl border p-3 transition-all duration-300",
                    isHot
                      ? "border-accent-warning/35 bg-accent-warning/[0.06] shadow-[0_0_24px_-8px_hsl(var(--accent-warning)/0.35)]"
                      : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04]",
                  )}
                >
                  <div className="flex items-center justify-between mb-2 gap-2">
                    <span className="text-[11px] uppercase tracking-wider text-text-secondary font-display truncate">
                      {archLabel(s.archetype, locale)}
                    </span>
                    <span className={cn("text-xs tabular-nums shrink-0", isHot ? "text-accent-warning font-medium" : "text-text-tertiary")}>
                      {pct}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-700",
                        isHot ? "bg-gradient-to-r from-accent-warning/50 to-accent-warning" : "bg-white/25",
                      )}
                      style={{ width: `${pct}%` }}
                      role="progressbar"
                      aria-valuenow={pct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${archLabel(s.archetype, locale)} ${pct}%`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div
            className="text-sm text-text-secondary leading-relaxed deep-dive-clinical-panel"
            dangerouslySetInnerHTML={{ __html: narrativeInlineHtml(n.survivalUser) }}
          />
        </Card>
      </DeepDiveSection>
  );

  const narrativeSection = (
      <DeepDiveSection
        icon={BookOpen}
        kicker={t("deepDive.narrativeKicker")}
        title={t("deepDive.crossDiagnosticTitle")}
      >
        <Card className="neural-card p-6 sm:p-8 backdrop-blur-3xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/10 shadow-[0_0_50px_-25px_rgba(255,255,255,0.2)]">
          <div
            className="text-text-secondary leading-relaxed text-base deep-dive-clinical-panel"
            dangerouslySetInnerHTML={{ __html: narrativeInlineHtml(n.closingNarrativeUser) }}
          />

          <div className="grid md:grid-cols-2 gap-5 mt-8 pt-6 border-t border-white/10">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-emerald-300/80 mb-2 font-display">
              <Flame size={11} strokeWidth={1.5} /> {t("deepDive.strengthsToLean")}
            </div>
            <ul className="space-y-2">
              {n.strengths.map((s, i) => (
                <li key={i} className="text-sm text-text-secondary leading-relaxed flex gap-2">
                  <span className="text-emerald-400/60 mt-1.5 shrink-0 size-1 rounded-full bg-current" />
                  <span dangerouslySetInnerHTML={{ __html: narrativeInlineHtml(s) }} />
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-accent-warning/80 mb-2 font-display">
              <Eye size={11} strokeWidth={1.5} /> {t("deepDive.watchPoints")}
            </div>
            <ul className="space-y-2">
              {n.vigilance.map((v, i) => (
                <li key={i} className="text-sm text-text-secondary leading-relaxed flex gap-2">
                  <span className="text-accent-warning/60 mt-1.5 shrink-0 size-1 rounded-full bg-current" />
                  <span>{v}</span>
                </li>
              ))}
            </ul>
          </div>
          </div>
        </Card>
      </DeepDiveSection>
  );

  const practicesSection = !hidePractices ? (
      <DeepDiveSection
        icon={Play}
        kicker={t("deepDive.tabPractices")}
        title={t("deepDive.recommendedExercises")}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {n.practices.map((p, i) => {
            const m = p.title.match(/(\d+)\s*min/i);
            const duration = m ? `${m[1]} min` : null;
            const cleanTitle = p.title.replace(/\s*[—-]\s*\d+\s*min/i, "").trim();
            return (
              <Card
                key={i}
                className="neural-card p-5 backdrop-blur-3xl bg-white/[0.03] border border-white/10 flex flex-col"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h4 className="font-display text-sm tracking-wider uppercase text-text-primary leading-tight">
                    {cleanTitle}
                  </h4>
                  {duration && (
                    <Badge variant="outline" className="shrink-0 border-white/10 text-text-tertiary text-[10px]">
                      <Clock size={10} strokeWidth={1.5} className="mr-1" />
                      {duration}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-text-secondary leading-relaxed flex-1">{p.description}</p>
              </Card>
            );
          })}
        </div>
      </DeepDiveSection>
  ) : null;

  const sectionById: Record<string, ReactNode> = {
    v4: v4Section,
    overview: overviewSection,
    archetypes: archetypesSection,
    survival: survivalSection,
    narrative: narrativeSection,
    practices: practicesSection,
  };

  if (layout === "stack") {
    return (
      <div className="deep-dive-stagger space-y-8">
        {tabDefs.map((tab) => {
          const section = sectionById[tab.id];
          if (!section) return null;
          return (
            <div key={tab.id}>
              <div className="mb-3 flex items-center gap-2">
                <span className="font-display text-[10px] uppercase tracking-[0.28em] text-[hsl(var(--aegis-warm)/0.85)] tabular-nums">
                  {tab.step}
                </span>
                <span className="text-xs uppercase tracking-[0.2em] text-text-tertiary font-display">{tab.label}</span>
              </div>
              {section}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <Tabs defaultValue={tabDefs[0]?.id ?? "overview"} className="deep-dive-stagger space-y-6">
      <TabsList className={DEEP_DIVE_TAB_LIST} data-export-hide>
        {tabDefs.map((tab) => (
          <TabsTrigger key={tab.id} value={tab.id} className={DEEP_DIVE_TAB_TRIGGER}>
            <span className="shrink-0 font-display text-[10px] uppercase tracking-[0.28em] text-[hsl(var(--aegis-warm)/0.85)] tabular-nums">
              {tab.step}
            </span>
            <span className="truncate">{tab.label}</span>
          </TabsTrigger>
        ))}
      </TabsList>

      {tabDefs.map((tab) => {
        const section = sectionById[tab.id];
        if (!section) return null;
        return (
          <TabsContent key={tab.id} value={tab.id} className="mt-0 focus-visible:outline-none">
            {section}
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
