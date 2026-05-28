import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Scale,
  Sun,
  Moon,
  ChevronLeft,
  BookOpen,
  FileText,
  Layers,
  Users,
  Loader2,
} from "lucide-react";
import { PageWrapper } from "@/components/PageWrapper";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
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
import {
  CartographyFileList,
  CartographyStructuredReport,
} from "@/components/archetype-balance/CartographyStructuredReport";
import { parseBundleToDisplay, isCartographyIndexMarkdown, detectCartographyContentLocale } from "@/lib/cartography-markdown-parse";
import { useAdmin } from "@/hooks/use-admin";
import {
  fetchCartographyBundleAdmin,
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
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
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

  const previewUserId = searchParams.get("user");
  const targetUserId =
    isAdmin && previewUserId ? previewUserId : user?.id ?? null;

  useEffect(() => {
    if (!targetUserId) return;
    let cancelled = false;
    setLoading(true);
    const load =
      isAdmin && previewUserId
        ? fetchCartographyBundleAdmin(targetUserId, pole, mode)
        : fetchPublishedCartographyBundle(targetUserId, pole, mode);

    load
      .then((data) => {
        if (!cancelled) setBundle(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [targetUserId, pole, mode, isAdmin, previewUserId]);

  const grouped = useMemo(() => {
    if (!bundle) return null;
    const detailed = bundle.sections
      .filter((s) => s.sectionKey === "detailed" && s.reportCode)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const cartographie = bundle.sections.filter(
      (s) =>
        s.sectionKey === "cartographie" &&
        !isCartographyIndexMarkdown(s.markdown, s.title),
    );
    return {
      cartographie,
      guardians: bundle.sections.filter((s) => s.sectionKey === "guardians"),
      synthesis: bundle.sections.filter((s) => s.sectionKey === "synthesis"),
      detailed,
    };
  }, [bundle]);

  const contentLocale = useMemo(() => {
    if (!bundle) return "fr" as const;
    const sample = bundle.sections.map((s) => s.markdown).join("\n");
    return detectCartographyContentLocale(sample, bundle.meta);
  }, [bundle]);

  const display = useMemo(
    () => (bundle ? parseBundleToDisplay(bundle) : null),
    [bundle],
  );

  useEffect(() => {
    if (!grouped) return;
    if (grouped.cartographie.length) setMainTab("cartographie");
    else if (grouped.synthesis.length) setMainTab("synthesis");
    else if (grouped.detailed.length) setMainTab("detailed");
    else if (grouped.guardians.length) setMainTab("guardians");
  }, [grouped]);

  const adminUserQuery =
    isAdmin && previewUserId ? `?user=${encodeURIComponent(previewUserId)}` : "";

  const goPole = (p: ArchetypePole) => {
    navigate(`/cartographie/${poleToPath(p)}/${modeToPath(mode)}${adminUserQuery}`);
  };

  const goMode = (m: AnalysisMode) => {
    navigate(`/cartographie/${poleToPath(pole)}/${modeToPath(m)}${adminUserQuery}`);
  };

  const meta = bundle?.meta ?? {};
  const headerMeta = display?.meta;
  const formattedDate = useMemo(() => {
    const d = headerMeta?.date || metaString(meta, "date");
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
  }, [meta, headerMeta, isFR]);

  const hasContent = bundle && bundle.sections.length > 0;
  const poleLabel = theme[isFR ? "labelFr" : "labelEn"];

  return (
    <PageWrapper className="pb-24">
      <div className="relative mx-auto w-full max-w-3xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl px-4 pt-2 sm:px-6 lg:px-8">
        <Link
          to="/deep-dive"
          className="mb-4 inline-flex min-h-[44px] items-center gap-2 rounded-md px-1 -ml-1 text-xs uppercase tracking-[0.18em] text-text-tertiary transition-colors hover:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronLeft size={16} strokeWidth={1.5} aria-hidden />
          {t("balanceReport.back")}
        </Link>

        {isAdmin && previewUserId && (
          <p className="mb-3 rounded-lg border border-info/30 bg-info/10 px-3 py-2 text-xs text-text-secondary">
            {t("cartography.adminPreviewBanner")}
          </p>
        )}

        {locale !== contentLocale && (
          <p className="mb-3 rounded-lg border border-[hsl(var(--aegis-warm)/0.25)] bg-[hsl(var(--aegis-warm-muted)/0.15)] px-3 py-2 text-xs text-text-secondary">
            {t("cartography.contentLanguageNotice", {
              language:
                contentLocale === "fr"
                  ? t("cartography.contentLanguageFr")
                  : t("cartography.contentLanguageEn"),
            })}
          </p>
        )}

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

        {!loading && hasContent && bundle && grouped && display && (
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
                    {headerMeta?.subtitle || metaString(meta, "subtitle", `${poleLabel} · ${mode}`)}
                  </p>
                  <h1 className="mt-1 font-display text-xl uppercase tracking-[0.08em] text-text-primary sm:text-2xl">
                    {headerMeta?.title || metaString(meta, "title", t("cartography.defaultTitle"))}
                  </h1>
                </div>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <MetaItem
                  label={headerMeta?.userLabel || metaString(meta, "user_label", isFR ? "Utilisateur" : "User")}
                  value={headerMeta?.userValue || metaString(meta, "user_value", "—")}
                />
                <MetaItem label={isFR ? "Date" : "Date"} value={formattedDate} />
                <MetaItem
                  label={isFR ? "Stade" : "Stage"}
                  value={headerMeta?.stage || metaString(meta, "stage", "—")}
                />
              </div>
              <Badge variant="outline" className={cn("mt-4 text-[10px] uppercase tracking-[0.15em]", theme.badgeClass)}>
                {t("balanceReport.pole")}{" "}
                {headerMeta?.poleLabel || metaString(meta, "pole_label", poleLabel.toUpperCase())}
              </Badge>
            </header>

            <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as MainTab)} className="mt-6">
              <TabsList className="flex h-auto w-full gap-1 rounded-xl bg-white/[0.04] p-1.5">
                {grouped.cartographie.length > 0 && (
                  <TabsTrigger
                    value="cartographie"
                    className="min-h-[44px] flex-1 gap-2 rounded-lg data-[state=active]:bg-[hsl(var(--aegis-s1))] data-[state=active]:shadow-sm"
                  >
                    <Layers size={14} aria-hidden />
                    <span className="text-[11px] uppercase tracking-[0.08em] sm:text-xs">
                      {t("cartography.tabCartography")}
                    </span>
                  </TabsTrigger>
                )}
                {grouped.guardians.length > 0 && (
                  <TabsTrigger
                    value="guardians"
                    className="min-h-[44px] flex-1 gap-2 rounded-lg data-[state=active]:bg-[hsl(var(--aegis-s1))] data-[state=active]:shadow-sm"
                  >
                    <Users size={14} aria-hidden />
                    <span className="text-[11px] uppercase tracking-[0.08em] sm:text-xs">
                      {t("balanceReport.tabGuardians")}
                    </span>
                  </TabsTrigger>
                )}
                {grouped.synthesis.length > 0 && (
                  <TabsTrigger
                    value="synthesis"
                    className="min-h-[44px] flex-1 gap-2 rounded-lg data-[state=active]:bg-[hsl(var(--aegis-s1))] data-[state=active]:shadow-sm"
                  >
                    <BookOpen size={14} aria-hidden />
                    <span className="text-[11px] uppercase tracking-[0.08em] sm:text-xs">
                      {t("cartography.tabSynthesis")}
                    </span>
                  </TabsTrigger>
                )}
                {grouped.detailed.length > 0 && (
                  <TabsTrigger
                    value="detailed"
                    className="min-h-[44px] flex-1 gap-2 rounded-lg data-[state=active]:bg-[hsl(var(--aegis-s1))] data-[state=active]:shadow-sm"
                  >
                    <FileText size={14} aria-hidden />
                    <span className="text-[11px] uppercase tracking-[0.08em] sm:text-xs">
                      {t("cartography.tabDetailed")}
                    </span>
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="cartographie" className="mt-4">
                <TabIntro text={t("cartography.tabCartographyHint")} />
                {display.houses.length > 0 ? (
                  <CartographyStructuredReport display={display} activeTab="cartographie" />
                ) : (
                  <CartographyFileList sections={grouped.cartographie} kind="cartographie" />
                )}
              </TabsContent>

              <TabsContent value="guardians" className="mt-4">
                <TabIntro text={t("balanceReport.guardiansIntro")} />
                {display.guardians.length > 0 ? (
                  <CartographyStructuredReport display={display} activeTab="guardians" />
                ) : (
                  <CartographyFileList sections={grouped.guardians} kind="guardians" />
                )}
              </TabsContent>

              <TabsContent value="synthesis" className="mt-4">
                <TabIntro text={t("cartography.synthesisIntro")} />
                <CartographyFileList sections={grouped.synthesis} kind="synthesis" />
              </TabsContent>

              <TabsContent value="detailed" className="mt-4">
                <TabIntro text={t("cartography.detailedIntro")} />
                <CartographyFileList sections={grouped.detailed} kind="detailed" />
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

function TabIntro({ text }: { text: string }) {
  return (
    <p className="mb-4 text-sm leading-relaxed text-text-tertiary">{text}</p>
  );
}
