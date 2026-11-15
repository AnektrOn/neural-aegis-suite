import { useState, type ReactNode } from "react";
import { ChevronDown, Clock, ListChecks, Lightbulb } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type { ToolGuide } from "./types";
import { toolsBentoElevated, toolsKicker } from "./toolsDesign";

interface ToolGuidePanelProps {
  guide: ToolGuide;
  /** Hub / layout document : bloc lisible. Wizard : repliable, sous la question. */
  variant?: "full" | "compact" | "wizard";
  className?: string;
}

export function ToolGuidePanel({ guide, variant = "full", className = "" }: ToolGuidePanelProps) {
  const [open, setOpen] = useState(variant !== "wizard");

  if (variant === "compact") {
    return (
      <div className={`${toolsBentoElevated} text-left ${className}`}>
        <p className={toolsKicker}>En clair</p>
        <p className="mt-2 text-sm leading-relaxed text-foreground">{guide.plainExplain}</p>
        <p className="mt-3 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Pour qui : </span>
          {guide.bestFor}
        </p>
      </div>
    );
  }

  if (variant === "wizard") {
    return (
      <Collapsible
        open={open}
        onOpenChange={setOpen}
        className={cn("mb-6 border-b border-border/30 pb-6", className)}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
              <Clock className="h-3.5 w-3.5 text-primary" aria-hidden />
              {guide.durationLabel}
            </span>
            <span className="mx-1.5 text-border">·</span>
            {guide.questionCount} étapes
            <span className="mx-1.5 text-border">·</span>
            {guide.outcomes.length} résultats à la fin
          </p>
          <CollapsibleTrigger className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-border/50 bg-card/50 px-3 text-xs font-medium text-primary transition hover:border-primary/40">
            {open ? "Masquer le guide" : "À quoi sert cet outil ?"}
            <ChevronDown
              className={cn("h-4 w-4 transition-transform duration-200", open && "rotate-180")}
              aria-hidden
            />
          </CollapsibleTrigger>
        </div>

        {!open ? (
          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{guide.plainExplain}</p>
        ) : null}

        <CollapsibleContent className="data-[state=closed]:animate-out data-[state=open]:animate-in">
          <motionBlock className="mt-4 space-y-4 rounded-xl border border-border/35 bg-muted/15 p-4">
            <div>
              <p className={toolsKicker}>En clair</p>
              <p className="mt-2 text-sm leading-relaxed text-foreground">{guide.plainExplain}</p>
            </div>

            <GuideGrid guide={guide} />
          </motionBlock>
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return (
    <aside
      className={`rounded-2xl border border-border/40 bg-muted/20 p-5 text-left sm:p-6 ${className}`}
      aria-label="À quoi sert cet outil"
    >
      <p className={toolsKicker}>Avant de commencer — en clair</p>
      <p className="mt-3 text-sm leading-relaxed text-foreground">{guide.plainExplain}</p>
      <motionBlock className="mt-5">
        <GuideMetaRow guide={guide} />
      </motionBlock>
      <GuideGrid guide={guide} className="mt-5" />
    </aside>
  );
}

function GuideMetaRow({ guide }: { guide: ToolGuide }) {
  return (
    <div className="flex flex-wrap gap-2 text-xs">
      <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/50 bg-card/60 px-2.5 py-1 text-muted-foreground">
        <Clock className="h-3.5 w-3.5 text-primary" aria-hidden />
        {guide.durationLabel} · {guide.questionCount} étapes
      </span>
      <span className="rounded-lg border border-border/50 bg-card/60 px-2.5 py-1 text-muted-foreground">
        {guide.bestFor}
      </span>
    </div>
  );
}

function GuideGrid({ guide, className = "" }: { guide: ToolGuide; className?: string }) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2", className)}>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-primary">Préparez</p>
        <p className="mt-1.5 text-sm leading-snug text-muted-foreground">{guide.prepareWhat}</p>
      </div>
      <div>
        <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
          <ListChecks className="h-3.5 w-3.5" aria-hidden />
          À la fin
        </p>
        <ul className="mt-1.5 space-y-1 text-sm leading-snug text-muted-foreground">
          {guide.outcomes.map((o) => (
            <li key={o} className="flex gap-2">
              <span className="shrink-0 text-primary" aria-hidden>
                ·
              </span>
              <span>{o}</span>
            </li>
          ))}
        </ul>
      </div>
      {guide.example ? (
        <div className="sm:col-span-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <Lightbulb className="h-3.5 w-3.5 text-primary" aria-hidden />
            Exemple
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{guide.example}</p>
        </div>
      ) : null}
    </div>
  );
}

function motionBlock({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={className}>{children}</div>;
}