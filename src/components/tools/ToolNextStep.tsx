import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import type { ToolId } from "./toolsRegistry";
import { getToolById } from "./toolsRegistry";
import { getToolRunPath } from "@/components/tools/toolsRegistry";
import { getToolPath, suggestNextTool } from "@/lib/tools/toolSuggestions";
import { toolsBentoHover, toolsKicker } from "./toolsDesign";

interface ToolNextStepProps {
  toolId: ToolId;
  outputs: Record<string, unknown>;
  className?: string;
}

export function ToolNextStep({ toolId, outputs, className = "" }: ToolNextStepProps) {
  const suggestion = suggestNextTool(toolId, outputs);
  if (!suggestion) return null;

  const entry = getToolById(suggestion.toolId);
  const path = getToolRunPath(suggestion.toolId);

  return (
    <section className={`mt-6 ${className}`} aria-label="Étape suggérée">
      <p className={toolsKicker}>Prochaine étape recommandée</p>
      <Link
        to={path}
        className={`group mt-3 flex items-center justify-between rounded-2xl border border-border/40 bg-card/70 p-4 ${toolsBentoHover}`}
      >
        <div className="pr-4">
          <p className="text-sm font-semibold text-foreground group-hover:text-primary">
            {entry.title}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{suggestion.reason}</p>
        </div>
        <ArrowRight className="h-5 w-5 shrink-0 text-primary" aria-hidden />
      </Link>
    </section>
  );
}