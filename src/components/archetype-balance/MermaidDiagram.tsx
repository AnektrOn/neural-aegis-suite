import { ClinicalMermaidViewer } from "@/features/user-reports/components/ClinicalMermaidViewer";
import type { MermaidTheme, RsmPattern } from "react-super-mermaid";
import { useLanguage } from "@/i18n/LanguageContext";

export interface MermaidDiagramProps {
  source: string;
  theme?: MermaidTheme;
  pattern?: RsmPattern;
  height?: number | string;
  className?: string;
  toolbar?: boolean;
}

/**
 * Enhanced Mermaid Diagram component powered by `react-super-mermaid` and `ClinicalMermaidViewer`.
 * Provides interactive pan-and-zoom, in-diagram node search, live theme switching,
 * and high-resolution SVG/PNG exports with French/English localized UI (zero Chinese labels).
 */
export function MermaidDiagram({
  source,
  theme = "colorful",
  pattern = "dots",
  height = 420,
  className,
  toolbar = true,
}: MermaidDiagramProps) {
  const { locale } = useLanguage();

  return (
    <ClinicalMermaidViewer
      code={source}
      theme={theme}
      pattern={pattern}
      height={height}
      className={className}
      showToolbar={toolbar}
      locale={locale === "fr" ? "fr" : "en"}
    />
  );
}