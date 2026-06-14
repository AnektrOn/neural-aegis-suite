import { LayoutDashboard, Settings2, User } from "lucide-react";
import AegisHealthSection from "@/components/AegisHealthSection";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";
import { PersonaStatsSection } from "./PersonaStatsSection";
import { PersonaTrackingStrip } from "./PersonaTrackingStrip";
import {
  DeepDiveBridge,
  TrackingProgressBridge,
  PersonaAboutCard,
  PersonaLinkRow,
  PersonaNowCard,
  PersonaTriadStrip,
  getPersonaContent,
  type PersonaViewProps,
} from "./personaParts";

/** Mobile-only Persona hub — centered profile cover, single column. */
export function PersonaProfileScreen({ profile, displayName, tracking }: PersonaViewProps) {
  const { t } = useLanguage();
  const {
    n,
    shownName,
    classTitle,
    dominantTheme,
    DominantIcon,
    spotlightPractice,
    practiceTitle,
    bioLine,
    glimpseLine,
  } = getPersonaContent(profile, displayName);

  return (
    <div className="persona-user-page mx-auto w-full max-w-lg pb-24">
      <header className="persona-user-cover relative px-5 pt-6 pb-14 text-center">
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
          <p className="font-body text-sm font-medium uppercase tracking-[0.12em] text-muted-foreground">
            {shownName}
          </p>
        ) : null}

        <h1
          className={cn(
            "font-cormorant-display text-3xl text-foreground leading-tight tracking-tight",
            shownName ? "mt-1" : "mt-0",
          )}
        >
          {classTitle}
        </h1>

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
        <PersonaTriadStrip profile={profile} headingId="persona-triad-heading-mobile" />
        <PersonaStatsSection profile={profile} />
        <PersonaAboutCard
          glimpseLine={glimpseLine}
          shadowTheme={n.primaryShadowTheme}
          headingId="persona-about-heading-mobile"
        />
        {spotlightPractice && practiceTitle ? (
          <PersonaNowCard
            practiceTitle={practiceTitle}
            description={spotlightPractice.description}
            headingId="persona-now-heading-mobile"
          />
        ) : null}

        <section className="space-y-2" aria-labelledby="persona-links-heading-mobile">
          <p
            id="persona-links-heading-mobile"
            className="px-1 font-display text-[10px] uppercase tracking-[0.22em] text-muted-foreground"
          >
            {t("persona.glimpse.links")}
          </p>
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

        <DeepDiveBridge />
        <TrackingProgressBridge />

        <p className="text-center text-[11px] text-muted-foreground/80 font-body px-4 leading-relaxed pb-2">
          {t("persona.glimpse.footerNote")}
        </p>
      </div>
    </div>
  );
}
