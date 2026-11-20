import { useLanguage } from "@/i18n/LanguageContext";
import { toolsBentoElevated, toolsKicker } from "./toolsDesign";

export function NarrativeActions({
  narrative,
  actions,
  className = "",
}: {
  narrative: string;
  actions: string[];
  className?: string;
}) {
  const { t } = useLanguage();
  return (
    <div className={`space-y-4 ${className}`}>
      <div className={toolsBentoElevated}>
        <p className={toolsKicker}>{t("tools.customReading")}</p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{narrative}</p>
      </div>
      {actions.length > 0 ? (
        <div className={toolsBentoElevated}>
          <p className={toolsKicker}>{t("tools.immediateActions")}</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {actions.map((a) => (
              <li key={a} className="flex gap-2">
                <span className="text-primary" aria-hidden>
                  →
                </span>
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}