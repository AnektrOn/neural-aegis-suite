import { useLanguage } from "@/i18n/LanguageContext";
import { decisionFieldClass, decisionLabelClass } from "@/components/decisions/DecisionLogUi";
import { cn } from "@/lib/utils";
import {
  GuardianOverlayFrame,
  type GuardianOverlayPlacement,
} from "./GuardianOverlayFrame";

interface Props {
  open: boolean;
  placement: GuardianOverlayPlacement;
}

const PRIORITY_LEVELS = [1, 2, 3, 4, 5] as const;
const DEMO_PRIORITY = 3;

/** Read-only decision log preview while Guardian explains (no buttons). */
export function GuardianDecisionLogModal({ open, placement }: Props) {
  const { t } = useLanguage();

  return (
    <GuardianOverlayFrame open={open} title={t("guardian.decision.title")} placement={placement}>
      <div className="pointer-events-none mx-auto w-full max-w-[390px] px-3 py-3 select-none">
        <div className="glass-card space-y-4 border-0 bg-muted/30 p-4 sm:p-5">
          <h2 className="font-display text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            {t("decisions.quickAdd")}
          </h2>
          <div className="space-y-2">
            <p className={cn(decisionLabelClass, "text-muted-foreground")}>
              {t("decisions.decisionName")}
            </p>
            <div className={cn(decisionFieldClass, "opacity-80")}>
              {t("decisions.placeholder")}
            </div>
          </div>
          <div className="space-y-2">
            <p className={cn(decisionLabelClass, "text-muted-foreground")}>
              {t("decisions.priority")}
            </p>
            <div className="flex flex-wrap gap-2">
              {PRIORITY_LEVELS.map((p) => (
                <span
                  key={p}
                  className={cn(
                    "inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border px-3 text-sm font-medium tabular-nums",
                    p === DEMO_PRIORITY
                      ? "border-primary/40 bg-primary/15 text-primary"
                      : "border-border/60 bg-muted/40 text-muted-foreground",
                  )}
                >
                  P{p}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </GuardianOverlayFrame>
  );
}
