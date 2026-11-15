import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { useGuardianOptional } from "@/features/guardian";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  FileDown,
  ImageDown,
  Loader2,
  Sparkles,
  AlertTriangle,
  Globe,
} from "lucide-react";
import { DeepDiveUserCards } from "../components/DeepDiveUserCards";
import { useDeepDiveProfile } from "../hooks/useDeepDiveProfile";
import { buildUserReport } from "../domain/sampleProfile";
import { exportDeepDiveVisualPdf, exportDeepDivePng } from "../services/exportDeepDiveScreenshot";
import { LIEN_PAIEMENT_LECTURE } from "@/pages/aegis-landing/landingCtaHrefs";

export default function VisitorDeepDiveReport() {
  const { user } = useAuth();
  const { locale, setLocale, t } = useLanguage();
  const isFR = locale === "fr";
  const { toast } = useToast();
  const guardian = useGuardianOptional();
  const exportRef = useRef<HTMLDivElement>(null);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingPng, setExportingPng] = useState(false);
  /** Stack all sections for capture so tabs don't overlap / hide content. */
  const [captureLayout, setCaptureLayout] = useState(false);

  const waitForCaptureLayout = async () => {
    setCaptureLayout(true);
    const root = exportRef.current;
    const parent = root?.parentElement;
    if (parent) {
      parent.dataset.exportPrevMaxWidth = parent.style.maxWidth;
      parent.dataset.exportPrevWidth = parent.style.width;
      parent.style.maxWidth = "none";
      parent.style.width = "1280px";
    }
    if (root) root.classList.add("deep-dive-jpeg-capture-active");
    document.body.classList.add("deep-dive-jpeg-capture-active");
    await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
    await new Promise<void>((r) => setTimeout(r, 700));
  };

  const restoreCaptureLayoutShell = () => {
    const root = exportRef.current;
    const parent = root?.parentElement;
    if (parent) {
      parent.style.maxWidth = parent.dataset.exportPrevMaxWidth ?? "";
      parent.style.width = parent.dataset.exportPrevWidth ?? "";
      delete parent.dataset.exportPrevMaxWidth;
      delete parent.dataset.exportPrevWidth;
    }
    root?.classList.remove("deep-dive-jpeg-capture-active");
    document.body.classList.remove("deep-dive-jpeg-capture-active");
    setCaptureLayout(false);
  };

  useEffect(() => {
    guardian?.markQuizComplete();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { profile, loading, error } = useDeepDiveProfile({
    userId: user?.id,
    locale,
  });

  const reportSubject = profile?.label || (isFR ? "Votre profil" : "Your profile");
  const userReport = useMemo(() => {
    if (!profile) return "";
    const full = buildUserReport(profile, locale);
    // Strip "Recommended practices" / "Pratiques recommandées" section (hidden for visitors)
    // Also strip survival archetype name lines for visitor exports (names stay off-screen).
    return full
      .replace(/\n## (?:Pratiques recommandées|Recommended practices)[\s\S]*$/m, "\n")
      .trimEnd();
  }, [profile, locale]);

  const handleExportPdf = async () => {
    const el = exportRef.current;
    if (!el || !profile || exportingPdf || exportingPng) return;
    setExportingPdf(true);
    try {
      await waitForCaptureLayout();
      await exportDeepDiveVisualPdf(el, reportSubject, { kind: "user", isFR });
      toast({
        title: t("visitor.report.exportPdfSuccess"),
        description: t("visitor.report.exportPdfSuccessDesc"),
      });
    } catch (e) {
      console.error("[VisitorDeepDiveReport] export pdf failed", e);
      toast({
        title: t("toast.error"),
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    } finally {
      restoreCaptureLayoutShell();
      setExportingPdf(false);
    }
  };

  const handleExportPng = async () => {
    const el = exportRef.current;
    if (!el || !profile || exportingPdf || exportingPng) return;
    setExportingPng(true);
    try {
      await waitForCaptureLayout();
      await exportDeepDivePng(el, reportSubject, { kind: "user", isFR });
      toast({
        title: t("visitor.report.exportPngSuccess"),
        description: t("visitor.report.exportPngSuccessDesc"),
      });
    } catch (e) {
      console.error("[VisitorDeepDiveReport] export png failed", e);
      toast({
        title: t("toast.error"),
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    } finally {
      restoreCaptureLayoutShell();
      setExportingPng(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 pb-36 space-y-6">
      {/* Fixed warning banner */}
      <div className="fixed top-14 left-0 right-0 z-30 bg-accent-warning/10 border-b border-accent-warning/30 backdrop-blur-md" data-export-hide>
        <div className="max-w-4xl mx-auto px-4 py-2 flex items-center gap-2 text-accent-warning text-[11px] sm:text-xs">
          <AlertTriangle size={14} strokeWidth={1.5} className="shrink-0" />
          <span className="leading-snug">
            {isFR
              ? "Vos résultats ne seront plus accessibles si vous quittez la page. Exportez en PDF ou PNG avant de partir."
              : "Your results will no longer be accessible once you leave this page. Export as PDF or PNG before leaving."}
          </span>
        </div>
      </div>

      <div className="h-8" />

      {!loading && !error && profile && (
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void handleExportPdf()}
            disabled={exportingPdf || exportingPng}
            className="gap-2"
          >
            {exportingPdf ? (
              <Loader2 size={14} strokeWidth={1.5} className="animate-spin" />
            ) : (
              <FileDown size={14} strokeWidth={1.5} />
            )}
            {t("visitor.report.exportPdf")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void handleExportPng()}
            disabled={exportingPdf || exportingPng}
            className="gap-2"
          >
            {exportingPng ? (
              <Loader2 size={14} strokeWidth={1.5} className="animate-spin" />
            ) : (
              <ImageDown size={14} strokeWidth={1.5} />
            )}
            {t("visitor.report.exportPng")}
          </Button>
        </div>
      )}

      <div ref={exportRef} id="deep-dive-report-export" className="space-y-6">
      <header className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-text-tertiary text-xs uppercase tracking-[0.2em] font-display">
            <FileText size={14} strokeWidth={1.5} />
            {t("visitor.report.kicker")}
          </div>
          <button
            type="button"
            data-export-hide
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
        <DeepDiveUserCards
          profile={profile}
          hidePractices
          visitorResultMode
          layout={captureLayout ? "stack" : "tabs"}
        />
      )}
      </div>

      {!loading && !error && profile ? (
        <Card
          data-export-hide
          className="p-6 sm:p-8 space-y-4 backdrop-blur-3xl bg-white/[0.04] border border-primary/25"
        >
          <h2 className="font-display text-xl tracking-[0.12em] uppercase text-text-primary">
            {t("visitor.report.lectureTitle")}
          </h2>
          <p className="text-sm text-text-secondary leading-relaxed">{t("visitor.report.lectureBody")}</p>
          <Button className="w-full min-h-[44px]" asChild>
            <a href={LIEN_PAIEMENT_LECTURE}>{t("visitor.report.lectureCta")}</a>
          </Button>
          <Button variant="outline" className="w-full min-h-[44px]" asChild>
            <Link to="/auth?upgrade=1&redirect=%2Fvisitor%2Freport">
              {t("visitor.report.createAccount")}
            </Link>
          </Button>
          <p className="text-center pt-1">
            <Link
              to="/deep-dive"
              className="text-[11px] text-text-tertiary underline-offset-4 hover:text-text-secondary hover:underline"
            >
              {t("visitor.report.deepDiveLink")}
            </Link>
          </p>
        </Card>
      ) : null}

      <div
        className="visitor-report-sticky-bar fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-bg-base p-4"
        style={{ paddingBottom: "calc(var(--safe-bottom, 0px) + 1rem)" }}
        data-export-hide
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
