import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Brain, LineChart, ListChecks, Users, Sparkles, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ThemeToggle from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import PublicFooter from "@/components/public/PublicFooter";

export default function Landing() {
  const { locale, t } = useLanguage();
  const isFR = locale === "fr";

  const features = [
    {
      icon: Brain,
      title: isFR ? "Cartographie d'archétypes" : "Archetype cartography",
      body: isFR
        ? "Un questionnaire approfondi révèle votre profil de leadership et vos angles morts."
        : "An in-depth assessment reveals your leadership profile and blind spots.",
    },
    {
      icon: ListChecks,
      title: isFR ? "Journal de décisions" : "Decision log",
      body: isFR
        ? "Consignez vos arbitrages, leur niveau de responsabilité et le temps de réflexion accordé."
        : "Record your calls, their responsibility level and the reflection time you gave them.",
    },
    {
      icon: LineChart,
      title: isFR ? "Humeur, habitudes, analytique" : "Mood, habits, analytics",
      body: isFR
        ? "Suivez énergie, sommeil, stress et habitudes, puis lisez les corrélations dans le temps."
        : "Track energy, sleep, stress and habits, then read the correlations over time.",
    },
    {
      icon: Users,
      title: isFR ? "Tableau de relations" : "Relationship board",
      body: isFR
        ? "Visualisez votre réseau proche et la qualité réelle de chaque lien."
        : "Map your inner circle and the real quality of each relationship.",
    },
    {
      icon: Sparkles,
      title: isFR ? "Rapports et insights IA" : "AI reports and insights",
      body: isFR
        ? "Des synthèses personnalisées transforment vos données en recommandations concrètes."
        : "Personalised syntheses turn your data into concrete recommendations.",
    },
    {
      icon: ShieldCheck,
      title: isFR ? "Vos données, protégées" : "Your data, protected",
      body: isFR
        ? "Chaque entrée est privée, isolée par compte, jamais revendue."
        : "Every entry is private, isolated per account, never sold.",
    },
  ];

  const description = isFR
    ? "Aegis est le protocole de leadership de Protocole Nomos : journal de décisions, suivi d'humeur et d'habitudes, cartographie d'archétypes et analyses personnalisées."
    : "Aegis is Protocole Nomos' leadership protocol: decision log, mood and habit tracking, archetype cartography and personalised analytics.";

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>
          {isFR
            ? "Aegis — Protocole de leadership | Protocole Nomos"
            : "Aegis — Leadership protocol | Protocole Nomos"}
        </title>
        <meta name="description" content={description} />
        <meta property="og:title" content="Aegis — Protocole Nomos" />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href="https://aegis.humancatalystbeacon.com/" />
      </Helmet>

      <header className="flex items-center justify-between px-6 py-5">
        <span className="font-display text-sm uppercase tracking-[0.24em] text-foreground">
          Aegis
        </span>
        <div className="flex items-center gap-3">
          <Link
            to="/auth"
            className="text-[11px] uppercase tracking-[0.16em] text-text-tertiary transition-colors hover:text-foreground"
          >
            {t("auth.signIn")}
          </Link>
          <Link
            to="/pricing"
            className="text-[11px] uppercase tracking-[0.16em] text-text-tertiary transition-colors hover:text-foreground"
          >
            {isFR ? "Tarifs" : "Pricing"}
          </Link>
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-3xl px-6 pb-16 pt-14 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-display text-4xl leading-tight tracking-wide text-foreground sm:text-5xl"
          >
            {isFR
              ? "Le protocole qui rend vos décisions lisibles"
              : "The protocol that makes your decisions legible"}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground"
          >
            {description}
          </motion.p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button asChild size="lg">
              <Link to="/auth">{isFR ? "Commencer gratuitement" : "Start for free"}</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/pricing">{isFR ? "Voir les forfaits" : "See plans"}</Link>
            </Button>
          </div>
          <p className="mt-4 text-xs text-text-tertiary">
            {isFR
              ? "Forfait Initiation gratuit · Garantie 30 jours sur les forfaits payants"
              : "Free Initiation plan · 30-day guarantee on paid plans"}
          </p>
        </section>

        <section className="mx-auto max-w-5xl px-6 pb-16">
          <h2 className="text-center font-display text-2xl tracking-wide text-foreground">
            {isFR ? "Ce que vous obtenez" : "What you get"}
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <article
                key={f.title}
                className="rounded-2xl border border-border-subtle/60 bg-card/40 p-6 backdrop-blur-xl"
              >
                <f.icon className="h-5 w-5 text-primary" strokeWidth={1.25} aria-hidden />
                <h3 className="mt-4 font-display text-base text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-6 pb-20 text-center">
          <h2 className="font-display text-2xl tracking-wide text-foreground">
            {isFR ? "Comment ça marche" : "How it works"}
          </h2>
          <ol className="mt-8 space-y-4 text-left text-sm leading-relaxed text-muted-foreground">
            <li>
              <strong className="text-foreground">1. </strong>
              {isFR
                ? "Créez votre compte et passez le questionnaire d'archétypes."
                : "Create your account and take the archetype assessment."}
            </li>
            <li>
              <strong className="text-foreground">2. </strong>
              {isFR
                ? "Consignez chaque jour humeur, décisions et habitudes — c'est gratuit, sans limite."
                : "Log your mood, decisions and habits daily — free, with no limit."}
            </li>
            <li>
              <strong className="text-foreground">3. </strong>
              {isFR
                ? "Passez à un forfait payant pour débloquer analyses, rapports et accompagnement."
                : "Upgrade to a paid plan to unlock analytics, reports and coaching."}
            </li>
          </ol>
          <div className="mt-10">
            <Button asChild size="lg">
              <Link to="/pricing">{isFR ? "Découvrir les tarifs" : "View pricing"}</Link>
            </Button>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
