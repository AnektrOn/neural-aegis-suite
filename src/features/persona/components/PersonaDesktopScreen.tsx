import { Settings2, User, Layers } from "lucide-react";
import AegisHealthSection from "@/components/AegisHealthSection";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { PersonaStatsSection } from "./PersonaStatsSection";
import { PersonaLinkRow, getPersonaContent, type PersonaViewProps } from "./personaParts";
import { Houses72PersonaCTA } from "@/features/houses72/components/Houses72PersonaCTA";
import { UserReportsSection } from "@/features/user-reports/UserReportsSection";
import { MemberPageScaffold } from "@/layouts/MemberPageScaffold";

/** Desktop Persona — single-column reports portal (not the split dashboard layout). */
export function PersonaDesktopScreen({ profile, displayName }: PersonaViewProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const {
    shownName,
    classTitle,
    dominantTheme,
    DominantIcon,
    bioLine,
  } = getPersonaContent(profile, displayName);

  return (
    <MemberPageScaffold width="narrow" viewport className="min-w-0 pb-10">
      <p className="font-cinzel text-[10px] font-semibold uppercase tracking-[0.28em] text-primary/80 mb-6 member-top-dock-clearance">
        {t("persona.glimpse.eyebrow")}
      </p>

      <header className="persona-user-cover relative pb-10 text-center">
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
            "font-cormorant-display text-3xl xl:text-4xl text-foreground leading-tight tracking-tight",
            shownName ? "mt-1" : "mt-0",
          )}
        >
          {classTitle}
        </h1>

        {profile.subtitle ? (
          <p className="mt-2 text-xs text-muted-foreground font-body">{profile.subtitle}</p>
        ) : null}

        <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-md mx-auto font-body italic">
          {bioLine}
        </p>
      </header>

      <div className="space-y-5">
        <AegisHealthSection variant="compact" />

        <PersonaLinkRow
          to="/persona/portraits"
          icon={<Layers size={18} strokeWidth={1.5} aria-hidden />}
          title={t("persona.glimpse.portraitsLink")}
          detail={t("persona.glimpse.portraitsDetail")}
        />

        <Houses72PersonaCTA userId={user?.id} />

        <PersonaStatsSection profile={profile} />

        {user?.id ? <UserReportsSection userId={user.id} /> : null}

        <section className="space-y-2" aria-labelledby="persona-links-heading-desktop">
          <p
            id="persona-links-heading-desktop"
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
        </section>
      </div>
    </MemberPageScaffold>
  );
}