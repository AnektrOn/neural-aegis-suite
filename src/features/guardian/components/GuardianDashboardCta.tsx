import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";

interface Props {
  onGoDashboard: () => void;
  onSkip: () => void;
}

export function GuardianDashboardCta({ onGoDashboard, onSkip }: Props) {
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex flex-col items-center gap-3 p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="pointer-events-auto w-full max-w-md rounded-2xl border border-border/60 bg-background/80 px-5 py-4 text-center shadow-2xl backdrop-blur-md dark:border-white/10 dark:bg-black/50">
        <p className="font-display text-lg tracking-wide text-foreground">
          {t("guardian.dashboard.title")}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">{t("guardian.dashboard.body")}</p>
        <div className="mt-4 flex flex-col gap-2">
          <Button
            type="button"
            className="w-full"
            onClick={() => {
              onGoDashboard();
              navigate("/dashboard", { replace: true });
            }}
          >
            {t("guardian.dashboard.cta")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full text-muted-foreground hover:text-foreground"
            onClick={onSkip}
          >
            {t("guardian.skip")}
          </Button>
        </div>
      </div>
    </div>
  );
}
