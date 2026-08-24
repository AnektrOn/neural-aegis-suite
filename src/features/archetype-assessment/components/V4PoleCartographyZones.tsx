import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";
import type { V4PoleAnalysis } from "@/features/archetype-assessment/domain/types";
import { V4CartographyConstellation } from "./v4-cartography/V4CartographyConstellation";

interface Props {
  isFR?: boolean;
  analysis: V4PoleAnalysis;
  className?: string;
  embedded?: boolean;
}

export function V4PoleCartographyZones({ isFR: isFRProp, analysis, className, embedded = false }: Props) {
  const { locale, t } = useLanguage();
  const isFR = isFRProp ?? locale === "fr";
  const body = <V4CartographyConstellation isFR={isFR} analysis={analysis} />;

  if (embedded) {
    return <div className={cn("space-y-3", className)}>{body}</div>;
  }

  return (
    <div className={cn("space-y-4", className)}>
      <Card className="overflow-hidden backdrop-blur-3xl bg-white/[0.03] border border-white/10 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-lg tracking-[0.08em] uppercase text-text-primary">
            {t("assessment.v4CartographyShort")}
          </CardTitle>
          <CardDescription className="text-text-tertiary">
            {t("assessment.v4CartographyDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2 pb-6">{body}</CardContent>
      </Card>
    </div>
  );
}
