import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import AegisLogo from "@/components/AegisLogo";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/i18n/LanguageContext";
import PublicFooter from "@/components/public/PublicFooter";
import { ToolSeoHelmet } from "./ToolSeoHelmet";
import { RelatedTools } from "./RelatedTools";
import { getOtherTools, type ToolRegistryEntry } from "./toolsRegistry";
import {
  toolsBento,
  toolsHeaderShell,
  toolsKicker,
  toolsLead,
  toolsPageShell,
  toolsProse,
  toolsTitle,
  publicBrandMark,
  toolsSectionHeading,
} from "./toolsDesign";
import type { HTMLAttributes, ReactNode } from "react";
import { ToolsBackToHubLink } from "./ToolsBackToHubLink";
import { ToolGuidePanel } from "./ToolGuidePanel";
import { CeoProfileBanner } from "./CeoProfileBanner";
import { CeoProfileDialog } from "./CeoProfileDialog";
import { useState } from "react";
import "./tools-shell.css";

interface ToolLayoutProps {
  tool: ToolRegistryEntry;
  children: ReactNode;
  seoContent: ReactNode;
  kicker?: string;
  /** Formulaire plein écran : masque l&apos;intro tant que les résultats ne sont pas atteints. */
  variant?: "wizard" | "document";
  wizardResultsVisible?: boolean;
}

export function ToolLayout({
  tool,
  children,
  seoContent,
  kicker,
  variant = "wizard",
  wizardResultsVisible = false,
}: ToolLayoutProps) {
  const { t } = useLanguage();
  const others = getOtherTools(tool.id);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const effectiveKicker = kicker ?? t("tools.kicker");

  return (
    <div className={toolsPageShell}>
      <div
        className="pointer-events-none absolute top-1/4 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-primary/6 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-neural-accent/5 blur-3xl"
        aria-hidden
      />
      <ToolSeoHelmet
        path={tool.path}
        seo={tool.seo}
        webAppName={tool.webAppName}
        faq={tool.faq}
      />

      <header className={toolsHeaderShell}>
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 md:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Link to="/" className="flex shrink-0 items-center gap-3">
              <AegisLogo alt="AEGIS" className="h-9 w-9 rounded-lg object-contain" />
              <span className={`hidden sm:inline ${publicBrandMark}`}>AEGIS</span>
            </Link>
            {variant === "wizard" ? (
              <Link
                to={tool.path}
                className="hidden text-xs font-medium text-muted-foreground hover:text-primary sm:inline"
              >
                {t("tools.toolSheet")}
              </Link>
            ) : null}
            {variant === "wizard" && <ToolsBackToHubLink className="hidden md:inline-flex" />}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <CeoProfileBanner className="hidden md:inline-flex" onEdit={() => setProfileDialogOpen(true)} />
            {variant === "wizard" && <ToolsBackToHubLink className="sm:hidden" />}
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <main
        className={
          variant === "wizard"
            ? "pb-0"
            : "mx-auto max-w-5xl px-4 py-10 pb-20 md:px-6"
        }
      >
        {variant === "document" ? (
          <>
            <nav
              aria-label={t("tools.breadcrumbAria")}
              className="mb-8 flex flex-wrap items-center gap-1 text-sm text-muted-foreground"
            >
              <Link to="/" className="hover:text-primary">
                {t("tools.homeTitle")}
              </Link>
              <ChevronRight className="h-3.5 w-3.5" aria-hidden />
              <Link to="/tools" className="hover:text-primary">
                {t("tools.hubTitle")}
              </Link>
              <ChevronRight className="h-3.5 w-3.5" aria-hidden />
              <span className="text-foreground/80">{tool.title}</span>
            </nav>

            <p className={toolsKicker}>{effectiveKicker}</p>
            <h1 className={`${toolsTitle} mt-3`}>{tool.title}</h1>
            <p className={`${toolsLead} mt-4 max-w-3xl`}>{tool.shortDescription}</p>
            <ToolGuidePanel guide={tool.guide} variant="compact" className="mt-6" />

            <div className={`${toolsBento} mt-10`} role="region" aria-label={t("tools.interactiveCalculator")}>
              {children}
            </div>
          </>
        ) : (
          <MotionFull role="region" aria-label={t("tools.interactiveCalculator")}>
            {children}
          </MotionFull>
        )}

        {variant === "document" || wizardResultsVisible ? (
          <>
            <article
              className={`${toolsProse} ${variant === "wizard" ? "mx-auto max-w-5xl px-4 pt-16 md:px-6" : ""} mt-14`}
            >
              {seoContent}
            </article>

            <section
              className={`${toolsBento} ${variant === "wizard" ? "mx-4 md:mx-auto md:max-w-5xl" : ""} mt-12`}
            >
              <h2 className={toolsSectionHeading}>{t("tools.faqTitle")}</h2>
              <dl className="mt-6 space-y-6">
                {tool.faq.map((item) => (
                  <div key={item.question}>
                    <dt className="text-sm font-semibold text-foreground">
                      {item.question}
                    </dt>
                    <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {item.answer}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>

            <div className={variant === "wizard" ? "mx-auto max-w-5xl px-4 pb-20 md:px-6" : ""}>
              <RelatedTools tools={others} />
            </div>
          </>
        ) : null}
      </main>

      {variant === "document" || wizardResultsVisible ? <PublicFooter /> : null}
      <CeoProfileDialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen} />
    </div>
  );
}

function MotionFull({
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className="w-full" {...rest}>
      {children}
    </div>
  );
}