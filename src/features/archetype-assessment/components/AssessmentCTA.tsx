import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

export function AssessmentCTA() {
  const { t } = useLanguage();
  return (
    <Card className="p-5 backdrop-blur-3xl bg-card/40 border-border/40">
      <div className="flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-primary mt-1" />
        <div className="flex-1">
          <h3 className="font-serif text-lg">{t("assessmentCta.title")}</h3>
          <p className="text-sm text-muted-foreground mt-1">{t("assessmentCta.body")}</p>
          <div className="flex gap-2 mt-3">
            <Button asChild size="sm">
              <Link to="/onboarding/assessment">
                {t("assessmentCta.start")} <ArrowRight className="ml-1 w-3.5 h-3.5" />
              </Link>
            </Button>
            <Button asChild size="sm" variant="ghost">
              <Link to="/deep-dive">{t("deepDive.viewReport")}</Link>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
