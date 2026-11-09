import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MemberPageScaffold } from "@/layouts/MemberPageScaffold";
import { MemberPageHeader } from "@/components/ui/MemberPageHeader";
import { useLanguage } from "@/i18n/LanguageContext";
import { PersonaPortraitLibrary } from "@/features/persona/components/PersonaPortraitLibrary";
import { usePersonaPortraitLenses } from "@/features/persona/hooks/usePersonaPortraitLenses";

export default function PersonaPortraits() {
  const { t, locale } = useLanguage();
  const navigate = useNavigate();
  const isFR = locale === "fr";

  const {
    profile,
    portraitLenses,
    taoSummary,
    portraitsLoading,
    error,
    reload,
    showLoading,
    waitingForAuth,
    primaryShadowTheme,
  } = usePersonaPortraitLenses(locale);

  if (showLoading) {
    return (
      <MemberPageScaffold>
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" strokeWidth={1.5} aria-hidden />
            <p className="font-display text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {waitingForAuth
                ? isFR
                  ? "Connexion…"
                  : "Signing in…"
                : isFR
                  ? "Chargement…"
                  : "Loading…"}
            </p>
          </div>
        </div>
      </MemberPageScaffold>
    );
  }

  if (error) {
    return (
      <MemberPageScaffold className="space-y-6">
        <Link
          to="/persona"
          className="inline-flex items-center gap-1.5 font-cinzel text-[10.5px] font-semibold uppercase tracking-[0.2em] text-[#9e7828] dark:text-[#c9a24b] hover:opacity-80"
        >
          <ArrowLeft size={12} aria-hidden />
          {t("persona.portraits.backToPersona")}
        </Link>
        <div className="aegis-dock-tile rounded-2xl p-8 text-center space-y-4">
          <p className="text-sm text-destructive">{error}</p>
          <Button onClick={() => void reload()} className="min-h-[44px]">
            {isFR ? "Réessayer" : "Retry"}
          </Button>
        </div>
      </MemberPageScaffold>
    );
  }

  if (!profile) {
    return (
      <MemberPageScaffold className="space-y-6">
        <Link
          to="/persona"
          className="inline-flex items-center gap-1.5 font-cinzel text-[10.5px] font-semibold uppercase tracking-[0.2em] text-[#9e7828] dark:text-[#c9a24b] hover:opacity-80"
        >
          <ArrowLeft size={12} aria-hidden />
          {t("persona.portraits.backToPersona")}
        </Link>
        <MemberPageHeader
          kicker={t("persona.portraits.sectionLabel")}
          title={t("persona.portraits.pageTitle")}
          subtitle={t("persona.portraits.noProfile")}
        />
        <Button onClick={() => navigate("/onboarding/assessment")} className="min-h-[44px] w-full sm:w-auto">
          {t("persona.noProfile.ctaAssessment")}
        </Button>
      </MemberPageScaffold>
    );
  }

  const publishedCount = portraitLenses.filter((l) => l.status === "ready" || l.status === "partial").length;

  return (
    <MemberPageScaffold width="full" bleed className="space-y-4 pb-10">
      <div className="mx-auto w-full max-w-2xl space-y-4 px-4 sm:px-6 text-center">
        <Link
          to="/persona"
          className="inline-flex items-center gap-1.5 font-cinzel text-[10.5px] font-semibold uppercase tracking-[0.2em] text-[#9e7828] dark:text-[#c9a24b] hover:opacity-80 transition-opacity"
        >
          <ArrowLeft size={12} aria-hidden />
          {t("persona.portraits.backToPersona")}
        </Link>
        <MemberPageHeader
          align="center"
          kicker={t("persona.portraits.sectionLabel")}
          title={t("persona.portraits.pageTitle")}
          subtitle={t("persona.portraits.subtitle")}
          action={
            <span className="rounded-full border border-border/40 bg-background/50 px-2.5 py-1 text-[10px] font-display uppercase tracking-wider text-muted-foreground tabular-nums">
              {publishedCount}/{portraitLenses.length}
            </span>
          }
        />
      </div>

      <PersonaPortraitLibrary
        lenses={portraitLenses}
        loading={portraitsLoading}
        profile={profile}
        taoSummary={taoSummary}
        shadowTheme={primaryShadowTheme}
        headingId="persona-portraits-page-heading"
        fullPage
      />
    </MemberPageScaffold>
  );
}
