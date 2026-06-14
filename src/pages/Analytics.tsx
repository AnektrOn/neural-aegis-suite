import { lazy, Suspense, useRef } from "react";
import { motion } from "framer-motion";
import ExportPDFButton from "@/components/ExportPDFButton";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAnalyticsData } from "@/hooks/useAnalyticsData";
import { useAegisMotion } from "@/hooks/useAegisMotion";

const AnalyticsCharts = lazy(() =>
  import("@/components/analytics/AnalyticsCharts").then((m) => ({ default: m.AnalyticsCharts })),
);

export default function Analytics() {
  const { user } = useAuth();
  const { t, locale } = useLanguage();
  const { fadeUp } = useAegisMotion();
  const reportRef = useRef<HTMLDivElement>(null);
  const { data, isLoading, isError, refetch } = useAnalyticsData(user?.id, locale);

  return (
    <div className="space-y-10 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="font-display text-[10px] tracking-[0.22em] uppercase text-text-tertiary/70 mb-2">
            {t("analytics.intelligenceCenter")}
          </p>
          <h1 className="font-cormorant text-3xl sm:text-4xl font-light text-text-primary tracking-tight">
            {t("analytics.title")}
          </h1>
        </div>
        <ExportPDFButton targetRef={reportRef as React.RefObject<HTMLDivElement>} filename="rapport-analytiques" />
      </div>

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
            <div key={i} className="dashboard-panel h-56 animate-pulse rounded-2xl" />
          ))}
        </div>
      )}

      {!isLoading && data && (
        <motion.div ref={reportRef} className="space-y-8" {...fadeUp()}>
          <Suspense
            fallback={
              <div className="dashboard-panel h-64 animate-pulse rounded-2xl" aria-hidden />
            }
          >
            <AnalyticsCharts data={data} t={t} />
          </Suspense>
        </motion.div>
      )}
    </div>
  );
}
