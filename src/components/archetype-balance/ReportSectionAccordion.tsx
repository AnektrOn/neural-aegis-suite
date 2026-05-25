import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReportSection } from "@/lib/archetype-cartography/types";
import { ReportSectionPanel } from "./ReportSectionPanel";

/** @deprecated Use ReportSectionPanel — kept for backward compatibility */
export function ReportSectionAccordion({
  section,
  defaultOpen = false,
  depth = 0,
}: {
  section: ReportSection;
  defaultOpen?: boolean;
  depth?: number;
}) {
  return (
    <ReportSectionPanel
      section={section}
      index={1}
      defaultOpen={defaultOpen || depth === 0}
      accentClass={depth > 0 ? "border-border-subtle/60" : "border-[hsl(var(--aegis-warm))]"}
    />
  );
}
