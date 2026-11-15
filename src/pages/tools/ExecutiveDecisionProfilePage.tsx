import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Activity, ArrowRight } from "lucide-react";
import AegisLogo from "@/components/AegisLogo";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import PublicFooter from "@/components/public/PublicFooter";
import { CeoProfileDialog } from "@/components/tools/CeoProfileDialog";
import {
  CEO_ARCHETYPE_LABELS,
  CEO_STAGE_LABELS,
  clearCeoProfile,
  getCeoProfile,
  type CeoProfile,
} from "@/lib/tools/ceoProfile";
import { getActiveMetaInsight } from "@/lib/tools/metaInsights";
import { loadToolSessions, type ToolSession } from "@/lib/tools/toolsMemory";
import { TOOLS_REGISTRY, getToolRunPath, type ToolId } from "@/components/tools/toolsRegistry";
import { toolsCanonicalPath } from "@/lib/toolsSite";
import {
  toolsBento,
  toolsBentoHover,
  toolsHeaderShell,
  toolsKicker,
  toolsLead,
  toolsPageShell,
  toolsTitle,
} from "@/components/tools/toolsDesign";
import "@/components/tools/tools-shell.css";

function formatSessionDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(
      new Date(iso),
    );
  } catch {
    return iso;
  }
}

function labelForTool(id: ToolId): string {
  return TOOLS_REGISTRY.find((t) => t.id === id)?.title ?? id;
}

export default function ExecutiveDecisionProfilePage() {
  const [profile, setProfile] = useState<CeoProfile | null>(() => getCeoProfile());
  const [editOpen, setEditOpen] = useState(false);

  const sessions = useMemo(() => loadToolSessions(), [profile, editOpen]);
  const metaInsight = useMemo(() => getActiveMetaInsight(), [sessions]);
  const fatigueTimeline = useMemo(
    () => sessions.filter((s) => s.toolId === "ceo-decision-fatigue-index").slice(0, 6).reverse(),
    [sessions],
  );

  const canonical = toolsCanonicalPath("/tools/profile");

  return (
    <div className={`tools-route ${toolsPageShell}`}>
      <Helmet>
        <title>Mon profil décisionnel | Outils AEGIS</title>
        <meta
          name="description"
          content="Profil dirigeant, historique des audits décisionnels et insights croisés entre les outils AEGIS."
        />
        <link rel="canonical" href={canonical} />
      </Helmet>

      <header className={toolsHeaderShell}>
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 md:px-6">
          <Link to="/tools" className="flex items-center gap-3">
            <AegisLogo variant="white" alt="AEGIS" className="h-9 w-9 rounded-lg object-contain" />
            <span className="font-cinzel text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
              Outils
            </span>
          </Link>
          <LanguageSwitcher />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-12 pb-20 md:px-6">
        <div className="flex items-center gap-3 text-primary">
          <Activity className="h-7 w-7" aria-hidden />
          <p className={toolsKicker}>Continuité</p>
        </div>
        <h1 className={`${toolsTitle} mt-4`}>Mon profil décisionnel</h1>
        <p className={`${toolsLead} mt-4 max-w-2xl`}>
          Vos seuils, benchmarks et historique d&apos;audits — local, sur cet appareil. Les outils s&apos;enrichissent
          au fil de vos passages.
        </p>

        {profile ? (
          <div className={`${toolsBento} mt-10`}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className={toolsKicker}>Profil calibré</p>
                <p className="mt-2 font-cormorant text-xl text-foreground">
                  {CEO_ARCHETYPE_LABELS[profile.archetype]}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {CEO_STAGE_LABELS[profile.stage]} · équipe {profile.teamSize} · {profile.decisionsPerWeek}{" "}
                  arbitrages/sem. · {profile.sleepHours}h sommeil
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setEditOpen(true)} className="btn-solaire min-h-[40px] px-4">
                  Modifier
                </button>
                <button
                  type="button"
                  onClick={() => {
                    clearCeoProfile();
                    setProfile(null);
                  }}
                  className="min-h-[40px] rounded-xl border border-border/50 px-4 font-cinzel text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
                >
                  Réinitialiser
                </button>
              </div>
            </div>

            {metaInsight ? (
              <p className="mt-6 border-t border-border/50 pt-6 text-sm text-foreground">
                <span className={toolsKicker}>Insight cross-outils — </span>
                {metaInsight}
              </p>
            ) : (
              <p className="mt-6 border-t border-border/50 pt-6 text-sm text-muted-foreground">
                Complétez deux outils ou plus (ex. fatigue + context switching) pour débloquer un insight croisé.
              </p>
            )}
          </div>
        ) : (
          <div className={`${toolsBento} mt-10`}>
            <p className="text-muted-foreground">
              Aucun profil enregistré. Les calculateurs utilisent des seuils génériques jusqu&apos;à calibration.
            </p>
            <button type="button" onClick={() => setEditOpen(true)} className="btn-solaire mt-6 min-h-[44px] px-5">
              Créer mon profil (2 min)
            </button>
          </div>
        )}

        {fatigueTimeline.length > 1 ? (
          <section className="mt-12">
            <p className={toolsKicker}>Évolution — fatigue décisionnelle</p>
            <ul className="mt-4 flex flex-wrap gap-3">
              {fatigueTimeline.map((s) => (
                <li
                  key={s.timestamp}
                  className="rounded-xl border border-border/50 bg-muted/40 px-4 py-3"
                >
                  <p className="font-display text-lg text-primary">
                    {typeof s.outputs.index === "number" ? s.outputs.index : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatSessionDate(s.timestamp)}</p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="mt-12">
          <p className={toolsKicker}>Historique des audits</p>
          {sessions.length === 0 ? (
            <p className={`${toolsLead} mt-4`}>Aucune session enregistrée pour l&apos;instant.</p>
          ) : (
            <ul className="mt-6 space-y-3">
              {sessions.slice(0, 12).map((s: ToolSession) => (
                <li
                  key={`${s.toolId}-${s.timestamp}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/50 bg-card/70 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {labelForTool(s.toolId)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatSessionDate(s.timestamp)}
                    </p>
                  </div>
                  <Link
                    to={getToolRunPath(s.toolId)}
                    className="text-[10px] font-medium uppercase tracking-[0.12em] text-primary hover:underline"
                  >
                    Relancer
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-12">
          <p className={toolsKicker}>Reprendre l&apos;audit</p>
          <Link
            to="/tools/ceo-decision-fatigue-index/run"
            className={`group mt-4 flex items-center justify-between ${toolsBento} ${toolsBentoHover}`}
          >
            <span className="text-sm font-semibold text-foreground group-hover:text-primary">
              Indice de fatigue décisionnelle CEO
            </span>
            <ArrowRight className="h-5 w-5 text-primary" aria-hidden />
          </Link>
        </section>
      </main>

      <PublicFooter />

      <CeoProfileDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        initial={profile}
        onSaved={(p) => setProfile(p)}
      />
    </div>
  );
}