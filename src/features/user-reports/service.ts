import { supabase } from "@/integrations/supabase/client";
import type { UserReport, UserReportV3PackFiles, UserReportMetadata } from "./types";
import { parseFrontmatter } from "./parseReportMd";

export function slugify(input?: string | null): string {
  return String(input || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "report";
}

export async function listUserReports(userId: string): Promise<UserReport[]> {
  const { data, error } = await supabase
    .from("user_reports" as any)
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as UserReport[];
}

export interface ImportUserReportInput {
  userId: string;
  filename: string;
  contentMd: string;
  importedBy?: string | null;
}

export async function importUserReport(input: ImportUserReportInput): Promise<UserReport> {
  const { frontmatter } = parseFrontmatter(input.contentMd);
  const baseName = input.filename.replace(/\.md$/i, "");
  const title = (frontmatter.title as string) || (frontmatter.titre as string) || baseName;
  const slug = (frontmatter.slug as string) || slugify(baseName || title);
  const tags = Array.isArray(frontmatter.tags) ? (frontmatter.tags as string[]) : [];

  const row = {
    user_id: input.userId,
    slug,
    title,
    glyph: (frontmatter.glyphe as string) || (frontmatter.glyph as string) || null,
    tier: frontmatter.tier ? String(frontmatter.tier) : null,
    orientation: (frontmatter.orientation as string) || null,
    tags,
    content_md: input.contentMd,
    imported_by: input.importedBy ?? null,
  };

  const { data, error } = await supabase
    .from("user_reports" as any)
    .upsert(row, { onConflict: "user_id,slug" })
    .select("*")
    .single();
  if (error) throw error;
  return data as unknown as UserReport;
}

export interface ImportUserReportV3PackInput {
  userId: string;
  slug?: string;
  title: string;
  glyph?: string | null;
  tier?: string | null;
  orientation?: string | null;
  level: number;
  levelCode: string;
  prismCode?: string | null;
  scope: "intra" | "trans";
  hasSafeguard: boolean;
  packFiles: UserReportV3PackFiles;
  metadata?: UserReportMetadata;
  tags?: string[];
  importedBy?: string | null;
}

export async function importUserReportV3Pack(input: ImportUserReportV3PackInput): Promise<UserReport> {
  const safeLevelCode = input.levelCode || `LEVEL_${input.level ?? 0}`;
  const safeTitle = input.title || "Diagnostic Clinique";
  const slug = input.slug || slugify(`${safeLevelCode}-${safeTitle}-${Date.now()}`);
  const tags = input.tags ?? [];
  if (safeLevelCode && !tags.includes(safeLevelCode)) {
    tags.push(safeLevelCode);
  }
  if (input.prismCode && !tags.includes(input.prismCode)) {
    tags.push(input.prismCode);
  }

  const safeScope = input.scope === "trans" ? "trans" : "intra";

  const row = {
    user_id: input.userId,
    slug,
    title: safeTitle,
    glyph: input.glyph ?? "⚖️",
    tier: input.tier ?? String(input.level ?? 0),
    orientation: input.orientation ?? (safeScope === "intra" ? "Intra-Prisme" : "Trans-Prisme"),
    tags,
    content_md: input.packFiles?.rapport_md || "", // Guaranteed fallback for legacy readers & NOT NULL constraint
    imported_by: input.importedBy ?? null,
    level: typeof input.level === "number" && !isNaN(input.level) ? input.level : 0,
    level_code: safeLevelCode,
    prism_code: input.prismCode ?? null,
    scope: safeScope,
    has_safeguard: Boolean(input.hasSafeguard),
    pack_files: input.packFiles || { rapport_md: "" },
    metadata: input.metadata ?? {},
    read_at: null, // Unread by default for client notification
  };

  const { data, error } = await supabase
    .from("user_reports" as any)
    .upsert(row, { onConflict: "user_id,slug" })
    .select("*")
    .single();
  if (error) throw error;
  return data as unknown as UserReport;
}

export async function deleteUserReport(id: string): Promise<void> {
  const { error } = await supabase.from("user_reports" as any).delete().eq("id", id);
  if (error) throw error;
}

export async function markUserReportRead(id: string): Promise<void> {
  const { error } = await supabase
    .from("user_reports" as any)
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .is("read_at", null);
  if (error) console.error("[UserReports] markRead failed", error);
}
