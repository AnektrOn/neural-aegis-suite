import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowRight, Calculator } from "lucide-react";
import AegisLogo from "@/components/AegisLogo";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import PublicFooter from "@/components/public/PublicFooter";
import { TOOLS_REGISTRY } from "@/components/tools/toolsRegistry";
import { toolsCanonicalPath } from "@/lib/toolsSite";
import "@/components/tools/tools-shell.css";
import {
  toolsBento,
  toolsBentoHover,
  toolsHeaderShell,
  toolsKicker,
  toolsLead,
  toolsPageShell,
  toolsTitle,
} from "@/components/tools/toolsDesign";

const HUB_TITLE = "Outils décisionnels gratuits pour dirigeants | AEGIS";
const HUB_DESCRIPTION =
  "Cinq micro-outils : coaching, réseaux de pairs, second brain, risque IA cloud et run-rate SaaS. Calculez en temps réel et comparez avec un exocortex AEGIS.";

export default function ToolsHubPage() {
  const canonical = toolsCanonicalPath("/tools");

  return (
    <div className={`tools-obsidian-shell ${toolsPageShell} min-h-screen`}>
      <Helmet>
        <title>{HUB_TITLE}</title>
        <meta name="description" content={HUB_DESCRIPTION} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={HUB_TITLE} />
        <meta property="og:description" content={HUB_DESCRIPTION} />
        <meta property="og:url" content={canonical} />
        <meta name="theme-color" content="#0b0b0a" />
      </Helmet>

      <header className={toolsHeaderShell}>
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 md:px-6">
          <Link to="/" className="flex items-center gap-3">
            <AegisLogo variant="white" alt="AEGIS" className="h-9 w-9 rounded-lg object-contain" />
            <span className="font-cinzel text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--aegis-gold)]">
              AEGIS
            </span>
          </Link>
          <LanguageSwitcher />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-12 pb-20 md:px-6">
        <div className="flex items-center gap-3 text-[color:var(--aegis-gold)]">
          <Calculator className="h-7 w-7" aria-hidden />
          <p className={toolsKicker}>Engineering as Marketing</p>
        </div>
        <h1 className={`${toolsTitle} mt-4`}>Outils décisionnels pour dirigeants</h1>
        <p className={`${toolsLead} mt-4 max-w-2xl`}>{HUB_DESCRIPTION}</p>

        <ul className="mt-12 grid gap-6 sm:grid-cols-2">
          {TOOLS_REGISTRY.map((tool) => (
            <li key={tool.id}>
              <Link
                to={tool.path}
                className={`group flex h-full flex-col ${toolsBento} ${toolsBentoHover}`}
              >
                <h2 className="font-cormorant text-xl font-light text-[color:var(--aegis-ink)] group-hover:text-[color:var(--aegis-gold)]">
                  {tool.title}
                </h2>
                <p className="mt-2 flex-1 font-body text-sm text-[color:var(--aegis-ink-muted)]">
                  {tool.hubBlurb}
                </p>
                <span className="mt-6 inline-flex items-center font-cinzel text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--aegis-gold)]">
                  Lancer le calculateur
                  <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-0.5" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </main>

      <PublicFooter />
    </div>
  );
}