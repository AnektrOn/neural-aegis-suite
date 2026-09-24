import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ToolboxItem, ToolboxItemLocale } from "../types";
import { pickToolboxItemCopy } from "../parseToolboxItemMarkdown";
import { ToolboxStepper } from "./ToolboxStepper";
import { ToolboxTimer } from "./ToolboxTimer";

export interface ToolboxDetailProps {
  item: ToolboxItem;
  locale: ToolboxItemLocale;
  className?: string;
  onBack?: () => void;
  /** Lance le timer automatiquement à l'ouverture de la session. */
  autoStartTimer?: boolean;
  onTimerComplete?: () => void;
  onStepChange?: (index: number) => void;
}

export function ToolboxDetail({
  item,
  locale,
  className,
  onBack,
  autoStartTimer = false,
  onTimerComplete,
  onStepChange,
}: ToolboxDetailProps) {
  const copy = pickToolboxItemCopy(item, locale);
  const durationSec = item.config.duration_sec;

  return (
    <article
      data-slot="toolbox-detail"
      className={cn(
        "mx-auto flex w-full max-w-[min(100%,24rem)] flex-col gap-5 sm:max-w-2xl sm:gap-6",
        className,
      )}
    >
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Retour
        </button>
      ) : null}

      <header className="space-y-3 border-b border-border/20 pb-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
            {item.content_type.replace(/_/g, " ")}
          </Badge>
          {item.duration ? (
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{item.duration}</span>
          ) : null}
        </div>
        <h1 className="text-lg font-medium leading-snug text-foreground">{copy.title}</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">{copy.description}</p>
      </header>

      <ToolboxTimer
        durationSec={durationSec}
        autoStart={autoStartTimer}
        onComplete={onTimerComplete}
        labels={
          locale === "en"
            ? { play: "Start", pause: "Pause", reset: "Reset" }
            : undefined
        }
      />

      <ToolboxStepper
        steps={copy.steps}
        instructions={copy.instructions}
        locale={locale}
        onStepChange={onStepChange}
      />
    </article>
  );
}
