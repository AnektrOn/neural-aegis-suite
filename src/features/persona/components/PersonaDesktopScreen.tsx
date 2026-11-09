import { LayoutDashboard, Layers, Settings2, User } from "lucide-react";
import AegisHealthSection from "@/components/AegisHealthSection";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { PersonaStatsSection } from "./PersonaStatsSection";
import { PersonaTrackingStrip } from "./PersonaTrackingStrip";
import {
  PersonaLinkRow,
  PersonaNowCard,
  getPersonaContent,
  type PersonaViewProps,
} from "./personaParts";
import { Houses72PersonaCTA } from "@/features/houses72/components/Houses72PersonaCTA";
import { UserReportsSection } from "@/features/user-reports/UserReportsSection";
import { MemberPageScaffold } from "@/layouts/MemberPageScaffold";
import { MemberSplitLayout } from "@/layouts/MemberSplitLayout";

export function PersonaDesktopScreen({
  profile,
  displayName,
  tracking,
}: PersonaViewProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const {
    n,
    shownName,
    classTitle,
    dominantTheme,
    DominantIcon,
    spotlightPractice,
    practiceTitle,
    bioLine,
  } = getPersonaContent(profile, displayName);

  const leftPane = (
    <div className="space-y-5">
      {/* Hero Master Identity Card */}
      <div
        className="aegis-dock-tile rounded-2xl p-6 relative overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.35)]"
        style={{
          background: `linear-gradient(135deg, color-mix(in srgb, ${dominantTheme.color} 14%, hsl(var(--background) / 0.72)) 0%, hsl(var(--background) / 0.88) 100%)`,
        }}
      >
        <div className="flex items-start gap-4">
          <div
            className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-2"
            style={{
              borderColor: `color-mix(in srgb, ${dominantTheme.color} 50%, transparent)`,
              background: `color-mix(in srgb, ${dominantTheme.color} 10%, hsl(var(--card)))`,
              boxShadow: `0 0 40px color-mix(in srgb, ${dominantTheme.color} 25%, transparent)`,
            }}
          >
            <DominantIcon size={38} strokeWidth={1.25} style={{ color: dominantTheme.color }} aria-hidden />
          </div>

          <div className="min-w-0 flex-1">
            <p className="font-cinzel text-[9.5px] font-semibold uppercase tracking-[0.24em] text-primary/80">
              {t("persona.glimpse.eyebrow")}
            </p>
            {shownName ? (
              <p className="font-body text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground mt-0.5">
                {shownName}
              </p>
            ) : null}
            <h1 className="font-cormorant text-2xl xl:text-3xl text-foreground font-light leading-tight tracking-tight mt-1">
              {classTitle}
            </h1>
            {profile.subtitle ? (
              <p className="mt-1 text-xs text-muted-foreground font-body">{profile.subtitle}</p>
            ) : null}
          </div>
        </div>

        {bioLine ? (
          <p className="mt-4 pt-3 border-t border-border/20 text-xs text-muted-foreground leading-relaxed font-body italic">
            "{bioLine}"
          </p>
        ) : null}
      </div>

      {/* Real-Time Alignment & Biometrics */}
      <div className="space-y-4">
        {tracking ? <PersonaTrackingStrip stats={tracking} /> : null}
        <AegisHealthSection variant="compact" />
        <Houses72PersonaCTA userId={user?.id} variant="compact" />

        {/* Quick Navigation Links */}
        <section className="space-y-2 pt-2" aria-labelledby="persona-links-heading-desktop">
          <p
            id="persona-links-heading-desktop"
            className="px-1 font-cinzel text-[9.5px] font-semibold uppercase tracking-[0.22em] text-muted-foreground"
          >
            {t("persona.glimpse.links")}
          </p>
          <div className="grid grid-cols-1 gap-1.5">
            <PersonaLinkRow
              to="/profile"
              icon={<User size={15} strokeWidth={1.5} aria-hidden />}
              title={t("persona.glimpse.accountLink")}
              detail={t("persona.glimpse.accountDetail")}
              compact
            />
            <PersonaLinkRow
              to="/settings"
              icon={<Settings2 size={15} strokeWidth={1.5} aria-hidden />}
              title={t("persona.glimpse.appSettingsLink")}
              detail={t("persona.glimpse.appSettingsDetail")}
              compact
            />
            <PersonaLinkRow
              to="/dashboard"
              icon={<LayoutDashboard size={15} strokeWidth={1.5} aria-hidden />}
              title={t("persona.glimpse.dashboardLink")}
              detail={t("persona.glimpse.dashboardDetail")}
              compact
            />
          </div>
        </section>
      </div>
    </div>
  );

  const rightPane = (
    <div className="space-y-6">
      <PersonaLinkRow
        to="/persona/portraits"
        icon={<Layers size={18} strokeWidth={1.5} aria-hidden />}
        title={t("persona.glimpse.portraitsLink")}
        detail={t("persona.glimpse.portraitsDetail")}
      />

      {/* Spotlight Practice if present */}
      {spotlightPractice && practiceTitle ? (
        <PersonaNowCard
          practiceTitle={practiceTitle}
          description={spotlightPractice.description}
          headingId="persona-now-heading-desktop"
        />
      ) : null}

      {/* Deep Analytics & Archetype Distribution */}
      <PersonaStatsSection profile={profile} />

      {/* User Reports & Assessments */}
      {user?.id ? <UserReportsSection userId={user.id} /> : null}

      <p className="text-[11px] text-muted-foreground/80 font-body leading-relaxed pb-4">
        {t("persona.glimpse.footerNote")}
      </p>
    </div>
  );

  return (
    <MemberPageScaffold width="wide" viewport className="min-w-0 overflow-x-hidden">
      <MemberSplitLayout
        left={leftPane}
        right={rightPane}
        leftColSpan={5}
        rightColSpan={7}
        scrollRight={true}
      />
    </MemberPageScaffold>
  );
}
