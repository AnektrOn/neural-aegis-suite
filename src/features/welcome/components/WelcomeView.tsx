import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronDown, Languages, Menu, Mic, X } from "lucide-react";
import { useAegisMotion } from "@/hooks/useAegisMotion";
import { useLanguage } from "@/i18n/LanguageContext";
import AegisLogo from "@/components/AegisLogo";
import { WelcomeLandingNebula } from "./WelcomeLandingNebula";
import { SilentDemoPlayer } from "./SilentDemoPlayer";
import {
  PRICING_TIERS,
  QUICK_TOOLS,
  QUIZ_REVELATIONS,
  VALUE_MATRIX_ROWS,
  VOICE_CONTRACT_CARDS,
  WELCOME_GOLD,
  WELCOME_MUTED,
} from "../welcomeLandingContent";
import { SeoHelmet } from "@/seo/SeoHelmet";
import { HOME_FAQ, HOME_SEO_COPY } from "@/seo/seoPages";
import { seoCanonical } from "@/seo/site";
import {
  homeAudienceSection,
  homeDiscoverLinks,
  homeFaqUi,
  homeHeroUi,
  homeLogosSection,
  homeProblemSection,
  homeSolutionSection,
} from "@/seo/homeUi";

export interface WelcomeViewProps {
  onStartAudit: () => void;
}

function t<T extends { fr: string; en: string }>(item: T, isFR: boolean): string {
  return isFR ? item.fr : item.en;
}

function GoldMark() {
  return (
    <span className="mr-2 text-[#BC9746]" aria-hidden>
      ◆
    </span>
  );
}

export const WelcomeView: React.FC<WelcomeViewProps> = ({ onStartAudit }) => {
  const { fadeUp } = useAegisMotion();
  const { locale, setLocale } = useLanguage();
  const isFR = locale !== "en";
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const toggleLanguage = () => setLocale(locale === "fr" ? "en" : "fr");

  const primaryCtaClass =
    "inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-full border px-8 py-3 font-display text-[11px] uppercase tracking-[0.2em] transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";
  const primaryCtaStyle = {
    borderColor: `${WELCOME_GOLD}66`,
    backgroundColor: `${WELCOME_GOLD}22`,
    color: WELCOME_GOLD,
  } as const;

  return (
    <div className="welcome-hud relative flex min-h-[100dvh] flex-col overflow-x-hidden pb-[calc(4.5rem+env(safe-area-inset-bottom))] text-foreground selection:bg-primary/25 sm:pb-0">
      <SeoHelmet
        variant="home"
        title={HOME_SEO_COPY.title}
        description={HOME_SEO_COPY.description}
        canonical={seoCanonical("/")}
        ogTitle={HOME_SEO_COPY.ogTitle}
        faq={HOME_FAQ}
      />

      <a
        href="#welcome-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-background focus:px-4 focus:py-2 focus:outline focus:outline-2 focus:outline-ring"
      >
        {isFR ? "Aller au contenu" : "Skip to content"}
      </a>

      <WelcomeLandingNebula />
      <div className="welcome-hud-bg" aria-hidden />

      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0A0A0B]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <AegisLogo alt="AEGIS" className="h-9 w-9 shrink-0 rounded-lg" width={36} height={36} />
            <span className="hidden font-cinzel text-[10px] uppercase tracking-[0.28em] text-[#BC9746] sm:inline">
              {isFR ? "Pour celui qui décide seul" : "For those who decide alone"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/auth"
              className="hidden min-h-11 items-center justify-center px-3 font-display text-[10px] uppercase tracking-[0.22em] text-[#D1D5DB] no-underline transition-colors hover:text-white sm:inline-flex"
            >
              {isFR ? "Se connecter" : "Sign in"}
            </Link>

            <button
              type="button"
              onClick={toggleLanguage}
              aria-label={locale === "fr" ? "Switch to English" : "Passer en français"}
              className="inline-flex h-11 min-w-[48px] items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 text-[#D1D5DB]"
            >
              <Languages size={14} aria-hidden />
              <span className="font-cinzel text-[11px] font-bold uppercase">{locale}</span>
            </button>

            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white lg:hidden"
              aria-expanded={mobileNavOpen}
              aria-controls="welcome-mobile-drawer"
              aria-label={mobileNavOpen ? (isFR ? "Fermer" : "Close") : isFR ? "Menu" : "Menu"}
              onClick={() => setMobileNavOpen((o) => !o)}
            >
              {mobileNavOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {mobileNavOpen ? (
          <nav
            id="welcome-mobile-drawer"
            className="border-t border-white/10 bg-[#0A0A0B]/95 px-5 py-4 backdrop-blur-xl lg:hidden"
            aria-label={isFR ? "Navigation" : "Navigation"}
          >
            <button
              type="button"
              onClick={() => {
                setMobileNavOpen(false);
                onStartAudit();
              }}
              className="flex min-h-11 w-full items-center justify-between border-b border-white/10 py-3 font-display text-[11px] uppercase tracking-[0.22em] text-white"
            >
              {isFR ? "Quiz 30 questions" : "30-question quiz"}
              <ArrowRight size={14} />
            </button>
            <a
              href="#tarifs"
              onClick={() => setMobileNavOpen(false)}
              className="flex min-h-11 items-center justify-between border-b border-white/10 py-3 font-display text-[11px] uppercase tracking-[0.22em] text-[#D1D5DB] no-underline"
            >
              {isFR ? "Tarifs" : "Pricing"}
            </a>
            <a
              href="#faq"
              onClick={() => setMobileNavOpen(false)}
              className="flex min-h-11 items-center py-3 font-display text-[11px] uppercase tracking-[0.22em] text-[#D1D5DB] no-underline"
            >
              FAQ
            </a>
            <Link
              to="/auth"
              onClick={() => setMobileNavOpen(false)}
              className="mt-2 flex min-h-11 items-center font-display text-[10px] uppercase tracking-[0.22em] text-[#BC9746] no-underline"
            >
              {isFR ? "Se connecter" : "Sign in"}
            </Link>
          </nav>
        ) : null}
      </header>

      <main id="welcome-main" className="relative z-10 flex-1">
        {/* —— HERO —— */}
        <section
          id="welcome-hero"
          aria-labelledby="welcome-hero-heading"
          className="mx-auto flex min-h-[min(85vh,720px)] max-w-7xl flex-col justify-center px-5 py-20 sm:px-8 lg:py-24"
        >
          <motion.div {...fadeUp(0.08)} className="max-w-xl">
              <p className="font-display text-[10px] uppercase tracking-[0.32em] text-[#BC9746]">
                {t(homeHeroUi.chip, isFR)}
              </p>

              <h1
                id="welcome-hero-heading"
                className="mt-6 font-cormorant-display text-[2.75rem] leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[3rem]"
              >
                {t(homeHeroUi.h1, isFR)}
              </h1>

              <blockquote className="mt-5 max-w-md border-l-2 border-[#BC9746]/60 pl-4 font-body text-sm leading-relaxed text-[#E5E7EB] sm:text-base">
                {t(homeHeroUi.tldr, isFR)}
              </blockquote>

              <p
                className="mt-6 max-w-md font-body text-lg leading-relaxed"
                style={{ color: WELCOME_MUTED }}
              >
                {t(homeHeroUi.subtitle, isFR)}
              </p>

              <div className="mt-10 flex flex-col items-stretch gap-3 sm:items-start">
                <button
                  type="button"
                  onClick={onStartAudit}
                  className={primaryCtaClass}
                  style={primaryCtaStyle}
                >
                  <Mic size={14} aria-hidden />
                  {t(homeHeroUi.primaryCta, isFR)}
                  <ArrowRight size={14} aria-hidden />
                </button>
                <Link
                  to="/tools"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-8 py-3 font-display text-[11px] uppercase tracking-[0.2em] text-[#D1D5DB] no-underline transition-colors hover:border-[#BC9746]/50 hover:text-[#BC9746]"
                >
                  {t(homeHeroUi.secondaryCta, isFR)}
                  <ArrowRight size={14} aria-hidden />
                </Link>
                <p className="font-display text-[11px] uppercase tracking-[0.18em] text-[#D1D5DB]/70">
                  {isFR
                    ? "Résultat immédiat • Aucune carte bancaire • Chiffrement privé étanche"
                    : "Instant results • No card required • Private encryption"}
                </p>
                <a
                  href="#demo-vocale"
                  className="mt-2 inline-flex min-h-11 items-center gap-2 font-display text-[10px] uppercase tracking-[0.22em] text-[#D1D5DB]/80 no-underline transition-colors hover:text-[#BC9746]"
                >
                  {isFR ? "Écouter un arbitrage réel" : "Listen to a real arbitration"}
                  <ArrowRight size={12} aria-hidden />
                </a>
              </div>
          </motion.div>
        </section>

        <section
          id="probleme-decisionnel"
          aria-labelledby="welcome-problem-heading"
          className="border-t border-white/10 bg-black/10 py-20"
        >
          <div className="mx-auto max-w-3xl px-5 sm:px-8">
            <h2 id="welcome-problem-heading" className="font-cormorant-display text-3xl text-white">
              {t(homeProblemSection.title, isFR)}
            </h2>
            <p className="mt-4 font-body text-base leading-relaxed" style={{ color: WELCOME_MUTED }}>
              {t(homeProblemSection.body, isFR)}
            </p>
          </div>
        </section>

        <section
          id="solution-aegis"
          aria-labelledby="welcome-solution-heading"
          className="py-20"
        >
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <h2 id="welcome-solution-heading" className="font-cormorant-display text-3xl text-white">
              {t(homeSolutionSection.title, isFR)}
            </h2>
            <ul className="mt-10 grid gap-6 md:grid-cols-3">
              {homeSolutionSection.items.map((item) => (
                <li
                  key={item.title.fr}
                  className="rounded-2xl border border-white/10 bg-[#0A0A0B]/50 p-6"
                >
                  <h3 className="font-display text-sm uppercase tracking-[0.2em] text-[#BC9746]">
                    {t(item.title, isFR)}
                  </h3>
                  <p className="mt-3 font-body text-sm leading-relaxed" style={{ color: WELCOME_MUTED }}>
                    {t(item.body, isFR)}
                  </p>
                </li>
              ))}
            </ul>
            <nav aria-label={isFR ? "Explorer AEGIS" : "Explore AEGIS"} className="mt-12 flex flex-wrap gap-3">
              {homeDiscoverLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="inline-flex min-h-11 items-center rounded-full border border-white/15 px-4 font-display text-[10px] uppercase tracking-[0.16em] text-[#D1D5DB] no-underline hover:border-[#BC9746]/50 hover:text-[#BC9746]"
                >
                  {t(link.label, isFR)}
                </Link>
              ))}
            </nav>
          </div>
        </section>

        <section
          id="logos-produit"
          aria-labelledby="welcome-logos-product-heading"
          className="border-t border-white/10 bg-black/15 py-16"
        >
          <div className="mx-auto max-w-3xl px-5 text-center sm:px-8">
            <h2 id="welcome-logos-product-heading" className="font-cormorant-display text-2xl text-white sm:text-3xl">
              {t(homeLogosSection.title, isFR)}
            </h2>
            <p className="mt-4 font-body text-sm leading-relaxed sm:text-base" style={{ color: WELCOME_MUTED }}>
              {t(homeLogosSection.body, isFR)}
            </p>
          </div>
        </section>

        <section
          id="pour-qui"
          aria-labelledby="welcome-audience-heading"
          className="border-b border-white/10 py-14"
        >
          <div className="mx-auto max-w-3xl px-5 text-center sm:px-8">
            <h2 id="welcome-audience-heading" className="font-display text-[10px] uppercase tracking-[0.28em] text-[#BC9746]">
              {t(homeAudienceSection.title, isFR)}
            </h2>
            <p className="mt-3 font-body text-base" style={{ color: WELCOME_MUTED }}>
              {t(homeAudienceSection.body, isFR)}
            </p>
          </div>
        </section>

        {/* —— DÉMO VOCALE —— */}
        <section
          id="demo-vocale"
          aria-labelledby="welcome-demo-heading"
          className="border-t border-white/10 bg-black/15 py-24"
        >
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="mx-auto max-w-xl text-center lg:max-w-2xl">
              <p className="font-display text-[10px] uppercase tracking-[0.32em] text-[#BC9746]">
                {isFR ? "Démo vocale" : "Voice demo"}
              </p>
              <h2
                id="welcome-demo-heading"
                className="mt-4 font-cormorant-display text-3xl text-white sm:text-4xl"
              >
                {isFR ? "LOGOS en action : entendez un arbitrage réel." : "LOGOS in action: hear a real trade-off."}
              </h2>
              <p className="mt-3 font-body text-sm leading-relaxed" style={{ color: WELCOME_MUTED }}>
                {isFR
                  ? "Extrait réel — tréso, associé, veto. Aucun document."
                  : "Real excerpt — cash, partner, veto. No documents."}
              </p>
            </div>
            <div className="mx-auto mt-12 max-w-xl">
              <SilentDemoPlayer locale={isFR ? "fr" : "en"} />
            </div>
          </div>
        </section>

        {/* —— CONTRAT VOCAL —— */}
        <section
          id="rupture-vocale"
          aria-labelledby="welcome-voice-heading"
          className="border-t border-white/10 bg-black/20 py-24"
        >
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="max-w-2xl">
              <h2
                id="welcome-voice-heading"
                className="font-cormorant-display text-3xl text-white sm:text-4xl"
              >
                {isFR ? "Pourquoi la voix ?" : "Why voice?"}
              </h2>
              <p className="mt-4 font-body text-base leading-relaxed" style={{ color: WELCOME_MUTED }}>
                {isFR
                  ? "Saisir du texte bride la pensée. Parler libère le réel."
                  : "Typing constrains thought. Speaking frees what is real."}
              </p>
            </div>

            <div className="mt-16 grid gap-8 md:grid-cols-3">
              {VOICE_CONTRACT_CARDS.map((card) => (
                <div
                  key={card.index}
                  className="rounded-2xl border border-white/10 bg-[#0A0A0B]/50 p-8 backdrop-blur-sm"
                >
                  <p className="font-display text-[10px] uppercase tracking-[0.28em] text-[#BC9746]">
                    {card.index}
                  </p>
                  <h3 className="mt-4 font-display text-lg text-white">{t(card.title, isFR)}</h3>
                  <p className="mt-3 font-body text-sm leading-relaxed" style={{ color: WELCOME_MUTED }}>
                    {t(card.body, isFR)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* —— MATRICE —— */}
        <section id="matrice" aria-labelledby="welcome-matrix-heading" className="py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <h2
              id="welcome-matrix-heading"
              className="max-w-2xl font-cormorant-display text-3xl text-white sm:text-4xl"
            >
              {isFR
                ? "Pourquoi un exocortex vocal plutôt qu'un coach ou un board ?"
                : "Why a vocal exocortex over a coach or board?"}
            </h2>

            <div className="mt-12 overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-white/15 font-display text-[10px] uppercase tracking-[0.2em] text-[#BC9746]">
                    <th className="pb-4 pr-4 font-normal">{isFR ? "Critères" : "Criteria"}</th>
                    <th className="pb-4 pr-4 font-normal">
                      {isFR ? "Conseil d'administration" : "Board"}
                    </th>
                    <th className="pb-4 pr-4 font-normal">
                      {isFR ? "Coach exécutif" : "Executive coach"}
                    </th>
                    <th className="pb-4 font-normal">LOGOS + AEGIS</th>
                  </tr>
                </thead>
                <tbody className="font-body" style={{ color: WELCOME_MUTED }}>
                  {VALUE_MATRIX_ROWS.map((row) => (
                    <tr key={t(row.criterion, isFR)} className="border-b border-white/10">
                      <th className="py-4 pr-4 font-medium text-white">
                        {t(row.criterion, isFR)}
                      </th>
                      <td className="py-4 pr-4">{t(row.board, isFR)}</td>
                      <td className="py-4 pr-4">{t(row.coach, isFR)}</td>
                      <td className="py-4 text-[#BC9746]">{t(row.logos, isFR)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* —— QUIZ —— */}
        <section id="quiz-tunnel" aria-labelledby="welcome-quiz-heading" className="border-t border-white/10 bg-black/20 py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
              <div>
                <h2 id="welcome-quiz-heading" className="font-cormorant-display text-3xl text-white sm:text-4xl">
                  {isFR ? "30 questions sur la personne qui décide." : "30 questions for the person who decides."}
                </h2>
                <p className="mt-4 font-body text-base" style={{ color: WELCOME_MUTED }}>
                  {isFR
                    ? "5 minutes pour cartographier vos 3 dynamiques fondamentales."
                    : "5 minutes to map your 3 core dynamics."}
                </p>
              </div>
              <ul className="space-y-4 font-body text-sm leading-relaxed" style={{ color: WELCOME_MUTED }}>
                {QUIZ_REVELATIONS.map((line) => (
                  <li key={line.fr}>
                    <GoldMark />
                    {t(line, isFR)}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-12">
              <button type="button" onClick={onStartAudit} className={primaryCtaClass} style={primaryCtaStyle}>
                {isFR ? "Lancer l'évaluation gratuite" : "Start free evaluation"}
                <ArrowRight size={14} aria-hidden />
              </button>
            </div>
          </div>
        </section>

        {/* —— CALCULATEURS —— */}
        <section id="calculateurs" aria-labelledby="welcome-tools-heading" className="py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <h2
              id="welcome-tools-heading"
              className="font-display text-[10px] uppercase tracking-[0.28em] text-[#BC9746]"
            >
              {isFR ? "Vous préférez des chiffres immédiats ?" : "Prefer instant numbers?"}
            </h2>
            <p className="mt-3 max-w-2xl font-body text-sm" style={{ color: WELCOME_MUTED }}>
              <Link to="/tools" className="text-[#BC9746] underline-offset-2 hover:underline">
                {isFR ? "Voir les 10 outils décisionnels" : "See all 10 decision tools"}
              </Link>
            </p>
            <ul className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {QUICK_TOOLS.map((tool) => (
                <li key={tool.href}>
                  <Link
                    to={tool.href.replace(/\/run$/, "")}
                    className="inline-flex min-h-11 items-center rounded-full border border-white/15 bg-white/5 px-5 py-2 font-display text-[10px] uppercase tracking-[0.16em] text-[#D1D5DB] no-underline transition-colors hover:border-[#BC9746]/50 hover:text-[#BC9746]"
                  >
                    {t(tool.label, isFR)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* —— OFFRES —— */}
        <section id="tarifs" aria-labelledby="welcome-pricing-heading" className="border-t border-white/10 bg-black/20 py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <h2 id="welcome-pricing-heading" className="sr-only">
              {isFR ? "Offres" : "Plans"}
            </h2>
            <CardGrid
              isFR={isFR}
              onStartAudit={onStartAudit}
              primaryCtaClass={primaryCtaClass}
              primaryCtaStyle={primaryCtaStyle}
            />
            <p className="mt-12 max-w-3xl font-body text-sm leading-relaxed" style={{ color: WELCOME_MUTED }}>
              {isFR ? (
                <>
                  <span className="text-[#BC9746]">Passerelle post-quiz :</span> vous avez terminé
                  vos 30 questions ? Débloquez votre rapport intégral et 45 min de sparring avec
                  LOGOS pour 149 € (100 % déductibles de la formule Fondateurs).
                </>
              ) : (
                <>
                  <span className="text-[#BC9746]">Post-quiz bridge:</span> finished your 30
                  questions? Unlock your full report and 45 min of LOGOS sparring for €149 (100%
                  deductible from the Founders plan).
                </>
              )}
            </p>
          </div>
        </section>

        {/* —— FAQ —— */}
        <section id="faq" aria-labelledby="welcome-faq-heading" className="py-24">
          <div className="mx-auto max-w-3xl px-5 sm:px-8">
            <h2 id="welcome-faq-heading" className="font-cormorant-display text-3xl text-white">
              FAQ
            </h2>
            <div className="mt-10 space-y-2">
              {homeFaqUi.map((item, idx) => {
                const open = openFaqIndex === idx;
                return (
                  <div
                    key={item.q.fr}
                    className="rounded-xl border border-white/10 bg-[#0A0A0B]/60"
                  >
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() => setOpenFaqIndex(open ? null : idx)}
                      className="flex min-h-14 w-full items-center justify-between gap-4 px-5 py-4 text-left"
                    >
                      <span className="font-display text-sm text-white">{t(item.q, isFR)}</span>
                      <ChevronDown
                        size={16}
                        className={`shrink-0 text-[#BC9746] transition-transform ${open ? "rotate-180" : ""}`}
                        aria-hidden
                      />
                    </button>
                    {open ? (
                      <p className="border-t border-white/10 px-5 pb-5 pt-4 font-body text-sm leading-relaxed" style={{ color: WELCOME_MUTED }}>
                        {t(item.a, isFR)}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/10 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 sm:flex-row sm:px-8">
          <span className="font-cinzel text-[10px] uppercase tracking-[0.28em] text-[#D1D5DB]/60">
            AEGIS — LOGOS · © Protocole Nomos
          </span>
          <div className="flex flex-wrap justify-center gap-5 font-display text-[10px] uppercase tracking-[0.2em]">
            <Link to="/tools" className="text-[#D1D5DB]/80 no-underline hover:text-white">
              {isFR ? "Outils" : "Tools"}
            </Link>
            <Link to="/pricing" className="text-[#D1D5DB]/80 no-underline hover:text-white">
              {isFR ? "Tarifs" : "Pricing"}
            </Link>
            <Link to="/newsletter" className="text-[#D1D5DB]/80 no-underline hover:text-white">
              Newsletter
            </Link>
            <Link to="/entreprise" className="text-[#D1D5DB]/80 no-underline hover:text-white">
              {isFR ? "Entreprise" : "Enterprise"}
            </Link>
            <Link to="/legal/privacy" className="text-[#D1D5DB]/80 no-underline hover:text-white">
              {isFR ? "Confidentialité" : "Privacy"}
            </Link>
          </div>
        </div>
      </footer>

      <div
        className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#0A0A0B]/95 p-3 backdrop-blur-md sm:hidden"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <button
          type="button"
          onClick={onStartAudit}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full border font-display text-[11px] uppercase tracking-[0.18em]"
          style={{
            borderColor: `${WELCOME_GOLD}55`,
            color: WELCOME_GOLD,
            backgroundColor: `${WELCOME_GOLD}18`,
          }}
        >
          {isFR ? "Évaluer ma lucidité (Quiz 30Q)" : "Assess my lucidity (30Q quiz)"}
          <ArrowRight size={14} aria-hidden />
        </button>
      </div>
    </div>
  );
};

function CardGrid({
  isFR,
  onStartAudit,
  primaryCtaClass,
  primaryCtaStyle,
}: {
  isFR: boolean;
  onStartAudit: () => void;
  primaryCtaClass: string;
  primaryCtaStyle: React.CSSProperties;
}) {
  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {PRICING_TIERS.map((tier) => (
        <div
          key={tier.id}
          className={`flex flex-col rounded-2xl border p-8 ${
            tier.recommended
              ? "border-[#BC9746]/45 bg-[#BC9746]/5"
              : "border-white/10 bg-[#0A0A0B]/50"
          }`}
        >
          {tier.recommended ? (
            <span className="mb-4 inline-block font-display text-[9px] uppercase tracking-[0.24em] text-[#BC9746]">
              {isFR ? "Recommandé" : "Recommended"}
            </span>
          ) : null}
          <h3 className="font-display text-lg text-white">{t(tier.name, isFR)}</h3>
          <p className="mt-4 flex items-baseline gap-1">
            <span className="font-display text-4xl tabular-nums text-white">{tier.price}</span>
            <span className="font-display text-[11px] uppercase tracking-wider text-[#D1D5DB]/70">
              {t(tier.period, isFR)}
            </span>
          </p>
          <ul className="my-8 flex-1 space-y-3 border-t border-white/10 pt-6 text-sm" style={{ color: WELCOME_MUTED }}>
            {tier.features.map((f) => (
              <li key={f.fr}>
                <GoldMark />
                {t(f, isFR)}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={onStartAudit}
            className={tier.recommended ? primaryCtaClass : `${primaryCtaClass} border-white/20 bg-white/5 text-white`}
            style={tier.recommended ? primaryCtaStyle : undefined}
          >
            {t(tier.cta, isFR)}
            <ArrowRight size={12} aria-hidden />
          </button>
          <Link
            to="/pricing"
            className="mt-3 text-center font-display text-[10px] uppercase tracking-[0.18em] text-[#D1D5DB]/60 no-underline hover:text-[#BC9746]"
          >
            {isFR ? "Détails sur /pricing" : "Details on /pricing"}
          </Link>
        </div>
      ))}
    </div>
  );
}