import { Link } from "react-router-dom";
import { ArrowUpRight, ChevronRight, TrendingUp } from "lucide-react";
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
        "group flex items-center gap-3 rounded-xl aegis-dock-tile transition-all",
        "hover:border-[#c9a24b]/40",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        compact ? "px-3 py-2.5 min-h-[44px]" : "px-4 py-3.5 min-h-[52px]",
      )}
    >
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-lg bg-[#c9a24b]/10 text-[#c9a24b] border border-[#c9a24b]/20 group-hover:bg-[#c9a24b]/20 transition-colors",
          compact ? "h-8 w-8" : "h-10 w-10",
        )}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn("font-cinzel text-xs font-semibold text-foreground group-hover:text-[#c9a24b] transition-colors uppercase tracking-[0.14em]", compact ? "text-[11px]" : "text-xs")}>{title}</p>
        {!compact ? (
          <p className="text-xs text-muted-foreground leading-snug line-clamp-1 font-sans">{detail}</p>
        ) : null}
      </div>
      <ChevronRight size={compact ? 14 : 16} className="shrink-0 text-muted-foreground group-hover:text-[#c9a24b] group-hover:translate-x-0.5 transition-all" aria-hidden />
    </Link>
  );
}

/** Link card to the Tracking Progress / evolution report. */
export function TrackingProgressBridge({ horizontal }: { horizontal?: boolean }) {
  const { locale, t } = useLanguage();
  const l = locale as "fr" | "en";

  return (
    <div
      className={cn(
        "rounded-2xl border border-purple-500/20 bg-purple-500/[0.04] p-4 space-y-3",
        horizontal && "sm:flex sm:items-center sm:justify-between sm:gap-6 sm:space-y-0 sm:p-5",
      )}
    >
      <div className="flex items-start gap-3 min-w-0">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-500/15 text-purple-400">
          <TrendingUp size={18} strokeWidth={1.5} aria-hidden />
        </div>
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium text-foreground">
            {l === "fr" ? "Évolution Archétypale" : "Archetypal Evolution"}
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {l === "fr"
              ? "Suivez votre progression sur la Perspective Myss grâce à votre check-in quotidien."
              : "Track your progress on the Myss Perspective through your daily check-in."}
          </p>
        </div>
      </div>
      <div className={cn("flex flex-col gap-2", horizontal ? "w-full sm:w-auto sm:shrink-0" : "w-full")}>
        <Button
          asChild
          size="lg"
          variant="outline"
          className="min-h-[48px] font-display text-xs tracking-wider border-primary/30 hover:bg-primary/10 w-full"
        >
          <Link to="/?checkin=1">
            {t("persona.checkinCta")}
          </Link>
        </Button>
      </div>
    </div>
  );
}

export function PersonaTriadStrip({
  profile,
  headingId,
  embedded,
}: {
  profile: SampleProfile;
  headingId: string;
  embedded?: boolean;
}) {
  const { locale, t } = useLanguage();
  const triad = profile.narrative.archetypeBlocks;

  return (
    <section
      className={cn(!embedded && "aegis-dock-tile rounded-2xl p-4 sm:p-5 shadow-[0_8px_32px_rgba(0,0,0,0.3)]")}
      aria-labelledby={headingId}
    >
      <p
        id={headingId}
        className="mb-3 font-cinzel text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9e7828] dark:text-[#c9a24b]"
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
              className="flex flex-1 flex-col items-center gap-1 rounded-xl border border-white/10 bg-black/25 px-2 py-3 min-h-[80px] justify-center"
            >
              <Icon size={18} strokeWidth={1.25} style={{ color: th.color }} aria-hidden />
              <span className="font-cinzel text-[9px] font-semibold uppercase tracking-wider text-center text-foreground/90 leading-tight sm:text-[10px]">
                {archName(b.archetype, locale)}
              </span>
              {pct !== null ? (
                <span className="font-cormorant text-base font-light tabular-nums text-[#c9a24b]">{pct}%</span>
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
    <section className="aegis-dock-tile rounded-2xl p-4 sm:p-5 space-y-2 h-full shadow-[0_8px_32px_rgba(0,0,0,0.3)]" aria-labelledby={headingId}>
      <h2
        id={headingId}
        className="font-cinzel text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9e7828] dark:text-[#c9a24b]"
      >
        {t("persona.glimpse.about")}
      </h2>
      <p className="text-sm text-foreground/90 leading-relaxed font-sans">{glimpseLine}</p>
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
    <section className="aegis-dock-tile rounded-2xl p-4 sm:p-5 space-y-2 h-full shadow-[0_8px_32px_rgba(0,0,0,0.3)]" aria-labelledby={headingId}>
      <h2
        id={headingId}
        className="font-cinzel text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9e7828] dark:text-[#c9a24b]"
      >
        {t("persona.glimpse.now")}
      </h2>
      <p className="font-cormorant text-lg text-foreground font-light">{practiceTitle}</p>
      <p className="text-xs text-muted-foreground leading-relaxed sm:text-sm font-sans">{description}</p>
    </section>
  );
}
