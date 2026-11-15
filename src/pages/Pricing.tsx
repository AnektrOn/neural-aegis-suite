import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Crown, Loader2, Mic, Sparkles, X } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { NeuralCard } from "@/components/ui/neural-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import PaymentTestModeBanner from "@/components/PaymentTestModeBanner";
import PublicFooter from "@/components/public/PublicFooter";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { supabase } from "@/integrations/supabase/client";
import { LIEN_PAIEMENT_LECTURE } from "@/pages/aegis-landing/landingCtaHrefs";

import { toast } from "sonner";

type Billing = "monthly" | "yearly";

/** Réactiver Matrice / Ultra / le toggle mensuel-annuel en passant à `true`. */
const SHOW_PRICING_BILLING_TOGGLE = false;
const SHOW_MATRIX_PLAN = false;
const SHOW_ULTRA_PLAN = false;
const SHOW_LECTURE_PLAN = false;

const PLAN_SOLO = "aegis_solo_monthly";
const PLAN_SOLO_LOGOS = "aegis_solo_logos_monthly";
const PLAN_FOUNDERS = "aegis_founders_lifetime";

type FoundersAvailability = { remaining: number; open: boolean; sold: number; max: number };

export default function Pricing() {
  const { locale } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { tier, subscription } = useSubscription();

  const { openCheckout, loading } = useStripeCheckout();
  const [billing, setBilling] = useState<Billing>("monthly");
  const [pending, setPending] = useState<string | null>(null);
  const [founders, setFounders] = useState<FoundersAvailability | null>(null);

  const isFR = locale === "fr";

  useEffect(() => {
    void supabase.functions.invoke("founders-availability").then(({ data, error }) => {
      if (error || !data) return;
      const row = data as FoundersAvailability;
      if (typeof row.remaining === "number" && typeof row.open === "boolean") {
        setFounders(row);
      }
    });
  }, []);

  const copy = useMemo(
    () => ({
      title: isFR ? "Choisissez votre voie" : "Choose your path",
      subtitle: isFR
        ? "Exocortex décisionnel pour dirigeants solo — plateforme web, registre d'arbitrages et, en option, l'agent vocal LOGOS."
        : "Decision exocortex for solo leaders — web platform, decision registry, and optional LOGOS voice agent.",
      taxNote: isFR
        ? "Prix HT. TVA calculée au checkout selon votre pays (Stripe Tax)."
        : "Prices exclude tax. VAT is calculated at checkout (Stripe Tax).",
      solo: {
        name: "AEGIS Solo",
        note: isFR ? "Exocortex décisionnel complet" : "Full decision exocortex",
        price: "35 €",
        cta: isFR ? "Activer AEGIS Solo" : "Activate AEGIS Solo",
        features: isFR
          ? [
              "Bilan d'onboarding archétypal inclus",
              "Dashboard de pilotage",
              "People Board 3D",
              "Registre des décisions",
              "10 toolbox items / semaine",
              "50 interactions RAG / semaine (min.)",
            ]
          : [
              "Archetypal onboarding report included",
              "Executive dashboard",
              "3D People Board",
              "Decision registry",
              "10 toolbox items / week",
              "50 RAG interactions / week (min.)",
            ],
      },
      soloLogos: {
        name: "AEGIS + LOGOS Solo",
        note: isFR ? "Exocortex + sparring vocal 24/7" : "Exocortex + 24/7 voice sparring",
        price: "110 €",
        cta: isFR ? "Activer Solo + LOGOS" : "Activate Solo + LOGOS",
        features: isFR
          ? [
              "Tout AEGIS Solo",
              "Agent vocal IA LOGOS intégré",
              "Débriefing oral & préparation vocale",
              "Connexion Vault & historique décisionnel",
              "10 toolbox items / semaine",
              "50 interactions RAG / semaine (min.)",
            ]
          : [
              "Everything in AEGIS Solo",
              "Integrated LOGOS voice agent",
              "Oral debrief & voice prep for negotiations",
              "Vault & decision history connected",
              "10 toolbox items / week",
              "50 RAG interactions / week (min.)",
            ],
      },
      founders: {
        name: isFR ? "Membres Fondateurs" : "Founding Members",
        note: isFR ? "AEGIS Solo à vie — 20 places" : "Lifetime AEGIS Solo — 20 seats",
        price: "350 €",
        priceSuffix: isFR ? " HT — paiement unique" : " excl. tax — one-time",
        cta: isFR ? "Rejoindre la cohorte" : "Join the cohort",
        ctaSoldOut: isFR ? "Cohorte complète" : "Cohort full",
        guarantee: isFR
          ? "Garantie sérénité 30 jours · LOGOS en option (abonnement séparé)"
          : "30-day serenity guarantee · LOGOS optional (separate subscription)",
        features: isFR
          ? [
              "Accès à vie à AEGIS Solo",
              "Rapport d'onboarding inclus",
              "Mises à jour majeures incluses",
              "Équivalent ~10 mois d'abonnement",
              "10 toolbox items / semaine",
              "50 interactions RAG / semaine (min.)",
            ]
          : [
              "Lifetime AEGIS Solo access",
              "Onboarding report included",
              "Major updates included",
              "Roughly 10 months of subscription value",
              "10 toolbox items / week",
              "50 RAG interactions / week (min.)",
            ],
      },
      monthly: isFR ? "Mensuel" : "Monthly",
      yearly: isFR ? "Annuel" : "Yearly",
      current: isFR ? "Forfait actuel" : "Current plan",
      afterLecture:
        "Après votre Lecture, un suivi mensuel vous est proposé si vous le souhaitez.",
      free: {
        name: isFR ? "Initiation" : "Initiation",
        price: isFR ? "Gratuit" : "Free",
        note: isFR ? "Accès découverte" : "Discovery access",
        cta: "Faire le questionnaire",
        features: [
          "Le questionnaire de 30 questions et votre profil parmi 16 archétypes.",
        ],
      },
      lecture: {
        name: "La Lecture",
        price: "149 € HT — une fois",
        note: "Lecture humaine de votre profil",
        cta: "Réserver ma Lecture",
        features: [
          "Questionnaire complet · rapport écrit par une personne · 30 minutes de visio · remboursée sous 30 jours sur simple e-mail",
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
        title: isFR ? "Comparatif des offres" : "Plan comparison",
        subtitle: isFR
          ? "Initiation = découverte gratuite. Les offres Solo débloquent la plateforme décisionnelle complète."
          : "Initiation = free discovery. Solo plans unlock the full decision platform.",
        feature: isFR ? "Fonctionnalité" : "Feature",
        free: isFR ? "Initiation" : "Initiation",
        solo: "Solo",
        soloLogos: "Solo + LOGOS",
        founders: isFR ? "Fondateurs" : "Founders",
        footnote: isFR
          ? "LOGOS n'est pas inclus dans l'offre Fondateurs. Offres entreprise (équipes) : sur devis."
          : "LOGOS is not included in Founders. Team plans: contact us.",
        rows: [
          { key: "onboarding", free: "none", solo: "full", soloLogos: "full", founders: "full" },
          { key: "dashboard", free: "none", solo: "full", soloLogos: "full", founders: "full" },
          { key: "peopleBoard", free: "none", solo: "full", soloLogos: "full", founders: "full" },
          { key: "decisions", free: "none", solo: "full", soloLogos: "full", founders: "full" },
          { key: "toolboxQuota", free: "none", solo: "full", soloLogos: "full", founders: "full" },
          { key: "ragQuota", free: "none", solo: "full", soloLogos: "full", founders: "full" },
          { key: "logos", free: "none", solo: "none", soloLogos: "full", founders: "none" },
          { key: "lifetime", free: "none", solo: "none", soloLogos: "none", founders: "full" },
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
    } catch (e) {
      const code = e instanceof Error ? e.message : "";
      if (code === "FOUNDERS_SOLD_OUT") {
        toast.error(isFR ? "Les 20 places fondateurs sont prises." : "All 20 founder seats are taken.");
      } else if (code === "FOUNDERS_ALREADY_OWNED") {
        toast.error(isFR ? "Vous avez déjà l'accès fondateur." : "You already have founder access.");
      } else {
        toast.error(isFR ? "Paiement indisponible." : "Payment unavailable.");
      }
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

  const activeProductId = tier !== "free" ? subscription?.product_id : null;
  const foundersOpen = founders?.open !== false;
  const foundersPlacesLabel =
    founders != null
      ? isFR
        ? `${founders.remaining} place${founders.remaining > 1 ? "s" : ""} restante${founders.remaining > 1 ? "s" : ""}`
        : `${founders.remaining} seat${founders.remaining === 1 ? "" : "s"} left`
      : isFR
        ? "20 places max"
        : "20 seats max";


  return (
    <div className="min-h-screen bg-aegis-gradient">
      <Helmet>
        <title>{isFR ? "Forfaits AEGIS — Tarifs" : "AEGIS Plans — Pricing"}</title>
        <meta
          name="description"
          content={
            isFR
              ? "AEGIS Solo, AEGIS + LOGOS et offre Fondateurs — tarifs HT pour dirigeants solo."
              : "AEGIS Solo, AEGIS + LOGOS, and Founders lifetime — ex-tax pricing for solo leaders."
          }
        />
        <link rel="canonical" href="https://aegis.humancatalystbeacon.com/pricing" />
      </Helmet>

      <PaymentTestModeBanner />

      <div className="fixed top-4 right-4 flex items-center gap-2 z-50">
        <LanguageSwitcher />
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


        {SHOW_PRICING_BILLING_TOGGLE ? (
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
        ) : null}

        <div className="grid gap-6 items-start md:grid-cols-2 lg:grid-cols-4">
          {/* Free */}
          <NeuralCard variant="elevated" className="p-6 space-y-5 lg:col-span-1">
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
              <Link to="/quiz">{copy.free.cta}</Link>
            </Button>
          </NeuralCard>

          {SHOW_LECTURE_PLAN ? (
            <NeuralCard
              variant="elevated"
              glow="blue"
              className="p-6 space-y-5 border-primary/40 ring-1 ring-primary/20 order-first md:order-none md:scale-[1.02]"
            >
              <div className="space-y-1">
                <h2 className="font-serif text-xl flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" aria-hidden />
                  {copy.lecture.name}
                </h2>
                <p className="text-xs text-muted-foreground">{copy.lecture.note}</p>
              </div>
              <p className="font-display text-3xl">{copy.lecture.price}</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {copy.lecture.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" aria-hidden />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button asChild className="w-full min-h-[44px]">
                <a href={LIEN_PAIEMENT_LECTURE}>{copy.lecture.cta}</a>
              </Button>
            </NeuralCard>
          ) : null}

          <NeuralCard variant="elevated" glow="blue" className="p-6 space-y-5 border-primary/30">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <h2 className="font-serif text-xl flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" aria-hidden />
                  {copy.solo.name}
                </h2>
                <p className="text-xs text-muted-foreground">{copy.solo.note}</p>
              </div>
              {activeProductId === "aegis_solo" && <Badge variant="secondary">{copy.current}</Badge>}
            </div>
            <p className="font-display text-3xl">
              {copy.solo.price}
              <span className="text-sm text-muted-foreground font-sans">
                {isFR ? " HT / mois" : " excl. tax / mo"}
              </span>
            </p>
            <p className="text-[11px] text-muted-foreground">{copy.taxNote}</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {copy.solo.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" aria-hidden />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Button
              className="w-full min-h-[44px]"
              disabled={busy(PLAN_SOLO)}
              onClick={() => handleCheckout(PLAN_SOLO)}
            >
              {busy(PLAN_SOLO) && <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden />}
              {copy.solo.cta}
            </Button>
          </NeuralCard>

          <NeuralCard variant="elevated" className="p-6 space-y-5 border-primary/40 ring-1 ring-primary/20">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <h2 className="font-serif text-xl flex items-center gap-2">
                  <Mic className="w-4 h-4 text-primary" aria-hidden />
                  {copy.soloLogos.name}
                </h2>
                <p className="text-xs text-muted-foreground">{copy.soloLogos.note}</p>
              </div>
              {activeProductId === "aegis_solo_logos" && <Badge variant="secondary">{copy.current}</Badge>}
            </div>
            <p className="font-display text-3xl">
              {copy.soloLogos.price}
              <span className="text-sm text-muted-foreground font-sans">
                {isFR ? " HT / mois" : " excl. tax / mo"}
              </span>
            </p>
            <p className="text-[11px] text-muted-foreground">{copy.taxNote}</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {copy.soloLogos.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" aria-hidden />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Button
              className="w-full min-h-[44px]"
              disabled={busy(PLAN_SOLO_LOGOS)}
              onClick={() => handleCheckout(PLAN_SOLO_LOGOS)}
            >
              {busy(PLAN_SOLO_LOGOS) && <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden />}
              {copy.soloLogos.cta}
            </Button>
          </NeuralCard>

          <NeuralCard variant="elevated" glow="warm" className="p-6 space-y-5 border-accent-primary/30">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <h2 className="font-serif text-xl flex items-center gap-2">
                  <Crown className="w-4 h-4 text-accent-primary" aria-hidden />
                  {copy.founders.name}
                </h2>
                <p className="text-xs text-muted-foreground">{copy.founders.note}</p>
              </div>
              {activeProductId === "aegis_founders_lifetime" && (
                <Badge variant="secondary">{copy.current}</Badge>
              )}
            </div>
            <Badge variant="outline" className="text-[10px] uppercase tracking-wider w-fit">
              {foundersPlacesLabel}
            </Badge>
            <p className="font-display text-3xl">
              {copy.founders.price}
              <span className="text-sm text-muted-foreground font-sans">{copy.founders.priceSuffix}</span>
            </p>
            <p className="text-[11px] text-muted-foreground">{copy.taxNote}</p>
            <p className="text-xs text-muted-foreground">{copy.founders.guarantee}</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {copy.founders.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <Check className="w-4 h-4 text-accent-primary shrink-0 mt-0.5" aria-hidden />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Button
              className="w-full min-h-[44px]"
              disabled={!foundersOpen || busy(PLAN_FOUNDERS)}
              onClick={() => handleCheckout(PLAN_FOUNDERS)}
            >
              {busy(PLAN_FOUNDERS) && <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden />}
              {foundersOpen ? copy.founders.cta : copy.founders.ctaSoldOut}
            </Button>
          </NeuralCard>

          {/* Matrix — code et produits Stripe conservés ; réactiver via SHOW_MATRIX_PLAN */}
          {SHOW_MATRIX_PLAN ? (
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
                  {billing === "monthly"
                    ? isFR
                      ? " HT / mois"
                      : " excl. tax / month"
                    : isFR
                      ? " HT / an"
                      : " excl. tax / year"}
                </span>
              </p>
              <p className="text-[11px] text-muted-foreground">
                {isFR
                  ? "Prix hors taxes. La TVA applicable est calculée au checkout selon votre pays (Stripe Tax)."
                  : "Prices exclude tax. Applicable VAT is calculated at checkout based on your country (Stripe Tax)."}
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
          ) : null}

          {/* Ultra — code et produits Stripe conservés ; réactiver via SHOW_ULTRA_PLAN */}
          {SHOW_ULTRA_PLAN ? (
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
                <p className="font-display text-3xl">
                  8 000 €
                  <span className="text-sm text-muted-foreground font-sans">
                    {isFR ? " HT" : " excl. tax"}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {copy.upfrontLabel} · {copy.installmentLabel} : 1 500 € {isFR ? "HT" : "excl. tax"}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {isFR
                    ? "Montants hors taxes. TVA calculée au checkout (Stripe Tax)."
                    : "Amounts exclude tax. VAT calculated at checkout (Stripe Tax)."}
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
                  {busy("aegis_ultra_upfront") && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden />
                  )}
                  {copy.ultra.cta} — {copy.upfrontLabel}
                </Button>
                <Button
                  variant="outline"
                  className="w-full min-h-[44px]"
                  disabled={busy("aegis_ultra_monthly")}
                  onClick={() => handleCheckout("aegis_ultra_monthly")}
                >
                  {busy("aegis_ultra_monthly") && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden />
                  )}
                  {copy.installmentLabel}
                </Button>
              </div>
            </NeuralCard>
          ) : null}
        </div>

        {SHOW_LECTURE_PLAN ? (
          <p className="mt-8 text-center text-sm text-muted-foreground">{copy.afterLecture}</p>
        ) : null}

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
                    <th className="text-center px-3 py-4 font-medium text-muted-foreground w-[14%]">
                      {copy.compare.free}
                    </th>
                    <th className="text-center px-3 py-4 font-medium text-primary w-[14%]">
                      {copy.compare.solo}
                    </th>
                    <th className="text-center px-3 py-4 font-medium text-primary w-[14%]">
                      {copy.compare.soloLogos}
                    </th>
                    <th className="text-center px-3 py-4 font-medium text-accent-foreground w-[14%]">
                      {copy.compare.founders}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {copy.compare.rows.map((row, i) => {
                    const label = {
                      onboarding: isFR ? "Rapport initial archétypal" : "Initial archetypal report",
                      dashboard: isFR ? "Dashboard de pilotage" : "Executive dashboard",
                      peopleBoard: isFR ? "People Board 3D" : "3D People Board",
                      decisions: isFR ? "Registre des décisions" : "Decision registry",
                      toolboxQuota: isFR ? "10 toolbox items / semaine" : "10 toolbox items / week",
                      ragQuota: isFR ? "50 interactions RAG / semaine" : "50 RAG interactions / week",
                      logos: isFR ? "Agent vocal LOGOS" : "LOGOS voice agent",
                      lifetime: isFR ? "Accès à vie (Fondateurs)" : "Lifetime access (Founders)",
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
                        <td className="px-3 py-3 text-center">{cell(row.free)}</td>
                        <td className="px-3 py-3 text-center">{cell(row.solo)}</td>
                        <td className="px-3 py-3 text-center">{cell(row.soloLogos)}</td>
                        <td className="px-3 py-3 text-center">{cell(row.founders)}</td>
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
