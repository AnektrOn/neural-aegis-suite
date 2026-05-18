import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Download,
  FileDown,
  Loader2,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { DeepDiveUserCards } from "../components/DeepDiveUserCards";
import { useDeepDiveProfile } from "../hooks/useDeepDiveProfile";
import { buildUserReport } from "../domain/sampleProfile";
import { exportDeepDivePdf } from "../services/exportDeepDivePdf";

export default function VisitorDeepDiveReport() {
  const { user } = useAuth();
  const { locale, t } = useLanguage();
  const isFR = locale === "fr";

  const { profile, loading, error } = useDeepDiveProfile({
    userId: user?.id,
    locale,
  });

  const userReport = useMemo(
    () => (profile ? buildUserReport(profile, locale) : ""),
    [profile, locale]
  );

  const reportSubject = profile?.label || (isFR ? "Ton profil" : "Your profile");
  const filenameStem = `deep-dive-${reportSubject.replace(/\s+/g, "-").toLowerCase()}`;

  const downloadMarkdown = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 pb-32 space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-text-tertiary text-xs uppercase tracking-[0.2em] font-display">
          <FileText size={14} strokeWidth={1.5} />
          {t("visitor.report.kicker")}
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
              onClick={() => downloadMarkdown(userReport, `${filenameStem}.md`)}
              className="gap-2"
            >
              <Download size={14} strokeWidth={1.5} />
              .md
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                exportDeepDivePdf({
                  kind: "user",
                  markdown: userReport,
                  profileLabel: reportSubject,
                })
              }
              className="gap-2"
            >
              <FileDown size={14} strokeWidth={1.5} />
              {isFR ? "Exporter PDF" : "Export PDF"}
            </Button>
          </div>
          <DeepDiveUserCards profile={profile} />
        </>
      )}

      <div
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/40 bg-bg-base/95 backdrop-blur-md p-4"
        style={{ paddingBottom: "calc(var(--safe-bottom, 0px) + 1rem)" }}
      >
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row gap-3">
          <Button variant="outline" className="flex-1" asChild>
            <Link to="/visitor">{t("visitor.backToSpace")}</Link>
          </Button>
          <Button className="flex-1 gap-2" asChild>
            <Link to="/auth?upgrade=1">
              {t("visitor.saveResults")}
              <ArrowRight size={14} />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
