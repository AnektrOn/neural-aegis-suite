import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
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
} from "@/components/tools/toolsDesign";

const HUB_TITLE = "10 outils décisionnels gratuits pour CEO & fondateurs | AEGIS";
const HUB_DESCRIPTION =
  "Dix micro-outils pour dirigeants : fatigue décisionnelle, biais, coût de l'inaction, priorisation, context switching, coaching, pairs, second brain, IA cloud et stack SaaS.";

export default function ToolsHubPage() {
  const canonical = toolsCanonicalPath("/tools");
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const metaInsight = getActiveMetaInsight();

  useEffect(() => {
    if (!hasCeoProfile()) {
      setProfileDialogOpen(true);
    }
  }, []);

  return (
    <div className={`tools-route ${toolsPageShell}`}>
      <Helmet>
        <title>{HUB_TITLE}</title>
        <meta name="description" content={HUB_DESCRIPTION} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={HUB_TITLE} />
        <meta property="og:description" content={HUB_DESCRIPTION} />
        <meta property="og:url" content={canonical} />
      </Helmet>

      <div
        className="pointer-events-none absolute top-1/4 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-primary/6 blur-3xl"
        aria-hidden
      />

      <header className={`relative ${toolsHeaderShell}`}>
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 md:px-6">
          <Link to="/" className="flex items-center gap-3">
            <AegisLogo alt="AEGIS" className="h-9 w-9 rounded-lg object-contain" />
            <span className="font-display text-[10px] font-medium uppercase tracking-[0.2em] text-primary">
              AEGIS
            </span>
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
          <p className={toolsKicker}>Engineering as Marketing</p>
        </div>
        <h1 className={`${toolsTitle} mt-4`}>Outils décisionnels pour dirigeants</h1>
        <p className={`${toolsLead} mt-4 max-w-2xl`}>{HUB_DESCRIPTION}</p>
        <p className="mt-4 max-w-2xl text-sm text-muted-foreground">
          Ouvrez une fiche pour tout le détail, puis lancez le calculateur quand vous êtes prêt. Gratuit, sans
          compte.
        </p>

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

        <ul className="mt-12 grid gap-6 sm:grid-cols-2">
          {getAllTools().map((tool) => (
            <li key={tool.id}>
              <ToolHubCard tool={tool} />
            </li>
          ))}
        </ul>
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