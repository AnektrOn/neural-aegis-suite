import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Calculator, UserRound } from "lucide-react";
import AegisLogo from "@/components/AegisLogo";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import PublicFooter from "@/components/public/PublicFooter";
import { getAllTools } from "@/components/tools/toolsRegistry";
import { ToolHubCard } from "@/components/tools/ToolHubCard";
import { CeoProfileDialog } from "@/components/tools/CeoProfileDialog";
import { getActiveMetaInsight } from "@/lib/tools/metaInsights";
import { hasCeoProfile } from "@/lib/tools/ceoProfile";
import { toolsCanonicalPath } from "@/lib/toolsSite";
import { SeoHelmet } from "@/seo/SeoHelmet";
import { TOOL_TO_BLOG, TOOLS_HUB_FAQ, TOOLS_HUB_SEO_COPY } from "@/seo/seoPages";
import "@/components/tools/tools-shell.css";
import {
  toolsBento,
  toolsBentoHover,
  toolsHeaderShell,
  toolsKicker,
  toolsLead,
  toolsPageShell,
  toolsSecondaryButton,
  toolsTitle,
  publicBrandMark,
  toolsPrimaryButton,
} from "@/components/tools/toolsDesign";

export default function ToolsHubPage() {
  const canonical = toolsCanonicalPath("/tools");
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const metaInsight = getActiveMetaInsight();
  const tools = getAllTools();

  useEffect(() => {
    if (!hasCeoProfile()) {
      setProfileDialogOpen(true);
    }
  }, []);

  return (
    <div className={toolsPageShell}>
      <SeoHelmet
        variant="page"
        title={TOOLS_HUB_SEO_COPY.title}
        description={TOOLS_HUB_SEO_COPY.description}
        canonical={canonical}
        pageName={TOOLS_HUB_SEO_COPY.h1}
        faq={TOOLS_HUB_FAQ}
      />

      <div
        className="pointer-events-none absolute top-1/4 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-primary/6 blur-3xl"
        aria-hidden
      />

      <header className={`relative ${toolsHeaderShell}`}>
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 md:px-6">
          <Link to="/" className="flex items-center gap-3">
            <AegisLogo alt="AEGIS" className="h-9 w-9 rounded-lg object-contain" />
            <span className={publicBrandMark}>AEGIS</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/tools/profile" className={toolsSecondaryButton}>
              <UserRound className="h-3.5 w-3.5" aria-hidden />
              Mon profil
            </Link>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-5xl px-4 py-12 pb-20 md:px-6">
        <div className="flex items-center gap-3 text-primary">
          <Calculator className="h-7 w-7" aria-hidden />
          <p className={toolsKicker}>Outils gratuits pour dirigeants</p>
        </div>
        <h1 className={`${toolsTitle} mt-4`}>{TOOLS_HUB_SEO_COPY.h1}</h1>
        <blockquote className="mt-4 max-w-3xl border-l-2 border-primary/40 pl-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
          {TOOLS_HUB_SEO_COPY.tldr}
        </blockquote>
        <p className={`${toolsLead} mt-4 max-w-3xl leading-relaxed`}>{TOOLS_HUB_SEO_COPY.intro}</p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link to="/quiz" className={toolsPrimaryButton}>
            Passer le diagnostic AEGIS (30 questions)
          </Link>
          <Link to="/" className={toolsSecondaryButton}>
            Retour à l&apos;accueil
          </Link>
        </div>

        {!hasCeoProfile() ? (
          <button
            type="button"
            onClick={() => setProfileDialogOpen(true)}
            className={`${toolsBento} ${toolsBentoHover} mt-8 w-full text-left`}
          >
            <p className={toolsKicker}>Personnalisation</p>
            <p className="mt-2 text-lg font-semibold text-foreground">Calibrer vos benchmarks (2 min)</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Sans profil, les seuils restent génériques. Avec profil : percentiles, diagnostics narratifs et
              insights croisés entre outils.
            </p>
          </button>
        ) : metaInsight ? (
          <HubInsight insight={metaInsight} />
        ) : null}

        <section aria-labelledby="tools-catalog-heading" className="mt-12">
          <h2 id="tools-catalog-heading" className="sr-only">
            Catalogue des outils
          </h2>
          <ul className="grid gap-6 sm:grid-cols-2">
            {tools.map((tool) => (
              <li key={tool.id}>
                <ToolHubCard tool={tool} />
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="tools-detail-heading" className="mt-16">
          <h2 id="tools-detail-heading" className="text-xl font-semibold text-foreground">
            Problème, bénéfice et liens
          </h2>
          <ul className="mt-6 space-y-8">
            {tools.map((tool) => {
              const blog = TOOL_TO_BLOG[tool.id];
              return (
                <li key={tool.id} className={`${toolsBento} p-6`}>
                  <h3 className="text-lg font-semibold text-foreground">{tool.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    <strong className="text-foreground">Problème :</strong> {tool.hubBlurb}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    <strong className="text-foreground">Bénéfice :</strong> {tool.shortDescription}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3 text-[11px] font-medium uppercase tracking-[0.14em]">
                    <Link to={tool.path} className="text-primary hover:underline">
                      Fiche outil
                    </Link>
                    <Link to={`${tool.path}/run`} className="text-muted-foreground hover:text-primary">
                      Lancer
                    </Link>
                    {blog ? (
                      <Link to={blog.path} className="text-muted-foreground hover:text-primary">
                        {blog.label}
                      </Link>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-labelledby="tools-faq-heading" className="mt-16">
          <h2 id="tools-faq-heading" className="text-xl font-semibold text-foreground">
            Questions fréquentes
          </h2>
          <dl className="mt-6 space-y-6">
            {TOOLS_HUB_FAQ.map((item) => (
              <div key={item.question}>
                <dt className="font-medium text-foreground">{item.question}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.answer}</dd>
              </div>
            ))}
          </dl>
        </section>
      </main>

      <PublicFooter />

      <CeoProfileDialog
        open={profileDialogOpen}
        onOpenChange={setProfileDialogOpen}
        dismissible={hasCeoProfile()}
      />
    </div>
  );
}

function HubInsight({ insight }: { insight: string }) {
  return (
    <div className={`${toolsBento} mt-8 border-primary/25`}>
      <p className={toolsKicker}>Insight cross-outils</p>
      <p className="mt-3 text-sm leading-relaxed text-foreground">{insight}</p>
      <Link
        to="/tools/profile"
        className="mt-4 inline-flex text-[10px] font-medium uppercase tracking-[0.14em] text-primary hover:underline"
      >
        Voir l&apos;historique complet
      </Link>
    </div>
  );
}