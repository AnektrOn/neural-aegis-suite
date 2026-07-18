import { supabase } from "@/integrations/supabase/client";
import type { UserReport } from "./types";
import { parseFrontmatter } from "./parseReportMd";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
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

export async function deleteUserReport(id: string): Promise<void> {
  const { error } = await supabase.from("user_reports" as any).delete().eq("id", id);
  if (error) throw error;
}
