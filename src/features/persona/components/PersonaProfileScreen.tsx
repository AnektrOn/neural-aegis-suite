import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  ChevronRight,
  LayoutDashboard,
  Settings2,
  Sparkles,
  User,
} from "lucide-react";
import AegisHealthSection from "@/components/AegisHealthSection";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SampleProfile } from "@/features/archetype-deepdive-v2/domain/sampleProfile";
import type { AnyArchetypeKey } from "@/features/archetype-deepdive-v2/domain/types";
import { archetypeMeta } from "@/features/archetype-assessment/services/assessmentService";
import type { ArchetypeKey } from "@/features/archetype-assessment/domain/types";
import { useLanguage } from "@/i18n/LanguageContext";
import { parseProfileLabel } from "../lib/parseProfileLabel";
import { themeFor } from "../lib/archetypeTheme";
import { PersonaStatsSection } from "./PersonaStatsSection";
import { PersonaTrackingStrip } from "./PersonaTrackingStrip";
import type { PersonaTrackingStats } from "../services/personaTrackingStats";

function archName(key: AnyArchetypeKey, locale: "fr" | "en"): string {
  const meta = archetypeMeta(key as ArchetypeKey);
  if (!meta) return key;
  const raw = locale === "fr" ? meta.name_fr : meta.name_en;
  return raw.replace(/^The |^Le |^L'|^La /i, "").trim();
}

interface PersonaProfileScreenProps {
  profile: SampleProfile;
  displayName?: string;
  tracking: PersonaTrackingStats | null;
}

function PersonaLinkRow({
  to,
  icon,
  title,
  detail,
}: {
  to: string;
  icon: React.ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-3 rounded-xl border border-border/40 bg-card/50 px-4 py-3.5 min-h-[52px]",
        "transition-colors hover:border-primary/35 hover:bg-card/70",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
      )}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground leading-snug line-clamp-1">{detail}</p>
      </div>
      <ChevronRight size={16} className="shrink-0 text-muted-foreground" aria-hidden />
    </Link>
  );
}

export function PersonaProfileScreen({ profile, displayName, tracking }: PersonaProfileScreenProps) {
  const { locale, t } = useLanguage();
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
    ? n.strengths[0].replace(/\*\*(.+?)\*\*/g, "$1").slice(0, 140)
    : n.closingNarrativeUser.slice(0, 140);

  return (
    <div className="persona-user-page mx-auto max-w-lg pb-24">
      {/* Cover + avatar — profile, not report hero */}
      <header className="persona-user-cover relative px-5 pt-6 pb-16 text-center">
        <p className="font-display text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-6 text-left">
          {t("persona.glimpse.eyebrow")}
        </p>

        <div
          className="persona-user-avatar mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full border-2"
          style={{
            borderColor: `color-mix(in srgb, ${dominantTheme.color} 45%, transparent)`,
            background: `color-mix(in srgb, ${dominantTheme.color} 12%, hsl(var(--card)))`,
            boxShadow: `0 0 48px color-mix(in srgb, ${dominantTheme.color} 18%, transparent)`,
          }}
        >
          <DominantIcon size={40} strokeWidth={1.25} style={{ color: dominantTheme.color }} aria-hidden />
        </div>

        {shownName ? (
          <h1 className="font-body text-xl font-medium text-foreground">{shownName}</h1>
        ) : null}

        <p
          className={cn(
            "font-cormorant-display text-3xl sm:text-4xl text-foreground leading-tight tracking-tight",
            shownName ? "mt-1" : "mt-0",
          )}
        >
          {classTitle}
        </p>

        {profile.subtitle ? (
          <p className="mt-2 text-xs text-muted-foreground font-body">{profile.subtitle}</p>
        ) : null}

        <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto font-body italic">
          {bioLine}
        </p>
      </header>

      <div className="relative z-10 -mt-8 space-y-5 px-4">
        {tracking ? <PersonaTrackingStrip stats={tracking} /> : null}

        <AegisHealthSection variant="compact" />

        {/* Triad identity strip */}
        <section className="glass-card rounded-2xl p-4">
          <p className="mb-3 font-display text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            {t("persona.glimpse.triad")}
          </p>
          <div className="flex gap-2">
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
                  <span className="font-display text-[9px] uppercase tracking-wider text-center text-foreground/90 leading-tight">
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

        <PersonaStatsSection profile={profile} />

        {/* About — one human glimpse */}
        <section className="glass-card rounded-2xl p-4 space-y-2">
          <h2 className="font-display text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            {t("persona.glimpse.about")}
          </h2>
          <p className="text-sm text-foreground/90 leading-relaxed font-body">{glimpseLine}</p>
          <p className="text-xs text-muted-foreground">
            {t("persona.glimpse.shadowHint", { theme: n.primaryShadowTheme })}
          </p>
        </section>

        {/* Now — single practice spotlight */}
        {spotlightPractice ? (
          <section className="glass-card rounded-2xl p-4 space-y-2">
            <h2 className="font-display text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              {t("persona.glimpse.now")}
            </h2>
            <p className="font-display text-sm uppercase tracking-wide text-foreground">{practiceTitle}</p>
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
              {spotlightPractice.description}
            </p>
          </section>
        ) : null}

        {/* Quick links — personal hub */}
        <section className="space-y-2">
          <p className="px-1 font-display text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            {t("persona.glimpse.links")}
          </p>
          <PersonaLinkRow
            to="/deep-dive"
            icon={<Sparkles size={18} strokeWidth={1.5} aria-hidden />}
            title={t("persona.glimpse.deepDiveLink")}
            detail={t("persona.glimpse.deepDiveDetail")}
          />
          <PersonaLinkRow
            to="/profile"
            icon={<User size={18} strokeWidth={1.5} aria-hidden />}
            title={t("persona.glimpse.accountLink")}
            detail={t("persona.glimpse.accountDetail")}
          />
          <PersonaLinkRow
            to="/settings"
            icon={<Settings2 size={18} strokeWidth={1.5} aria-hidden />}
            title={t("persona.glimpse.appSettingsLink")}
            detail={t("persona.glimpse.appSettingsDetail")}
          />
          <PersonaLinkRow
            to="/"
            icon={<LayoutDashboard size={18} strokeWidth={1.5} aria-hidden />}
            title={t("persona.glimpse.dashboardLink")}
            detail={t("persona.glimpse.dashboardDetail")}
          />
        </section>

        {/* Primary CTA — full analysis lives elsewhere */}
        <Button asChild size="lg" className="w-full min-h-[48px] font-display text-xs tracking-wider">
          <Link to="/deep-dive">
            {t("persona.glimpse.ctaDeepDive")}
            <ArrowUpRight className="ml-2 h-4 w-4" aria-hidden />
          </Link>
        </Button>

        <p className="text-center text-[11px] text-muted-foreground/80 font-body px-4 leading-relaxed">
          {t("persona.glimpse.footerNote")}
        </p>
      </div>
    </div>
  );
}
