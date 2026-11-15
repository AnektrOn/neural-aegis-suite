import { Link } from "react-router-dom";
import type { ToolRegistryEntry } from "./toolsRegistry";
import { ChevronRight } from "lucide-react";
import { toolsBentoHover, toolsKicker, toolsTitle } from "./toolsDesign";

interface RelatedToolsProps {
  tools: ToolRegistryEntry[];
}

export function RelatedTools({ tools }: RelatedToolsProps) {
  return (
    <section className="mt-16 border-t border-border/40 pt-12" aria-labelledby="related-tools-heading">
      <p className={toolsKicker}>Continuer l&apos;audit</p>
      <h2 id="related-tools-heading" className={`${toolsTitle} mt-2 text-2xl`}>
        Autres outils décisionnels recommandés
      </h2>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {tools.map((tool) => (
          <li key={tool.id}>
            <Link
              to={tool.path}
              className={`group flex items-center justify-between rounded-2xl border border-border/40 bg-card/70 p-4 ${toolsBentoHover}`}
            >
              <div>
                <p className="text-sm font-semibold text-foreground group-hover:text-primary">
                  {tool.title}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{tool.hubBlurb}</p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-primary" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}