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
}

export interface ParsedReportFrontmatter {
  title?: string;
  slug?: string;
  glyphe?: string;
  glyph?: string;
  tier?: string;
  orientation?: string;
  tags?: string[];
  [key: string]: unknown;
}
