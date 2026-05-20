import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Scale,
  Sun,
  Moon,
  ChevronLeft,
  Sparkles,
  BookOpen,
  FileText,
  Layers,
  Users,
  Loader2,
} from "lucide-react";
import { PageWrapper } from "@/components/PageWrapper";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { NeuralCard } from "@/components/ui/neural-card";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import type { AnalysisMode, ArchetypePole } from "@/lib/archetype-cartography/types";
import {
  modeToPath,
  parseModeParam,
  parsePoleParam,
  poleToPath,
} from "@/lib/archetype-cartography/registry";
import { POLE_THEMES } from "@/lib/archetype-cartography/pole-theme";
import { CartographyEmptyState } from "@/components/archetype-balance/CartographyEmptyState";
import { CartographyMarkdownPanel } from "@/components/archetype-balance/CartographyMarkdownPanel";
import {
  fetchPublishedCartographyBundle,
  type DbCartographyBundle,
} from "@/services/cartographyService";

type MainTab = "cartographie" | "guardians" | "synthesis" | "detailed";

const POLES: ArchetypePole[] = ["balance", "light", "shadow"];
const MODES: AnalysisMode[] = ["analyse", "clinique"];

function PoleIcon({ pole, className }: { pole: ArchetypePole; className?: string }) {
  const props = { size: 16, strokeWidth: 1.5, className, "aria-hidden": true as const };
  if (pole === "light") return <Sun {...props} />;
  if (pole === "shadow") return <Moon {...props} />;
  return <Scale {...props} />;
}

function metaString(meta: Record<string, unknown>, key: string, fallback = ""): string {
  const v = meta[key];
  return typeof v === "string" ? v : fallback;
}

export default function ArchetypeCartographyReport() {
  const { pole: poleParam, mode: modeParam } = useParams<{ pole?: string; mode?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, locale } = useLanguage();
  const isFR = locale === "fr";

  const pole = parsePoleParam(poleParam) ?? "balance";
  const mode = parseModeParam(modeParam) ?? "analyse";
  const theme = POLE_THEMES[pole];

  const [bundle, setBundle] = useState<DbCartographyBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [mainTab, setMainTab] = useState<MainTab>("cartographie");

  useEffect(() => {
    if (!parsePoleParam(poleParam)) {
      navigate("/cartographie/balance/analyse", { replace: true });
    }
  }, [poleParam, navigate]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoading(true);
    fetchPublishedCartographyBundle(user.id, pole, mode)
      .then((data) => {
        if (!cancelled) setBundle(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, pole, mode]);

  const grouped = useMemo(() => {
    if (!bundle) return null;
    const detailed = bundle.sections
      .filter((s) => s.sectionKey === "detailed" && s.reportCode)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    return {
      cartographie: bundle.sections.filter((s) => s.sectionKey === "cartographie"),
      guardians: bundle.sections.filter((s) => s.sectionKey === "guardians"),
      synthesis: bundle.sections.filter((s) => s.sectionKey === "synthesis"),
      detailed,
    };
  }, [bundle]);

  useEffect(() => {
    if (!grouped) return;
    if (grouped.cartographie.length) setMainTab("cartographie");
    else if (grouped.synthesis.length) setMainTab("synthesis");
    else if (grouped.detailed.length) setMainTab("detailed");
    else if (grouped.guardians.length) setMainTab("guardians");
  }, [grouped]);

  const goPole = (p: ArchetypePole) => {
    navigate(`/cartographie/${poleToPath(p)}/${modeToPath(mode)}`);
  };

  const goMode = (m: AnalysisMode) => {
    navigate(`/cartographie/${poleToPath(pole)}/${modeToPath(m)}`);
  };

  const meta = bundle?.meta ?? {};
  const formattedDate = useMemo(() => {
    const d = metaString(meta, "date");
    if (!d) return "—";
    try {
      return new Date(d).toLocaleDateString(isFR ? "fr-FR" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return d;
    }
  }, [meta, isFR]);

  const hasContent = bundle && bundle.sections.length > 0;
  const poleLabel = theme[isFR ? "labelFr" : "labelEn"];

  return (
    <PageWrapper className="pb-24">
      <div className="relative mx-auto max-w-3xl px-4 pt-2 sm:px-6">
        <Link
          to="/deep-dive"
          className="mb-4 inline-flex min-h-[44px] items-center gap-2 rounded-md px-1 -ml-1 text-xs uppercase tracking-[0.18em] text-text-tertiary transition-colors hover:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronLeft size={16} strokeWidth={1.5} aria-hidden />
          {t("balanceReport.back")}
        </Link>

        <div className="mb-4 space-y-2">
          <p className="text-[10px] font-display uppercase tracking-[0.22em] text-text-tertiary">
            {t("cartography.matrixLabel")}
          </p>
          <div
            className="grid grid-cols-3 gap-1.5 rounded-xl bg-white/[0.04] p-1"
            role="tablist"
            aria-label={t("cartography.poleNavAria")}
          >
            {POLES.map((p) => {
              const th = POLE_THEMES[p];
              const active = pole === p;
              return (
                <button
                  key={p}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => goPole(p)}
                  className={cn(
                    "flex min-h-[44px] flex-col items-center justify-center gap-1 rounded-lg border px-2 py-2 text-[10px] uppercase tracking-[0.1em] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? th.navActiveClass
                      : "border-transparent text-text-tertiary hover:bg-white/[0.04]",
                  )}
                >
                  <PoleIcon pole={p} />
                  {th[isFR ? "labelFr" : "labelEn"]}
                </button>
              );
            })}
          </div>
          <div
            className="grid grid-cols-2 gap-1.5 rounded-xl bg-white/[0.04] p-1"
            role="tablist"
            aria-label={t("cartography.modeNavAria")}
          >
            {MODES.map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                onClick={() => goMode(m)}
                className={cn(
                  "min-h-[44px] rounded-lg text-xs uppercase tracking-[0.12em] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  mode === m
                    ? "bg-[hsl(var(--aegis-s1))] text-text-primary"
                    : "text-text-tertiary hover:bg-white/[0.04]",
                )}
              >
                {m === "clinique" ? t("cartography.modeClinical") : t("cartography.modeStandard")}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-text-tertiary" aria-hidden />
          </div>
        )}

        {!loading && !hasContent && (
          <CartographyEmptyState pole={pole} mode={mode} locale={locale} />
        )}

        {!loading && hasContent && bundle && grouped && (
          <>
            <header
              className={cn(
                "relative overflow-hidden rounded-[20px] border bg-gradient-to-br from-[hsl(var(--aegis-hero-bg))] via-[hsl(var(--aegis-s1))] to-[hsl(var(--aegis-hero-fade))] p-5 sm:p-6",
                theme.borderClass,
              )}
            >
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border",
                    theme.borderClass,
                  )}
                  style={{ background: `hsl(var(${theme.accentMutedVar}) / 0.5)` }}
                >
                  <PoleIcon pole={pole} className={`text-[hsl(var(${theme.accentVar}))]`} />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-display uppercase tracking-[0.28em] text-text-tertiary">
                    {metaString(meta, "subtitle", `${poleLabel} · ${mode}`)}
                  </p>
                  <h1 className="mt-1 font-display text-xl uppercase tracking-[0.08em] text-text-primary sm:text-2xl">
                    {metaString(meta, "title", t("cartography.defaultTitle"))}
                  </h1>
                </div>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <MetaItem
                  label={metaString(meta, "user_label", isFR ? "Utilisateur" : "User")}
                  value={metaString(meta, "user_value", "—")}
                />
                <MetaItem label={isFR ? "Date" : "Date"} value={formattedDate} />
                <MetaItem
                  label={isFR ? "Stade" : "Stage"}
                  value={metaString(meta, "stage", "—")}
                />
              </div>
              <Badge variant="outline" className={cn("mt-4 text-[10px] uppercase tracking-[0.15em]", theme.badgeClass)}>
                {t("balanceReport.pole")} {metaString(meta, "pole_label", poleLabel.toUpperCase())}
              </Badge>
            </header>

            <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as MainTab)} className="mt-6">
              <TabsList className="flex h-auto w-full flex-wrap gap-1 rounded-xl bg-white/[0.04] p-1">
                {grouped.cartographie.length > 0 && (
                  <TabsTrigger value="cartographie" className="min-h-[44px] gap-2 rounded-lg">
                    <Layers size={14} aria-hidden />
                    <span className="text-xs uppercase tracking-[0.1em]">
                      {t("cartography.tabCartography")}
                    </span>
                  </TabsTrigger>
                )}
                {grouped.guardians.length > 0 && (
                  <TabsTrigger value="guardians" className="min-h-[44px] gap-2 rounded-lg">
                    <Users size={14} aria-hidden />
                    <span className="text-xs uppercase tracking-[0.1em]">
                      {t("balanceReport.tabGuardians")}
                    </span>
                  </TabsTrigger>
                )}
                {grouped.synthesis.length > 0 && (
                  <TabsTrigger value="synthesis" className="min-h-[44px] gap-2 rounded-lg">
                    <BookOpen size={14} aria-hidden />
                    <span className="text-xs uppercase tracking-[0.1em]">
                      {t("cartography.tabSynthesis")}
                    </span>
                  </TabsTrigger>
                )}
                {grouped.detailed.length > 0 && (
                  <TabsTrigger value="detailed" className="min-h-[44px] gap-2 rounded-lg">
                    <FileText size={14} aria-hidden />
                    <span className="text-xs uppercase tracking-[0.1em]">
                      {t("cartography.tabDetailed")}
                    </span>
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="cartographie" className="mt-5 space-y-4">
                <SectionLabel text={t("balanceReport.housesTitle")} />
                {grouped.cartographie.map((s) => (
                  <SectionCard key={s.id} title={s.title}>
                    <CartographyMarkdownPanel markdown={s.markdown} />
                  </SectionCard>
                ))}
              </TabsContent>

              <TabsContent value="guardians" className="mt-5 space-y-4">
                <SectionLabel text={t("balanceReport.guardiansTitle")} />
                {grouped.guardians.map((s) => (
                  <SectionCard key={s.id} title={s.title}>
                    <CartographyMarkdownPanel markdown={s.markdown} />
                  </SectionCard>
                ))}
              </TabsContent>

              <TabsContent value="synthesis" className="mt-5 space-y-4">
                <SectionLabel text={t("cartography.synthesisIntro")} />
                {grouped.synthesis.map((s) => (
                  <SectionCard key={s.id} title={s.title}>
                    <CartographyMarkdownPanel markdown={s.markdown} />
                  </SectionCard>
                ))}
              </TabsContent>

              <TabsContent value="detailed" className="mt-5 space-y-4">
                <SectionLabel text={t("cartography.detailedIntro")} />
                {grouped.detailed.map((s) => (
                  <SectionCard key={s.id} title={s.title ?? s.reportCode.toUpperCase()}>
                    <CartographyMarkdownPanel markdown={s.markdown} />
                  </SectionCard>
                ))}
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </PageWrapper>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border-subtle/50 bg-white/[0.03] px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-[0.18em] text-text-tertiary">{label}</p>
      <p className="mt-1 text-sm text-text-primary">{value}</p>
    </div>
  );
}

function SectionLabel({ text }: { text: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <Sparkles size={14} strokeWidth={1.5} className="text-text-tertiary" aria-hidden />
      <h2 className="text-xs font-display uppercase tracking-[0.2em] text-text-tertiary">{text}</h2>
    </div>
  );
}

function SectionCard({ title, children }: { title: string | null; children: ReactNode }) {
  return (
    <NeuralCard variant="premium" glow="warm" className="p-4 sm:p-5">
      {title && (
        <h3 className="mb-4 font-display text-sm uppercase tracking-[0.1em] text-text-primary">
          {title}
        </h3>
      )}
      {children}
    </NeuralCard>
  );
}
