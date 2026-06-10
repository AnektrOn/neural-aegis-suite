import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageWrapper } from "@/components/PageWrapper";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePersonaProfile } from "@/features/persona/hooks/usePersonaProfile";
import { PersonaProfileScreen } from "@/features/persona/components/PersonaProfileScreen";
import { PersonaDesktopScreen } from "@/features/persona/components/PersonaDesktopScreen";
import {
  fetchPersonaTrackingStats,
  type PersonaTrackingStats,
} from "@/features/persona/services/personaTrackingStats";
import { supabase } from "@/integrations/supabase/client";

export default function Persona() {
  const { user, loading: authLoading } = useAuth();
  const { locale, t } = useLanguage();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isFR = locale === "fr";

  const [displayName, setDisplayName] = useState<string | undefined>();
  const [tracking, setTracking] = useState<PersonaTrackingStats | null>(null);

  const userId = user?.id;
  const { profile, loading: profileLoading, error, reload } = usePersonaProfile(userId, locale);

  const metaDisplayName = useMemo(() => {
    if (!user) return undefined;
    const meta = user.user_metadata as Record<string, unknown> | undefined;
    const full = meta?.["full_name"];
    if (typeof full === "string" && full.trim()) return full.trim();
    const first = meta?.["first_name"];
    if (typeof first === "string" && first.trim()) return first.trim();
    return undefined;
  }, [user]);

  useEffect(() => {
    if (!userId) return;
    let alive = true;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", userId)
        .maybeSingle();
      if (!alive) return;
      const fromDb = data?.display_name?.trim();
      setDisplayName(fromDb || metaDisplayName);
    })();
    return () => {
      alive = false;
    };
  }, [userId, metaDisplayName]);

  useEffect(() => {
    if (!userId) return;
    let alive = true;
    void fetchPersonaTrackingStats(userId, locale).then((s) => {
      if (alive) setTracking(s);
    });
    return () => {
      alive = false;
    };
  }, [userId, locale]);

  const waitingForAuth = authLoading && !userId;
  const showLoading = waitingForAuth || (!!userId && profileLoading);

  if (showLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-aegis-gradient">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" strokeWidth={1.5} aria-hidden />
          <p className="text-sm text-muted-foreground font-display text-[10px] uppercase tracking-[0.2em]">
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
    );
  }

  if (error) {
    return (
      <PageWrapper>
        <div className="flex min-h-[40vh] items-center justify-center px-4">
          <div className="glass-card max-w-md p-8 text-center space-y-4">
            <p className="text-sm text-destructive">{error}</p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button onClick={() => void reload()} variant="default" className="min-h-[44px]">
                {isFR ? "Réessayer" : "Retry"}
              </Button>
              <Button onClick={() => navigate("/deep-dive")} variant="outline" className="min-h-[44px]">
                {isFR ? "Ouvrir le Deep Dive" : "Open Deep Dive"}
              </Button>
            </div>
          </div>
        </div>
      </PageWrapper>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-full -mx-6 -mt-6 px-5 pt-6 pb-10 sm:px-8 md:-mx-10 md:-mt-10 md:px-10 md:pt-10 bg-aegis-gradient">
        <div className="mx-auto max-w-2xl flex min-h-[60vh] items-center justify-center py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="glass-card w-full p-8 sm:p-10 text-center space-y-8 backdrop-blur-3xl bg-card/40 border-border/40"
          >
            <div className="inline-flex items-center gap-2 text-primary text-xs uppercase tracking-[0.2em] font-display">
              <Sparkles className="w-4 h-4" strokeWidth={1.5} aria-hidden />
              {t("persona.noProfile.eyebrow")}
            </div>
            <div className="space-y-4">
              <h1 className="font-serif text-3xl sm:text-4xl text-foreground leading-tight">
                {t("persona.noProfile.title")}
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed font-body">
                {t("persona.noProfile.body")}
              </p>
            </div>
            <div className="rounded-xl border border-border/30 bg-background/30 p-6 space-y-3 text-left">
              <h3 className="font-serif text-lg text-foreground">{t("persona.noProfile.whatIsIt")}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{t("persona.noProfile.explanation")}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" onClick={() => navigate("/onboarding/assessment")} className="min-h-[44px] font-display text-sm tracking-wider">
                {t("persona.noProfile.ctaAssessment")}
                <ArrowRight className="ml-2 w-4 h-4" aria-hidden />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/")} className="min-h-[44px] font-display text-sm tracking-wider">
                {t("persona.noProfile.ctaDashboard")}
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  const screenProps = { profile, displayName, tracking };

  return (
    <div className="min-h-full -mx-6 -mt-6 md:-mx-10 md:-mt-10 bg-aegis-gradient">
      {isMobile ? (
        <PersonaProfileScreen {...screenProps} />
      ) : (
        <PersonaDesktopScreen {...screenProps} />
      )}
    </div>
  );
}
