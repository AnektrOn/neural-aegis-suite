import { AlertTriangle } from "lucide-react";
import { NavLink } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";

export function DecisionAgingAlert({ days }: { days: number }) {
  const { t } = useLanguage();

  return (
    <Card className="border-destructive/30 bg-destructive/5 p-4 backdrop-blur-3xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="font-serif text-base leading-snug">
            {t("dashboard.decisionAging.title", { days })}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{t("dashboard.decisionAging.body")}</p>
        </div>
        <Button asChild size="sm" variant="outline" className="shrink-0">
          <NavLink to="/decisions">{t("dashboard.decisionAging.cta")}</NavLink>
        </Button>
      </div>
    </Card>
  );
}