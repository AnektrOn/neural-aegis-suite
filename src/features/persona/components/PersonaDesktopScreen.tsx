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

export function PersonaDesktopScreen({ profile, displayName, tracking }: PersonaViewProps) {
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
    <div className="persona-desktop-page mx-auto w-full max-w-6xl px-6 py-8 pb-10">
      <header className="persona-desktop-hero mb-8 rounded-2xl border border-border/30 overflow-hidden">
        <div
          className="px-8 py-8 flex items-center gap-8"
          style={{
            background: `linear-gradient(135deg, color-mix(in srgb, ${dominantTheme.color} 14%, hsl(var(--card))) 0%, hsl(var(--background)) 55%)`,
          }}
        >
          <div
            className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full border-2"
            style={{
              borderColor: `color-mix(in srgb, ${dominantTheme.color} 50%, transparent)`,
              background: `color-mix(in srgb, ${dominantTheme.color} 10%, hsl(var(--card)))`,
              boxShadow: `0 0 56px color-mix(in srgb, ${dominantTheme.color} 20%, transparent)`,
            }}
          >
            <DominantIcon size={48} strokeWidth={1.25} style={{ color: dominantTheme.color }} aria-hidden />
          </div>

          <div className="min-w-0 flex-1">
            <p className="font-display text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-3">
              {t("persona.glimpse.eyebrow")}
            </p>
            {shownName ? (
              <p className="font-body text-sm font-medium uppercase tracking-[0.12em] text-muted-foreground">
                {shownName}
              </p>
            ) : null}
            <h1
              className={cn(
                "font-cormorant-display text-4xl xl:text-5xl text-foreground leading-tight tracking-tight",
                shownName ? "mt-1" : "mt-0",
              )}
            >
              {classTitle}
            </h1>
            {profile.subtitle ? (
              <p className="mt-2 text-sm text-muted-foreground font-body">{profile.subtitle}</p>
            ) : null}
            <p className="mt-3 text-base text-muted-foreground leading-relaxed max-w-2xl font-body italic">
              {bioLine}
            </p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_340px] gap-8 items-start">
        <div className="space-y-6 min-w-0">
          <PersonaTriadStrip profile={profile} headingId="persona-triad-heading-desktop" />

          <div className={cn("grid gap-6", spotlightPractice ? "xl:grid-cols-2" : "grid-cols-1")}>
            <PersonaAboutCard
              glimpseLine={glimpseLine}
              shadowTheme={n.primaryShadowTheme}
              headingId="persona-about-heading-desktop"
            />
            {spotlightPractice && practiceTitle ? (
              <PersonaNowCard
                practiceTitle={practiceTitle}
                description={spotlightPractice.description}
                headingId="persona-now-heading-desktop"
              />
            ) : null}
          </div>

          <DeepDiveBridge horizontal />
          <TrackingProgressBridge horizontal />

          <p className="text-[11px] text-muted-foreground/80 font-body leading-relaxed">
            {t("persona.glimpse.footerNote")}
          </p>
        </div>

        <aside className="space-y-5 sticky top-6">
          {tracking ? <PersonaTrackingStrip stats={tracking} /> : null}
          <AegisHealthSection variant="compact" />
          <PersonaStatsSection profile={profile} />

          <section className="space-y-2" aria-labelledby="persona-links-heading-desktop">
            <p
              id="persona-links-heading-desktop"
              className="px-1 font-display text-[10px] uppercase tracking-[0.22em] text-muted-foreground"
            >
              {t("persona.glimpse.links")}
            </p>
            <PersonaLinkRow
              to="/profile"
              icon={<User size={16} strokeWidth={1.5} aria-hidden />}
              title={t("persona.glimpse.accountLink")}
              detail={t("persona.glimpse.accountDetail")}
              compact
            />
            <PersonaLinkRow
              to="/settings"
              icon={<Settings2 size={16} strokeWidth={1.5} aria-hidden />}
              title={t("persona.glimpse.appSettingsLink")}
              detail={t("persona.glimpse.appSettingsDetail")}
              compact
            />
            <PersonaLinkRow
              to="/"
              icon={<LayoutDashboard size={16} strokeWidth={1.5} aria-hidden />}
              title={t("persona.glimpse.dashboardLink")}
              detail={t("persona.glimpse.dashboardDetail")}
              compact
            />
          </section>
        </aside>
      </div>
    </div>
  );
}
