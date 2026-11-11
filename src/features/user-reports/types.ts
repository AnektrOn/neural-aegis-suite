export interface UserReportV3PackFiles {
  rapport_md: string;
  resume_md?: string;
  bullet_points_md?: string;
  graphique_md?: string;
  prompt_ai_md?: string;
}

export interface ReportSectionPair {
  id: string;
  title_fr: string;
  title_en: string;
  content_fr: string;
  content_en: string;
  is_safeguard?: boolean;
}

export interface UserReportMetadata {
  char_count_total?: number;
  char_count_fr?: number;
  char_count_en?: number;
  word_count_total?: number;
  estimated_tokens?: number;
  reading_time_minutes?: number;
  detected_diagrams_count?: number;
  has_safeguard_epistemique?: boolean;
  version?: string;
  [key: string]: unknown;
}

export interface UserReport {
  id: string;
  user_id: string;
  slug: string;
  title: string;
  glyph: string | null;
  tier: string | null;
  orientation: string | null;
  tags: string[];
  content_md: string;
  imported_by: string | null;
  created_at: string;
  updated_at: string;
  read_at: string | null;

  // AEGIS V3.2 clinical pack fields (optional for backward compatibility)
  level?: number | null;
  level_code?: string | null;
  prism_code?: string | null;
  scope?: "intra" | "trans" | null;
  has_safeguard?: boolean;
  pack_files?: UserReportV3PackFiles | null;
  metadata?: UserReportMetadata | null;
}

export interface ParsedReportFrontmatter {
  title?: string;
  titre?: string;
  slug?: string;
  glyphe?: string;
  glyph?: string;
  tier?: string;
  orientation?: string;
  tags?: string[];
  level?: number | string;
  level_code?: string;
  prism?: string;
  prism_code?: string;
  scope?: "intra" | "trans";
  has_safeguard?: boolean;
  [key: string]: unknown;
}
