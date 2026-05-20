import { supabase } from "@/integrations/supabase/client";
import type { AnalysisMode, ArchetypePole } from "@/lib/archetype-cartography/types";
import type {
  CartographyManifest,
  ParsedCartographyFile,
} from "@/lib/cartography-folder-import";

export interface DbCartographySection {
  id: string;
  sectionKey: string;
  reportCode: string;
  title: string | null;
  markdown: string;
  sortOrder: number;
}

export interface DbCartographyBundle {
  id: string;
  userId: string;
  pole: ArchetypePole;
  mode: AnalysisMode;
  status: "draft" | "published";
  meta: Record<string, unknown>;
  publishedAt: string | null;
  sections: DbCartographySection[];
}

function mapBundleRow(
  row: {
    id: string;
    user_id: string;
    pole: string;
    mode: string;
    status: string;
    meta: unknown;
    published_at: string | null;
    cartography_bundle_sections?: Array<{
      id: string;
      section_key: string;
      report_code: string;
      title: string | null;
      markdown: string;
      sort_order: number;
    }>;
  },
): DbCartographyBundle {
  const sections = (row.cartography_bundle_sections ?? [])
    .map((s) => ({
      id: s.id,
      sectionKey: s.section_key,
      reportCode: s.report_code,
      title: s.title,
      markdown: s.markdown,
      sortOrder: s.sort_order,
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return {
    id: row.id,
    userId: row.user_id,
    pole: row.pole as ArchetypePole,
    mode: row.mode as AnalysisMode,
    status: row.status as "draft" | "published",
    meta: (row.meta as Record<string, unknown>) ?? {},
    publishedAt: row.published_at,
    sections,
  };
}

const BUNDLE_SELECT = `
  id,
  user_id,
  pole,
  mode,
  status,
  meta,
  published_at,
  cartography_bundle_sections (
    id,
    section_key,
    report_code,
    title,
    markdown,
    sort_order
  )
`;

/** Rapport publié pour l'utilisateur connecté (app user). */
export async function fetchPublishedCartographyBundle(
  userId: string,
  pole: ArchetypePole,
  mode: AnalysisMode,
): Promise<DbCartographyBundle | null> {
  try {
    const { data, error } = await supabase
      .from("cartography_bundles")
      .select(BUNDLE_SELECT)
      .eq("user_id", userId)
      .eq("pole", pole)
      .eq("mode", mode)
      .eq("status", "published")
      .maybeSingle();

    if (error) {
      console.error("[cartography] fetch published", error.message);
      throw new Error(error.message);
    }
    if (!data) return null;
    return mapBundleRow(data);
  } catch (err) {
    console.error("[cartography] fetch published critical", err);
    return null;
  }
}

/** Admin : brouillon ou publié. */
export async function fetchCartographyBundleAdmin(
  userId: string,
  pole: ArchetypePole,
  mode: AnalysisMode,
): Promise<DbCartographyBundle | null> {
  try {
    const { data, error } = await supabase
      .from("cartography_bundles")
      .select(BUNDLE_SELECT)
      .eq("user_id", userId)
      .eq("pole", pole)
      .eq("mode", mode)
      .maybeSingle();

    if (error) {
      console.error("[cartography] fetch admin", error.message);
      throw new Error(error.message);
    }
    if (!data) return null;
    return mapBundleRow(data);
  } catch (err) {
    console.error("[cartography] fetch admin critical", err);
    return null;
  }
}

export interface ImportCartographyFolderInput {
  createdBy: string;
  manifest: CartographyManifest | null;
  files: ParsedCartographyFile[];
  defaultUserId?: string;
  publish?: boolean;
}

export interface ImportCartographyFolderResult {
  bundlesUpserted: number;
  sectionsUpserted: number;
  bundleIds: string[];
}

export async function importCartographyFolder(
  input: ImportCartographyFolderInput,
): Promise<ImportCartographyFolderResult> {
  const userId = input.manifest?.user_id ?? input.defaultUserId;
  if (!userId) {
    throw new Error("user_id requis (manifest.json ou sélection utilisateur).");
  }

  const grouped = new Map<string, ParsedCartographyFile[]>();
  for (const f of input.files) {
    const key = `${f.pole}-${f.mode}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(f);
  }

  const publish = input.publish ?? input.manifest?.publish ?? false;
  const metaBase = input.manifest?.meta ?? {};
  const bundleIds: string[] = [];
  let sectionsUpserted = 0;

  for (const [key, groupFiles] of grouped) {
    const [pole, mode] = key.split("-") as [ArchetypePole, AnalysisMode];
    const poleLabel =
      (metaBase.pole_label as string | undefined) ??
      pole.toUpperCase();

    const poleLabels: Record<ArchetypePole, string> = {
      balance: "BALANCE",
      light: "LIGHT",
      shadow: "SHADOW",
    };
    const meta = {
      ...metaBase,
      pole_label: poleLabels[pole] ?? poleLabel,
    };

    const { data: bundle, error: bundleErr } = await supabase
      .from("cartography_bundles")
      .upsert(
        {
          user_id: userId,
          pole,
          mode,
          status: publish ? "published" : "draft",
          meta,
          created_by: input.createdBy,
          published_at: publish ? new Date().toISOString() : null,
        },
        { onConflict: "user_id,pole,mode" },
      )
      .select("id")
      .single();

    if (bundleErr || !bundle) {
      console.error("[cartography] upsert bundle", bundleErr?.message);
      throw new Error(bundleErr?.message ?? "Échec création bundle");
    }

    bundleIds.push(bundle.id);

    const { error: delErr } = await supabase
      .from("cartography_bundle_sections")
      .delete()
      .eq("bundle_id", bundle.id);

    if (delErr) {
      console.error("[cartography] clear sections", delErr.message);
      throw new Error(delErr.message);
    }

    const rows = groupFiles.map((f) => ({
      bundle_id: bundle.id,
      section_key: f.sectionKey,
      report_code: f.reportCode,
      title: f.title,
      markdown: f.markdown,
      sort_order: f.sortOrder,
      source_path: f.relativePath,
    }));

    const { error: secErr } = await supabase.from("cartography_bundle_sections").insert(rows);

    if (secErr) {
      console.error("[cartography] insert sections", secErr.message);
      throw new Error(secErr.message);
    }

    sectionsUpserted += rows.length;
  }

  await supabase.from("admin_import_runs").insert({
    created_by: input.createdBy,
    dry_run: false,
    status: "completed",
    payload: {
      entity_type: "cartography",
      user_id: userId,
      file_count: input.files.length,
      bundle_keys: [...grouped.keys()],
    },
    summary: {
      bundles_upserted: grouped.size,
      sections_upserted: sectionsUpserted,
      published: publish,
    },
  });

  return {
    bundlesUpserted: grouped.size,
    sectionsUpserted,
    bundleIds,
  };
}

export async function setCartographyBundleStatus(
  bundleId: string,
  status: "draft" | "published",
): Promise<void> {
  const { error } = await supabase
    .from("cartography_bundles")
    .update({
      status,
      published_at: status === "published" ? new Date().toISOString() : null,
    })
    .eq("id", bundleId);

  if (error) {
    console.error("[cartography] set status", error.message);
    throw new Error(error.message);
  }
}

export async function listCartographyBundlesForUser(userId: string) {
  const { data, error } = await supabase
    .from("cartography_bundles")
    .select("id, pole, mode, status, meta, published_at, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[cartography] list bundles", error.message);
    throw new Error(error.message);
  }
  return data ?? [];
}
