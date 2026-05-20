export type ArchetypePole = "balance" | "light" | "shadow";
export type AnalysisMode = "analyse" | "clinique";

export interface CartographyMeta {
  title: string;
  subtitle: string;
  userLabel: string;
  userValue: string;
  date: string;
  stage: string;
  poleLabel: string;
}

export interface CartographyHouse {
  id: number;
  sign: string;
  title: string;
  tagline: string;
  shadow: string;
  light: string;
  balance: string;
}

export interface CartographyGuardian {
  name: string;
  shadow: string;
  light: string;
  balance: string;
}

export type TextBlock =
  | { type: "p"; text: string }
  | { type: "quote"; text: string }
  | { type: "list"; items: string[]; ordered?: boolean }
  | { type: "labeled"; label: string; text: string };

export interface ReportSection {
  id: string;
  title: string;
  subtitle?: string;
  blocks: TextBlock[];
  subsections?: ReportSection[];
}

export interface DetailedReport {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  sections: ReportSection[];
  footer?: string;
}

export interface CartographyDocument {
  meta: CartographyMeta;
  houses: CartographyHouse[];
  guardians: CartographyGuardian[];
  /** Synthèse globale (overview + P01–P05 résumés + mandat) */
  synthesis: ReportSection[];
  /** Rapports P01–P05 développés */
  detailedReports: DetailedReport[];
}

export interface CartographyBundle {
  available: boolean;
  document?: CartographyDocument;
}
