import { lazy, Suspense, useRef, useMemo, useState } from "react";
import { MemberPageHeader } from "@/components/ui/MemberPageHeader";
import { MemberPageScaffold } from "@/layouts/MemberPageScaffold";
import { MemberSplitLayout } from "@/layouts/MemberSplitLayout";
import { motion } from "framer-motion";
import ExportPDFButton from "@/components/ExportPDFButton";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAnalyticsData } from "@/hooks/useAnalyticsData";
import { useAegisMotion } from "@/hooks/useAegisMotion";
import { Activity, Brain, Moon, Target, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const AnalyticsCharts = lazy(() =>
  import("@/components/analytics/AnalyticsCharts").then((m) => ({ default: m.AnalyticsCharts })),
);

export default function Analytics() {
  const { user } = useAuth();
  const { t, locale } = useLanguage();
  const { fadeUp } = useAegisMotion();
  const reportRef = useRef<HTMLDivElement>(null);
  const { data, isLoading, isError, refetch } = useAnalyticsData(user?.id, locale);
  const [mobileTab, setMobileTab] = useState<"charts" | "summary">("charts");

  const metricsSummary = useMemo(() => {
    if (!data) return null;
    const moodAvg =
      data.moodData.length > 0
        ? (data.moodData.reduce((acc, cur) => acc + (cur.humeur || 0), 0) / data.moodData.length).toFixed(1)
        : "—";
    const sleepAvg =
      data.sleepStressData.length > 0
        ? (data.sleepStressData.reduce((acc, cur) => acc + (cur.sommeil || 0), 0) / data.sleepStressData.length).toFixed(1)
        : "—";
    const habitAvg =
      data.habitData.length > 0
        ? `${Math.round(data.habitData.reduce((acc, cur) => acc + (cur.taux || 0), 0) / data.habitData.length)}%`
        : "—";
    const decidedRatio =
      data.decisionData.decided + data.decisionData.pending > 0
        ? `${Math.round(
            (data.decisionData.decided / (data.decisionData.decided + data.decisionData.pending + data.decisionData.deferred)) *
              100,
          )}%`
        : "—";

    return { moodAvg, sleepAvg, habitAvg, decidedRatio };
  }, [data]);

  const leftPane = (
    <div className="flex flex-col gap-6 h-full justify-between">
      <div>
        <p className="font-cinzel text-[10.5px] font-semibold tracking-[0.26em] uppercase text-[#9e7828] dark:text-[#c9a24b] mb-1.5">
          {t("analytics.intelligenceCenter")} · BIOMÉTRIE
        </p>
        <h1 className="font-cormorant text-3xl sm:text-4xl lg:text-5xl font-light text-foreground tracking-tight">
          {t("analytics.title")}
        </h1>
        <p className="font-sans text-sm text-muted-foreground mt-2 leading-relaxed">
          Synthèse globale de vos signaux de performance, clarté cognitive et régularité circadienne.
        </p>
      </div>

      {/* Mobile Segmented Switcher (<lg) */}
      <div className="flex lg:hidden items-center p-1 rounded-xl bg-black/40 border border-white/10 backdrop-blur-md shadow-sm">
        <button
          type="button"
          onClick={() => setMobileTab("charts")}
          className={cn(
            "flex-1 py-2 px-2 rounded-lg text-xs font-cinzel uppercase tracking-[0.12em] font-medium transition-all text-center",
            mobileTab === "charts"
              ? "bg-[#c9a24b]/20 text-[#c9a24b] border border-[#c9a24b]/40 shadow-sm font-semibold"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          📊 Graphiques & Tendances
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("summary")}
          className={cn(
            "flex-1 py-2 px-2 rounded-lg text-xs font-cinzel uppercase tracking-[0.12em] font-medium transition-all text-center",
            mobileTab === "summary"
              ? "bg-[#c9a24b]/20 text-[#c9a24b] border border-[#c9a24b]/40 shadow-sm font-semibold"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          📑 Synthèse (4 KPIs)
        </button>
      </div>

      {/* Macro Score Card & Quote */}
      <div className={cn("space-y-4 flex-1 flex flex-col justify-between", mobileTab !== "summary" && "hidden lg:flex", "pb-[calc(var(--mobile-dock-padding,5rem)+1.5rem)] lg:pb-0")}>
        <div className="aegis-dock-tile rounded-2xl p-5 space-y-4 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
          <div className="flex items-center justify-between border-b border-border/20 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-[#c9a24b]" />
              <span className="font-cinzel text-[10px] font-semibold uppercase tracking-[0.18em] text-[#c9a24b]">
                Indice Bio-Exécutif
              </span>
            </div>
            <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-[#c9a24b]/15 text-[#c9a24b] border border-[#c9a24b]/30">
              Optimal
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-black/25 dark:bg-black/35 border border-white/5 backdrop-blur-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                <Brain size={13} className="text-[#c9a24b]" />
                <span className="font-cinzel text-[8.5px] uppercase tracking-wider">Humeur (30j)</span>
              </div>
              <p className="font-cormorant text-2xl font-light text-foreground tabular-nums">
                {metricsSummary?.moodAvg ?? "…"} <span className="text-xs text-muted-foreground">/ 10</span>
              </p>
            </div>

            <div className="p-3 rounded-xl bg-black/25 dark:bg-black/35 border border-white/5 backdrop-blur-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                <Moon size={13} className="text-sky-400" />
                <span className="font-cinzel text-[8.5px] uppercase tracking-wider">Sommeil Moy.</span>
              </div>
              <p className="font-cormorant text-2xl font-light text-foreground tabular-nums">
                {metricsSummary?.sleepAvg ?? "…"} <span className="text-xs text-muted-foreground">h / nuit</span>
              </p>
            </div>

            <div className="p-3 rounded-xl bg-black/25 dark:bg-black/35 border border-white/5 backdrop-blur-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                <Activity size={13} className="text-emerald-400" />
                <span className="font-cinzel text-[8.5px] uppercase tracking-wider">Constance Habitudes</span>
              </div>
              <p className="font-cormorant text-2xl font-light text-foreground tabular-nums">
                {metricsSummary?.habitAvg ?? "…"}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-black/25 dark:bg-black/35 border border-white/5 backdrop-blur-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                <Target size={13} className="text-[#c9a24b]" />
                <span className="font-cinzel text-[8.5px] uppercase tracking-wider">Arbitrages Tranchés</span>
              </div>
              <p className="font-cormorant text-2xl font-light text-foreground tabular-nums">
                {metricsSummary?.decidedRatio ?? "…"}
              </p>
            </div>
          </div>

          <div className="pt-2">
            <ExportPDFButton targetRef={reportRef as React.RefObject<HTMLDivElement>} filename="rapport-analytiques" />
          </div>
        </div>

        <div className="aegis-dock-tile rounded-2xl p-4 text-center">
          <p className="font-cormorant text-sm italic text-muted-foreground leading-relaxed">
            "La haute performance n'est pas un pic d'effort, mais la maîtrise du rythme et de la régénération."
          </p>
        </div>
      </div>
    </div>
  );

  const rightPane = (
    <div className={cn("space-y-6", mobileTab !== "charts" && "hidden lg:block")}>
      {isError && (
        <div className="flex flex-col gap-2 rounded-2xl border border-destructive/35 bg-destructive/10 px-4 py-3 sm:flex-row sm:items-center">
          <p className="flex-1 font-barlow text-sm text-destructive">{t("analytics.loadError")}</p>
          <button
            type="button"
            className="rounded-xl border border-destructive/40 bg-background/80 px-3 py-2 font-barlow text-xs font-medium uppercase tracking-wide text-destructive hover:bg-destructive/10"
            onClick={() => void refetch()}
          >
            {t("dashboard.retry")}
          </button>
        </div>
      )}

      {isLoading && (
        <div className="space-y-6" aria-busy="true" aria-label={t("analytics.loading")}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="aegis-dock-tile h-56 animate-pulse rounded-2xl" />
          ))}
        </div>
      )}

      {!isLoading && data && (
        <motion.div ref={reportRef} className="space-y-6" {...fadeUp()}>
          <Suspense
            fallback={
              <div className="aegis-dock-tile h-64 animate-pulse rounded-2xl" aria-hidden />
            }
          >
            <AnalyticsCharts data={data} t={t} />
          </Suspense>
        </motion.div>
      )}
    </div>
  );

  return (
    <MemberPageScaffold width="wide" viewport>
      <MemberSplitLayout
        left={leftPane}
        right={rightPane}
        leftCols="lg:col-span-5"
        rightCols="lg:col-span-7"
        scrollRight={true}
        scrollLeft={true}
      />
    </MemberPageScaffold>
  );
}
