import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReportSection } from "@/lib/archetype-cartography/types";
import { poleAccentClasses, sectionTitleParts } from "./BalanceRichText";
import { ReportContentBlocks } from "./ReportContentBlocks";

interface ReportSectionPanelProps {
  section: ReportSection;
  index: number;
  defaultOpen?: boolean;
  accentClass?: string;
  collapsible?: boolean;
  variant?: "flat" | "card";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ReportSectionPanel({
  section,
  index,
  defaultOpen = true,
  accentClass = "border-[hsl(var(--aegis-warm))]",
  collapsible = true,
  variant = "card",
  open: controlledOpen,
  onOpenChange,
}: ReportSectionPanelProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = controlledOpen ?? internalOpen;
  const setOpen = (v: boolean | ((prev: boolean) => boolean)) => {
    const next = typeof v === "function" ? v(open) : v;
    onOpenChange?.(next);
    if (controlledOpen === undefined) setInternalOpen(next);
  };

  const { label, pole } = sectionTitleParts(section.title);
  // Numérotation cohérente avec la nav sticky : toujours l'index arabe.
  const displayNum = String(index);
  const poleStyle = poleAccentClasses(pole);
  const borderClass = pole ? poleStyle.border : accentClass;

  const hasBody = section.blocks.length > 0;
  const hasChildren = (section.subsections?.length ?? 0) > 0;
  const hasContent = hasBody || hasChildren;
  const canToggle = collapsible && hasContent;
  const isExpanded = !collapsible || open;

  const numBadge = (
    <span
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 bg-black/25 font-display text-xs font-semibold",
        pole ? poleStyle.badge : "border-[hsl(var(--aegis-warm)/0.4)] text-text-primary",
      )}
      aria-hidden
    >
      {displayNum}
    </span>
  );

  const headingBlock = (
    <div className="min-w-0 flex-1">
      <h3 className="font-display text-base leading-snug tracking-wide text-text-primary sm:text-lg">
        {label}
      </h3>
      {section.subtitle && (
        <p className="mt-1 text-xs leading-relaxed text-text-tertiary">{section.subtitle}</p>
      )}
    </div>
  );

  if (variant === "flat") {
    return (
      <section
        id={section.id}
        className={cn(
          "scroll-mt-[calc(var(--safe-top)+8rem)] border-b border-border-subtle/20 pb-10 last:border-b-0 last:pb-0",
        )}
      >
        <div
          className={cn(
            "mb-5 flex items-start gap-4 rounded-2xl border bg-gradient-to-br p-4 sm:p-5",
            borderClass,
            poleStyle.glow,
          )}
        >
          {numBadge}
          {headingBlock}
        </div>

        {hasContent && (
          <div className="space-y-6 sm:pl-14">
            {hasBody && <ReportContentBlocks blocks={section.blocks} />}
            {hasChildren && (
              <div className="space-y-4">
                {section.subsections!.map((sub, i) => (
                  <SubsectionPanel key={sub.id} section={sub} index={i + 1} pole={pole} />
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    );
  }

  return (
    <section
      id={section.id}
      className="scroll-mt-[calc(var(--safe-top)+8rem)] overflow-hidden rounded-2xl border border-border-subtle/40 bg-white/[0.02]"
    >
      {canToggle ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "flex w-full min-h-[56px] items-center gap-3 px-4 py-4 text-left transition-colors sm:px-5",
            "hover:bg-white/[0.03] cursor-pointer",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
          )}
          aria-expanded={open}
          aria-controls={`${section.id}-body`}
        >
          {numBadge}
          {headingBlock}
          <ChevronDown
            size={18}
            strokeWidth={1.5}
            className={cn(
              "shrink-0 text-text-tertiary transition-transform duration-200",
              open && "rotate-180",
            )}
            aria-hidden
          />
        </button>
      ) : (
        <div className="flex min-h-[56px] items-center gap-3 px-4 py-4 sm:px-5">
          {numBadge}
          {headingBlock}
        </div>
      )}

      {isExpanded && hasContent && (
        <div
          id={`${section.id}-body`}
          className="space-y-5 border-t border-border-subtle/25 px-4 pb-6 pt-5 sm:px-5"
        >
          {hasBody && <ReportContentBlocks blocks={section.blocks} />}
          {hasChildren && (
            <div className="space-y-4">
              {section.subsections!.map((sub, i) => (
                <SubsectionPanel key={sub.id} section={sub} index={i + 1} pole={pole} />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function SubsectionPanel({
  section,
  index,
  pole,
}: {
  section: ReportSection;
  index: number;
  pole: "shadow" | "light" | "balance" | null;
}) {
  const { label } = sectionTitleParts(section.title);
  const poleStyle = poleAccentClasses(pole);

  return (
    <article
      className={cn(
        "rounded-xl border border-border-subtle/25 bg-black/10 p-4 sm:p-5",
        pole && "border-l-[3px]",
        pole ? poleStyle.border : "border-l-[hsl(var(--aegis-warm)/0.3)]",
      )}
    >
      <div className="mb-3 flex items-start gap-3">
        <span className="font-display text-[11px] uppercase tracking-[0.16em] text-text-tertiary tabular-nums">
          {index}
        </span>
        <h4 className="font-display text-sm leading-snug text-text-primary sm:text-[15px]">{label}</h4>
      </div>
      {section.blocks.length > 0 && <ReportContentBlocks blocks={section.blocks} />}
    </article>
  );
}
