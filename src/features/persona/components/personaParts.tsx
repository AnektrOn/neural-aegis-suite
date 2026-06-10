import { Link } from "react-router-dom";
import { ArrowUpRight, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SampleProfile } from "@/features/archetype-deepdive-v2/domain/sampleProfile";
import type { AnyArchetypeKey } from "@/features/archetype-deepdive-v2/domain/types";
import { archetypeMeta } from "@/features/archetype-assessment/services/assessmentService";
import type { ArchetypeKey } from "@/features/archetype-assessment/domain/types";
import { useLanguage } from "@/i18n/LanguageContext";
import { parseProfileLabel } from "../lib/parseProfileLabel";
import { themeFor } from "../lib/archetypeTheme";
import type { PersonaTrackingStats } from "../services/personaTrackingStats";

export interface PersonaViewProps {
  profile: SampleProfile;
  displayName?: string;
  tracking: PersonaTrackingStats | null;
}

export function archName(key: AnyArchetypeKey, locale: "fr" | "en"): string {
  const meta = archetypeMeta(key as ArchetypeKey);
  if (!meta) return key;
  const raw = locale === "fr" ? meta.name_fr : meta.name_en;
  return raw.replace(/^The |^Le |^L'|^La /i, "").trim();
}

export function getPersonaContent(profile: SampleProfile, displayName?: string) {
  const n = profile.narrative;
  const triad = n.archetypeBlocks;
  const dominant = triad[0];
  const { name: labelName, classTitle } = parseProfileLabel(profile.label);
  const shownName = displayName?.trim() || labelName || null;
  const dominantTheme = themeFor(dominant.archetype);
  const DominantIcon = dominantTheme.icon;
  const spotlightPractice = n.practices[0];
  const practiceTitle = spotlightPractice
    ? spotlightPractice.title.replace(/\s*[—-]\s*\d+\s*min/i, "").trim()
    : null;
  const bioLine = dominant?.tagline ?? n.overviewLead;
  const glimpseLine = n.strengths[0]
    ? n.strengths[0].replace(/\*\*(.+?)\*\*/g, "$1").slice(0, 160)
    : n.closingNarrativeUser.slice(0, 160);

  return {
    n,
    triad,
    dominant,
    shownName,
    classTitle,
    dominantTheme,
    DominantIcon,
    spotlightPractice,
    practiceTitle,
    bioLine,
    glimpseLine,
  };
}

export function PersonaLinkRow({
  to,
  icon,
  title,
  detail,
  compact,
}: {
  to: string;
  icon: React.ReactNode;
  title: string;
  detail: string;
  compact?: boolean;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-3 rounded-xl border border-border/40 bg-card/50 transition-colors",
        "hover:border-primary/35 hover:bg-card/70",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        compact ? "px-3 py-2.5 min-h-[44px]" : "px-4 py-3.5 min-h-[52px]",
      )}
    >
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary",
          compact ? "h-8 w-8" : "h-10 w-10",
        )}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn("font-medium text-foreground", compact ? "text-xs" : "text-sm")}>{title}</p>
        {!compact ? (
          <p className="text-xs text-muted-foreground leading-snug line-clamp-1">{detail}</p>
        ) : null}
      </div>
      <ChevronRight size={compact ? 14 : 16} className="shrink-0 text-muted-foreground" aria-hidden />
    </Link>
  );
}

export function DeepDiveBridge({ horizontal }: { horizontal?: boolean }) {
  const { t } = useLanguage();

  return (
    <div
      className={cn(
        "rounded-2xl border border-primary/25 bg-primary/5 p-4 space-y-3",
        horizontal && "sm:flex sm:items-center sm:justify-between sm:gap-6 sm:space-y-0 sm:p-5",
      )}
    >
      <div className="flex items-start gap-3 min-w-0">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Sparkles size={18} strokeWidth={1.5} aria-hidden />
        </div>
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium text-foreground">{t("persona.glimpse.deepDiveLink")}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{t("persona.glimpse.deepDiveDetail")}</p>
        </div>
      </div>
      <Button
        asChild
        size="lg"
        className={cn(
          "min-h-[48px] font-display text-xs tracking-wider",
          horizontal ? "w-full sm:w-auto sm:shrink-0" : "w-full",
        )}
      >
        <Link to="/deep-dive">
          {t("persona.glimpse.ctaDeepDive")}
          <ArrowUpRight className="ml-2 h-4 w-4" aria-hidden />
        </Link>
      </Button>
    </div>
  );
}

export function PersonaTriadStrip({ profile, headingId }: { profile: SampleProfile; headingId: string }) {
  const { locale, t } = useLanguage();
  const triad = profile.narrative.archetypeBlocks;

  return (
    <section className="glass-card rounded-2xl p-4 sm:p-5" aria-labelledby={headingId}>
      <p
        id={headingId}
        className="mb-3 font-display text-[10px] uppercase tracking-[0.22em] text-muted-foreground"
      >
        {t("persona.glimpse.triad")}
      </p>
      <div className="flex gap-2 sm:gap-3">
        {triad.map((b) => {
          const th = themeFor(b.archetype);
          const Icon = th.icon;
          const major = profile.majors.find((m) => m.archetype === b.archetype);
          const pct = major ? Math.round(major.intensity * 100) : null;
          return (
            <div
              key={b.archetype}
              className="flex flex-1 flex-col items-center gap-1 rounded-xl border border-border/30 bg-background/40 px-2 py-3 min-h-[80px] justify-center"
            >
              <Icon size={18} strokeWidth={1.25} style={{ color: th.color }} aria-hidden />
              <span className="font-display text-[9px] uppercase tracking-wider text-center text-foreground/90 leading-tight sm:text-[10px]">
                {archName(b.archetype, locale)}
              </span>
              {pct !== null ? (
                <span className="font-display text-sm tabular-nums text-foreground/80">{pct}%</span>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function PersonaAboutCard({
  glimpseLine,
  shadowTheme,
  headingId,
}: {
  glimpseLine: string;
  shadowTheme: string;
  headingId: string;
}) {
  const { t } = useLanguage();

  return (
    <section className="glass-card rounded-2xl p-4 sm:p-5 space-y-2 h-full" aria-labelledby={headingId}>
      <h2
        id={headingId}
        className="font-display text-[10px] uppercase tracking-[0.22em] text-muted-foreground"
      >
        {t("persona.glimpse.about")}
      </h2>
      <p className="text-sm text-foreground/90 leading-relaxed font-body">{glimpseLine}</p>
      <p className="text-xs text-muted-foreground">{t("persona.glimpse.shadowHint", { theme: shadowTheme })}</p>
    </section>
  );
}

export function PersonaNowCard({
  practiceTitle,
  description,
  headingId,
}: {
  practiceTitle: string;
  description: string;
  headingId: string;
}) {
  const { t } = useLanguage();

  return (
    <section className="glass-card rounded-2xl p-4 sm:p-5 space-y-2 h-full" aria-labelledby={headingId}>
      <h2
        id={headingId}
        className="font-display text-[10px] uppercase tracking-[0.22em] text-muted-foreground"
      >
        {t("persona.glimpse.now")}
      </h2>
      <p className="font-display text-sm uppercase tracking-wide text-foreground">{practiceTitle}</p>
      <p className="text-xs text-muted-foreground leading-relaxed sm:text-sm">{description}</p>
    </section>
  );
}
