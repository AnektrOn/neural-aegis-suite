import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Crown, Sparkles, Loader2, X } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/contexts/AuthContext";
import { isAnonymousUser } from "@/lib/authVisitor";
import { postLoginPath } from "@/lib/welcomeHud";
import { useLanguage } from "@/i18n/LanguageContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { NeuralCard } from "@/components/ui/neural-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import PaymentTestModeBanner from "@/components/PaymentTestModeBanner";
import PublicFooter from "@/components/public/PublicFooter";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ThemeToggle from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";

import { toast } from "sonner";

type Billing = "monthly" | "yearly";

export default function Pricing() {
  const { locale } = useLanguage();
  const { user, isGuest } = useAuth();
  const navigate = useNavigate();
  const { tier, subscription, refetch } = useSubscription();

  const { openCheckout, loading } = useStripeCheckout();
  const [billing, setBilling] = useState<Billing>("monthly");
  const [pending, setPending] = useState<string | null>(null);

  const isFR = locale === "fr";

  const copy = useMemo(
    () => ({
      title: isFR ? "Choisissez votre voie" : "Choose your path",
      subtitle: isFR
        ? "Trois niveaux d'accès à l'écosystème AEGIS."
        : "Three levels of access to the AEGIS ecosystem.",
      monthly: isFR ? "Mensuel" : "Monthly",
      yearly: isFR ? "Annuel" : "Yearly",
      current: isFR ? "Forfait actuel" : "Current plan",
      free: {
        name: isFR ? "Initiation" : "Initiation",
        price: isFR ? "Gratuit" : "Free",
        note: isFR ? "Accès découverte" : "Discovery access",
        cta: isFR ? "Commencer" : "Get started",
        features: isFR
          ? [
              "Quiz des archétypes & rapport de synthèse",
              "Suivi quotidien : humeur, décisions, habitudes",
              "Historique illimité de vos saisies",
              "Newsletter & contenus publics",
            ]
          : [
              "Archetype quiz & synthesis report",
              "Daily logging: mood, decisions, habits",
              "Unlimited history of your entries",
              "Newsletter & public content",
            ],

      },
      matrix: {
        name: "Matrice",
        note: isFR ? "L'application complète" : "The full application",
        cta: isFR ? "Activer la Matrice" : "Activate Matrix",
        features: isFR
          ? [
              "Dashboard personnalisé complet",
              "Deep Dive & cartographie d'archétypes",
              "Tracker d'humeur, décisions et habitudes",
              "Toolbox, journal et Pulse cards",
              "Tableau de relations & calendrier",
              "Rapports personnels et exports",
            ]
          : [
              "Full personalized dashboard",
              "Deep Dive & archetype cartography",
              "Mood, decision and habit trackers",
              "Toolbox, journal and Pulse cards",
              "Relations board & calendar",
              "Personal reports and exports",
            ],
      },
      ultra: {
        name: "Ultra",
        note: isFR ? "God Mode · Inner Circle" : "God Mode · Inner Circle",
        cta: isFR ? "Rejoindre l'Inner Circle" : "Join the Inner Circle",
        features: isFR
          ? [
              "Tout le forfait Matrice",
              "Accompagnement individuel",
              "Audit et appels de suivi",
              "Programmes et protocoles sur mesure",
              "Accès prioritaire aux nouveautés",
            ]
          : [
              "Everything in Matrix",
              "One-to-one guidance",
              "Audit and follow-up calls",
              "Tailor-made programs and protocols",
              "Priority access to new features",
            ],
      },
      upfrontLabel: isFR ? "Comptant" : "Upfront",
      installmentLabel: isFR ? "6 × mensualités" : "6 monthly payments",
      compare: {
        title: isFR ? "Ce qui est inclus" : "What's included",
        subtitle: isFR
          ? "Initiation couvre la saisie quotidienne et l'historique personnel. La Matrice débloque les analyses, exports et outils avancés."
          : "Initiation covers daily logging and personal history. Matrix unlocks analytics, exports, and advanced tools.",
        feature: isFR ? "Fonctionnalité" : "Feature",
        free: isFR ? "Initiation" : "Initiation",
        matrix: "Matrice",
        ultra: "Ultra",
        footnote: isFR
          ? "Ultra = Matrice + accès Inner Circle. L'expérience produit reste la même ; la différence est humaine."
          : "Ultra = Matrix + Inner Circle access. The product experience is the same; the difference is human.",
        rows: [
          { key: "account", free: "full", matrix: "full", ultra: "full" },
          { key: "dailyLogs", free: "enter", matrix: "enter", ultra: "enter" },
          { key: "history", free: "full", matrix: "full", ultra: "full" },
          { key: "archetypeQuiz", free: "full", matrix: "full", ultra: "full" },
          { key: "dashboard", free: "none", matrix: "full", ultra: "full" },
          { key: "deepDive", free: "none", matrix: "full", ultra: "full" },
          { key: "analytics", free: "none", matrix: "full", ultra: "full" },
          { key: "toolbox", free: "none", matrix: "full", ultra: "full" },
          { key: "pulse", free: "none", matrix: "full", ultra: "full" },
          { key: "people", free: "none", matrix: "full", ultra: "full" },
          { key: "calendar", free: "none", matrix: "full", ultra: "full" },
          { key: "journal", free: "none", matrix: "full", ultra: "full" },
          { key: "exports", free: "none", matrix: "full", ultra: "full" },
          { key: "personalReports", free: "none", matrix: "full", ultra: "full" },
          { key: "humanCoaching", free: "none", matrix: "none", ultra: "full" },
        ],
      },
    }),
    [isFR],
  );


  const handleCheckout = async (priceId: string) => {
    if (!user) {
      navigate(`/auth?redirect=${encodeURIComponent("/pricing")}`);
      return;
    }
    setPending(priceId);
    try {
      await openCheckout(priceId);
    } catch {
      toast.error(isFR ? "Paiement indisponible." : "Payment unavailable.");
    } finally {
      setPending(null);
    }
  };

  const openPortal = async () => {
    setPending("portal");
    try {
      const { data, error } = await supabase.functions.invoke("stripe-portal", {
        body: { origin: window.location.origin },
      });
      const url = (data as { url?: string })?.url;
      if (error || !url) {
        toast.error(isFR ? "Portail indisponible." : "Portal unavailable.");
        return;
      }
      window.location.href = url;
    } finally {
      setPending(null);
    }
  };

  const busy = (priceId: string) => loading && pending === priceId;


  return (
    <div className="min-h-screen bg-aegis-gradient">
      <Helmet>
        <title>{isFR ? "Forfaits AEGIS — Tarifs" : "AEGIS Plans — Pricing"}</title>
        <meta
          name="description"
          content={
            isFR
              ? "Découvrez les trois forfaits AEGIS : Initiation gratuite, Matrice et Ultra."
              : "Discover the three AEGIS plans: free Initiation, Matrix and Ultra."
          }
        />
        <link rel="canonical" href="https://aegis.humancatalystbeacon.com/pricing" />
      </Helmet>

      <PaymentTestModeBanner />

      <div className="fixed top-4 right-4 flex items-center gap-2 z-50">
        <LanguageSwitcher />
        <ThemeToggle collapsed />
      </div>

      <div className="max-w-6xl mx-auto px-4 py-16">
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-center space-y-3 mb-10"
        >
          <Badge variant="outline" className="border-primary/30 text-primary uppercase tracking-widest text-[10px]">
            AEGIS
          </Badge>
          <h1 className="font-display text-3xl sm:text-4xl tracking-wide text-foreground">{copy.title}</h1>
          <p className="text-sm text-muted-foreground">{copy.subtitle}</p>
          {subscription?.status === "past_due" && (
            <p className="text-sm text-destructive">
              {isFR
                ? "Paiement échoué : votre accès est suspendu. Mettez à jour votre moyen de paiement."
                : "Payment failed: your access is suspended. Please update your payment method."}
            </p>
          )}
          {subscription && (
            <Button
              variant="outline"
              className="min-h-[44px]"
              onClick={openPortal}
              disabled={pending === "portal"}
            >
              {pending === "portal" ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : null}
              {isFR ? "Gérer mon abonnement" : "Manage my subscription"}
            </Button>
          )}
        </motion.header>


        <div className="flex justify-center mb-10">
          <div className="inline-flex rounded-full border border-border p-1 bg-background/40 backdrop-blur">
            {(["monthly", "yearly"] as Billing[]).map((b) => (
              <button
                key={b}
                onClick={() => setBilling(b)}
                className={`px-5 py-2 text-xs uppercase tracking-widest rounded-full transition-colors ${
                  billing === b ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                {b === "monthly" ? copy.monthly : copy.yearly}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3 items-start">
          {/* Free */}
          <NeuralCard variant="elevated" className="p-6 space-y-5">
            <div className="space-y-1">
              <h2 className="font-serif text-xl">{copy.free.name}</h2>
              <p className="text-xs text-muted-foreground">{copy.free.note}</p>
            </div>
            <p className="font-display text-3xl">{copy.free.price}</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {copy.free.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" aria-hidden />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Button asChild variant="outline" className="w-full min-h-[44px]">
              <Link
                to={
                  !user
                    ? "/auth?signup=1"
                    : isGuest || isAnonymousUser(user)
                      ? "/auth?upgrade=1"
                      : postLoginPath(false, user.id)
                }
              >
                {copy.free.cta}
              </Link>
            </Button>
          </NeuralCard>

          {/* Matrix */}
          <NeuralCard variant="elevated" glow="blue" className="p-6 space-y-5 border-primary/30">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <h2 className="font-serif text-xl flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" aria-hidden />
                  {copy.matrix.name}
                </h2>
                <p className="text-xs text-muted-foreground">{copy.matrix.note}</p>
              </div>
              {tier === "matrix" && <Badge variant="secondary">{copy.current}</Badge>}
            </div>
            <p className="font-display text-3xl">
              {billing === "monthly" ? "39 €" : "299 €"}
              <span className="text-sm text-muted-foreground font-sans">
                {billing === "monthly" ? (isFR ? " / mois" : " / month") : isFR ? " / an" : " / year"}
              </span>
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {copy.matrix.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" aria-hidden />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Button
              className="w-full min-h-[44px]"
              disabled={busy(billing === "monthly" ? "aegis_matrix_monthly" : "aegis_matrix_yearly")}
              onClick={() =>
                handleCheckout(billing === "monthly" ? "aegis_matrix_monthly" : "aegis_matrix_yearly")
              }
            >
              {busy(billing === "monthly" ? "aegis_matrix_monthly" : "aegis_matrix_yearly") && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden />
              )}
              {copy.matrix.cta}
            </Button>
          </NeuralCard>

          {/* Ultra */}
          <NeuralCard variant="elevated" glow="warm" className="p-6 space-y-5 border-accent-primary/30">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <h2 className="font-serif text-xl flex items-center gap-2">
                  <Crown className="w-4 h-4 text-accent-primary" aria-hidden />
                  {copy.ultra.name}
                </h2>
                <p className="text-xs text-muted-foreground">{copy.ultra.note}</p>
              </div>
              {tier === "ultra" && <Badge variant="secondary">{copy.current}</Badge>}
            </div>
            <div className="space-y-1">
              <p className="font-display text-3xl">8 000 €</p>
              <p className="text-xs text-muted-foreground">
                {copy.upfrontLabel} · {copy.installmentLabel} : 1 500 €
              </p>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {copy.ultra.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <Check className="w-4 h-4 text-accent-primary shrink-0 mt-0.5" aria-hidden />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <div className="space-y-2">
              <Button
                className="w-full min-h-[44px]"
                disabled={busy("aegis_ultra_upfront")}
                onClick={() => handleCheckout("aegis_ultra_upfront")}
              >
                {busy("aegis_ultra_upfront") && <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden />}
                {copy.ultra.cta} — {copy.upfrontLabel}
              </Button>
              <Button
                variant="outline"
                className="w-full min-h-[44px]"
                disabled={busy("aegis_ultra_monthly")}
                onClick={() => handleCheckout("aegis_ultra_monthly")}
              >
                {busy("aegis_ultra_monthly") && <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden />}
                {copy.installmentLabel}
              </Button>
            </div>
          </NeuralCard>
        </div>

        {/* Feature comparison */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="mt-16"
        >
          <NeuralCard variant="elevated" className="overflow-hidden">
            <div className="p-6 border-b border-border/50">
              <h2 className="font-display text-xl tracking-wide text-foreground mb-1">
                {copy.compare.title}
              </h2>
              <p className="text-sm text-muted-foreground">{copy.compare.subtitle}</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 bg-background/30">
                    <th className="text-left px-6 py-4 font-medium text-foreground w-[45%]">
                      {copy.compare.feature}
                    </th>
                    <th className="text-center px-4 py-4 font-medium text-muted-foreground w-[18%]">
                      {copy.compare.free}
                    </th>
                    <th className="text-center px-4 py-4 font-medium text-primary w-[18%]">
                      {copy.compare.matrix}
                    </th>
                    <th className="text-center px-4 py-4 font-medium text-accent-foreground w-[18%]">
                      {copy.compare.ultra}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {copy.compare.rows.map((row, i) => {
                    const label = {
                      account: isFR ? "Compte, profil, réglages, app Android" : "Account, profile, settings, Android app",
                      dailyLogs: isFR ? "Humeur, décisions, habitudes" : "Mood, decisions, habits",
                      history: isFR ? "Historique illimité de ses propres données" : "Unlimited history of own data",
                      archetypeQuiz: isFR ? "Quiz archétypes & rapport de synthèse" : "Archetype quiz & synthesis report",
                      dashboard: isFR ? "Dashboard personnalisé avec insights" : "Personalized dashboard with insights",
                      deepDive: isFR ? "Deep Dive & cartographie d'archétypes" : "Deep Dive & archetype cartography",
                      analytics: isFR ? "Analyses, corrélations et insights IA" : "Analytics, correlations, AI insights",
                      toolbox: isFR ? "Toolbox (breathwork, body scan, affirmations)" : "Toolbox (breathwork, body scan, affirmations)",
                      pulse: isFR ? "Pulse cards — micro-apprentissage" : "Pulse cards — micro-learning",
                      people: isFR ? "Tableau de relations & proximité" : "Relationship board & proximity",
                      calendar: isFR ? "Calendrier (mood, habitudes, décisions, journal)" : "Calendar (mood, habits, decisions, journal)",
                      journal: isFR ? "Journal avec tags d'humeur" : "Journal with mood tags",
                      exports: isFR ? "Exports rapports, PDF et données" : "Reports, PDF and data exports",
                      personalReports: isFR ? "Rapports personnels admin" : "Admin personal reports",
                      humanCoaching: isFR ? "Accompagnement humain, audit, appels" : "Human coaching, audit, calls",
                    }[row.key];

                    const cell = (value: string) => {
                      if (value === "none") {
                        return <X className="w-4 h-4 text-muted-foreground/50 mx-auto" aria-hidden />;
                      }
                      if (value === "full") {
                        return <Check className="w-4 h-4 text-primary mx-auto" aria-hidden />;
                      }
                      return <span className="text-xs text-muted-foreground">{isFR ? "Saisir" : "Enter"}</span>;
                    };

                    return (
                      <tr
                        key={row.key}
                        className={`border-b border-border/30 last:border-0 ${i % 2 === 1 ? "bg-background/20" : ""}`}
                      >
                        <td className="px-6 py-3 text-foreground">{label}</td>
                        <td className="px-4 py-3 text-center">{cell(row.free)}</td>
                        <td className="px-4 py-3 text-center">{cell(row.matrix)}</td>
                        <td className="px-4 py-3 text-center">{cell(row.ultra)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <p className="px-6 py-4 text-xs text-muted-foreground border-t border-border/50">
              {copy.compare.footnote}
            </p>
          </NeuralCard>
        </motion.div>
      </div>
      <PublicFooter />
    </div>
  );
}
