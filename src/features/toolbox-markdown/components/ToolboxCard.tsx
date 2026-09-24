import { ChevronRight, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ToolboxItem } from "../types";
import { pickToolboxItemCopy } from "../parseToolboxItemMarkdown";
import type { ToolboxItemLocale } from "../types";

const CATEGORY_STYLES: Record<string, string> = {
  regulation: "border-cyan-500/30 bg-cyan-500/10 text-cyan-200",
  boundary: "border-violet-500/30 bg-violet-500/10 text-violet-200",
  custom: "border-border/40 bg-secondary/30 text-muted-foreground",
};

export interface ToolboxCardProps {
  item: ToolboxItem;
  locale: ToolboxItemLocale;
  className?: string;
  onSelect?: () => void;
}

export function ToolboxCard({ item, locale, className, onSelect }: ToolboxCardProps) {
  const copy = pickToolboxItemCopy(item, locale);
  const categoryClass = CATEGORY_STYLES[item.category] ?? CATEGORY_STYLES.custom;

  return (
    <button
      type="button"
      onClick={onSelect}
      data-slot="toolbox-card"
      className={cn(
        "group w-full rounded-2xl border border-border/30 bg-card/40 p-5 text-left transition-colors",
        "hover:border-border/50 hover:bg-card/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={cn("text-[10px] font-medium uppercase tracking-wider", categoryClass)}>
              {item.category}
            </Badge>
            {item.duration ? (
              <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                <Clock className="size-3" aria-hidden />
                {item.duration}
              </span>
            ) : null}
            {item.priority ? (
              <span className="text-[10px] font-mono text-muted-foreground/80">{item.priority}</span>
            ) : null}
          </div>
          <h3 className="text-sm font-medium leading-snug text-foreground">{copy.title}</h3>
          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{copy.description}</p>
        </div>
        <ChevronRight
          className="size-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5"
          aria-hidden
        />
      </div>
    </button>
  );
}
