import { Link } from "react-router-dom";
import { ArrowRight, Clock } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import type { ToolRegistryEntry } from "./toolsRegistry";
import { toolsBento, toolsBentoHover, toolsCardTitle, toolsKicker } from "./toolsDesign";

interface ToolHubCardProps {
  tool: ToolRegistryEntry;
}

export function ToolHubCard({ tool }: ToolHubCardProps) {
  const { t } = useLanguage();
  const { guide } = tool;

  return (
    <article className={`flex h-full flex-col ${toolsBento} ${toolsBentoHover}`}>
      <p className={`${toolsKicker} !text-[9px]`}>{t("tools.freeBadge")}</p>

      <h2 className={`mt-2 ${toolsCardTitle}`}>{tool.title}</h2>
      <p className="mt-2 flex-1 text-sm leading-snug text-muted-foreground">{tool.hubBlurb}</p>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/30 pt-4">
        <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          <Clock className="h-3 w-3 text-primary" aria-hidden />
          {guide.durationLabel}
        </span>
        <Link
          to={tool.path}
          className="inline-flex items-center text-[10px] font-medium uppercase tracking-[0.14em] text-primary hover:underline"
        >
          {t("tools.viewSheet")}
          <ArrowRight className="ml-1.5 h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>
    </article>
  );
}