import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import AegisLogo from "@/components/AegisLogo";
import LanguageSwitcher from "@/components/LanguageSwitcher";
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
} from "./toolsDesign";
import type { HTMLAttributes, ReactNode } from "react";
import { ToolsBackToHubLink } from "./ToolsBackToHubLink";
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
  kicker = "Outils décisionnels",
  variant = "wizard",
  wizardResultsVisible = false,
}: ToolLayoutProps) {
  const others = getOtherTools(tool.id);

  return (
    <div className={`tools-obsidian-shell ${toolsPageShell}`}>
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
              <AegisLogo variant="white" alt="AEGIS" className="h-9 w-9 rounded-lg object-contain" />
              <span className="hidden font-cinzel text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--aegis-gold)] sm:inline">
                AEGIS
              </span>
            </Link>
            {variant === "wizard" && <ToolsBackToHubLink className="hidden sm:inline-flex" />}
          </div>
          <div className="flex shrink-0 items-center gap-2">
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
              aria-label="Fil d'Ariane"
              className="mb-8 flex flex-wrap items-center gap-1 font-body text-sm text-[color:var(--aegis-ink-subtle)]"
            >
              <Link to="/" className="hover:text-[color:var(--aegis-gold)]">
                Accueil
              </Link>
              <ChevronRight className="h-3.5 w-3.5" aria-hidden />
              <Link to="/tools" className="hover:text-[color:var(--aegis-gold)]">
                Outils
              </Link>
              <ChevronRight className="h-3.5 w-3.5" aria-hidden />
              <span className="text-[color:var(--aegis-ink-muted)]">{tool.title}</span>
            </nav>

            <p className={toolsKicker}>{kicker}</p>
            <h1 className={`${toolsTitle} mt-3`}>{tool.title}</h1>
            <p className={`${toolsLead} mt-4 max-w-3xl`}>{tool.shortDescription}</p>

            <div className={`${toolsBento} mt-10`} role="region" aria-label="Calculateur interactif">
              {children}
            </div>
          </>
        ) : (
          <motionFull role="region" aria-label="Calculateur interactif">
            {children}
          </motionFull>
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
              <h2 className="font-cormorant text-2xl font-light text-[color:var(--aegis-ink)]">
                Questions fréquentes
              </h2>
              <dl className="mt-6 space-y-6">
                {tool.faq.map((item) => (
                  <div key={item.question}>
                    <dt className="font-barlow text-sm font-semibold text-[color:var(--aegis-ink)]">
                      {item.question}
                    </dt>
                    <dd className="mt-2 font-body text-sm leading-relaxed text-[color:var(--aegis-ink-muted)]">
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
    </div>
  );
}

function motionFull({
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className="w-full" {...rest}>
      {children}
    </div>
  );
}