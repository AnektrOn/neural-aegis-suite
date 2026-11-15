import { Link, Navigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowRight, ChevronRight, Play } from "lucide-react";
import AegisLogo from "@/components/AegisLogo";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import PublicFooter from "@/components/public/PublicFooter";
import { ToolGuidePanel } from "@/components/tools/ToolGuidePanel";
import { RelatedTools } from "@/components/tools/RelatedTools";
import { ToolSeoHelmet } from "@/components/tools/ToolSeoHelmet";
import {
  getOtherTools,
  getToolById,
  getToolRunPath,
  isToolId,
} from "@/components/tools/toolsRegistry";
import { toolsCanonicalPath } from "@/lib/toolsSite";
import {
  toolsBento,
  toolsHeaderShell,
  toolsKicker,
  toolsLead,
  toolsPageShell,
  toolsPrimaryButton,
  toolsTitle,
} from "@/components/tools/toolsDesign";
import "@/components/tools/tools-shell.css";

export default function ToolIntroPage() {
  const { toolId } = useParams<{ toolId: string }>();

  if (!toolId || !isToolId(toolId)) {
    return <Navigate to="/tools" replace />;
  }

  const tool = getToolById(toolId);
  const runPath = getToolRunPath(toolId);
  const others = getOtherTools(toolId);
  const canonical = toolsCanonicalPath(tool.path);

  return (
    <div className={`tools-route ${toolsPageShell}`}>
      <ToolSeoHelmet
        path={tool.path}
        seo={tool.seo}
        webAppName={tool.webAppName}
        faq={tool.faq}
      />
      <Helmet>
        <link rel="canonical" href={canonical} />
      </Helmet>

      <div
        className="pointer-events-none absolute top-1/4 left-1/2 h-[380px] w-[380px] -translate-x-1/2 rounded-full bg-primary/6 blur-3xl"
        aria-hidden
      />

      <header className={`relative ${toolsHeaderShell}`}>
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4 md:px-6">
          <Link to="/tools" className="flex items-center gap-3">
            <AegisLogo alt="AEGIS" className="h-9 w-9 rounded-lg object-contain" />
            <span className="font-display text-[10px] font-medium uppercase tracking-[0.2em] text-primary">
              Outils
            </span>
          </Link>
          <LanguageSwitcher />
        </div>
      </header>

      <main className="relative mx-auto max-w-3xl px-4 py-10 pb-16 md:px-6">
        <nav
          aria-label="Fil d'Ariane"
          className="mb-8 flex flex-wrap items-center gap-1 text-sm text-muted-foreground"
        >
          <Link to="/" className="hover:text-primary">
            Accueil
          </Link>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          <Link to="/tools" className="hover:text-primary">
            Outils
          </Link>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          <span className="text-foreground/80">{tool.title}</span>
        </nav>

        <p className={toolsKicker}>Fiche outil</p>
        <h1 className={`${toolsTitle} mt-3`}>{tool.title}</h1>
        <p className="mt-3 text-lg font-medium text-primary">{tool.hubBlurb}</p>
        <p className={`${toolsLead} mt-4`}>{tool.shortDescription}</p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link to={runPath} className={toolsPrimaryButton}>
            <Play className="h-4 w-4" aria-hidden />
            Lancer le calculateur
            <span className="text-primary-foreground/80">
              ({tool.guide.durationLabel}, {tool.guide.questionCount} étapes)
            </span>
          </Link>
          <p className="text-xs text-muted-foreground">Gratuit · sans compte · résultats immédiats</p>
        </div>


        <section className={`${toolsBento} mt-10`}>
          <h2 className="font-display text-xl font-semibold text-foreground">Questions fréquentes</h2>
          <dl className="mt-6 space-y-6">
            {tool.faq.map((item) => (
              <div key={item.question}>
                <dt className="text-sm font-semibold text-foreground">{item.question}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.answer}</dd>
              </div>
            ))}
          </dl>
        </section>

        <div className="mt-10 flex justify-center">
          <Link to={runPath} className={`${toolsPrimaryButton} w-full sm:w-auto`}>
            Commencer maintenant
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        <RelatedTools tools={others} />
      </main>

      <PublicFooter />
    </div>
  );
}