import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  FileDown,
  Loader2,
  Sparkles,
  AlertTriangle,
  Globe,
} from "lucide-react";
import { DeepDiveUserCards } from "../components/DeepDiveUserCards";
import { useDeepDiveProfile } from "../hooks/useDeepDiveProfile";
import { buildUserReport } from "../domain/sampleProfile";
import { exportDeepDiveTextPdf } from "../services/exportDeepDivePdf";

export default function VisitorDeepDiveReport() {
  const { user } = useAuth();
  const { locale, setLocale, t } = useLanguage();
  const isFR = locale === "fr";
  const [exporting, setExporting] = useState(false);

  const { profile, loading, error } = useDeepDiveProfile({
    userId: user?.id,
    locale,
  });

  const reportSubject = profile?.label || (isFR ? "Ton profil" : "Your profile");
  const userReport = useMemo(() => {
    if (!profile) return "";
    const full = buildUserReport(profile, locale);
    // Strip "Recommended practices" / "Pratiques recommandées" section (hidden for visitors)
    return full.replace(/\n## (?:Pratiques recommandées|Recommended practices)[\s\S]*$/m, "\n").trimEnd();
  }, [profile, locale]);

  const handleExportPdf = () => {
    if (!userReport || exporting) return;
    setExporting(true);
    try {
      exportDeepDiveTextPdf({
        markdown: userReport,
        profileLabel: reportSubject,
        kind: "user",
        isFR,
      });
    } catch (e) {
      console.error("[VisitorDeepDiveReport] export pdf failed", e);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 pb-28 space-y-6">
      {/* Fixed warning banner */}
      <div className="fixed top-14 left-0 right-0 z-30 bg-accent-warning/10 border-b border-accent-warning/30 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 py-2 flex items-center gap-2 text-accent-warning text-[11px] sm:text-xs">
          <AlertTriangle size={14} strokeWidth={1.5} className="shrink-0" />
          <span className="leading-snug">
            {isFR
              ? "Vos résultats ne seront plus accessibles si vous quittez la page. Exportez votre PDF avant de partir."
              : "Your results will no longer be accessible once you leave this page. Export your PDF before leaving."}
          </span>
        </div>
      </div>

      <div className="h-8" />

      <header className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-text-tertiary text-xs uppercase tracking-[0.2em] font-display">
            <FileText size={14} strokeWidth={1.5} />
            {t("visitor.report.kicker")}
          </div>
          <button
            onClick={() => setLocale(isFR ? "en" : "fr")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/40 text-text-secondary hover:text-text-primary hover:border-primary/40 transition-all text-[10px] uppercase tracking-[0.2em] font-display"
            title={isFR ? "Switch to English" : "Passer en français"}
          >
            <Globe size={12} strokeWidth={1.5} />
            <span>{isFR ? "FR" : "EN"}</span>
            <span className="opacity-50">→</span>
            <span className="text-accent-primary/80">{isFR ? "EN" : "FR"}</span>
          </button>
        </div>
        <h1 className="font-display text-3xl tracking-[0.15em] uppercase text-text-primary">
          {reportSubject}
        </h1>
        <p className="text-sm text-text-secondary">{t("visitor.report.subtitle")}</p>
      </header>

      {loading && (
        <Card className="p-10 text-center backdrop-blur-3xl bg-white/[0.03] border border-white/10">
          <Loader2 size={20} strokeWidth={1.5} className="animate-spin mx-auto mb-3 text-text-tertiary" />
          <p className="text-text-secondary text-sm">{t("visitor.report.loading")}</p>
        </Card>
      )}

      {!loading && error && (
        <Card className="p-10 text-center backdrop-blur-3xl bg-white/[0.03] border border-white/10 space-y-4">
          <Sparkles size={28} strokeWidth={1.2} className="mx-auto mb-3 text-text-tertiary" />
          <p className="text-text-secondary text-sm">{error}</p>
          <Button asChild>
            <Link to="/quiz">{t("visitor.startQuiz")}</Link>
          </Button>
        </Card>
      )}

      {!loading && !error && profile && (
        <>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPdf}
              disabled={exporting}
              className="gap-2"
            >
              {exporting ? (
                <Loader2 size={14} strokeWidth={1.5} className="animate-spin" />
              ) : (
                <FileDown size={14} strokeWidth={1.5} />
              )}
              {isFR ? "Exporter PDF" : "Export PDF"}
            </Button>
          </div>
          <DeepDiveUserCards profile={profile} hidePractices />
        </>
      )}

      <div
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/40 bg-bg-base/95 backdrop-blur-md p-4"
        style={{ paddingBottom: "calc(var(--safe-bottom, 0px) + 1rem)" }}
      >
        <div className="max-w-4xl mx-auto">
          <Button variant="outline" className="w-full" asChild>
            <Link to="/visitor">{t("visitor.backToSpace")}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
