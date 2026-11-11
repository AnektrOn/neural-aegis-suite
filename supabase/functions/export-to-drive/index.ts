// Edge function: export-to-drive
// Path: {ROOT_FOLDER}/{ClientName}/{Category}/{YYYY-MM-DD}/{filename}.md
// Uses a DB cache (drive_folder_cache) to guarantee unique folders even under
// massively parallel pg_net calls.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders as sdkCorsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { HOUSES72_BAREME_MD } from "./houses72-bareme.ts";
import { EXPORT_ROOT, USER_EXPORT_TABLES, readAllRows, categoryForTable } from "./full-export.ts";

const corsHeaders = {
  ...sdkCorsHeaders,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-internal-secret",
};

const GATEWAY = "https://connector-gateway.lovable.dev/google_drive";
const FOLDER_MIME = "application/vnd.google-apps.folder";
const ROOT_FOLDER_ID = EXPORT_ROOT;

function gwHeaders(extra: Record<string, string> = {}): HeadersInit {
  const lov = Deno.env.get("LOVABLE_API_KEY");
  const gd = Deno.env.get("GOOGLE_DRIVE_API_KEY");
  if (!lov) throw new Error("LOVABLE_API_KEY is not configured");
  if (!gd) throw new Error("GOOGLE_DRIVE_API_KEY is not configured");
  return { Authorization: `Bearer ${lov}`, "X-Connection-Api-Key": gd, ...extra };
}

async function trashDriveFolder(id: string): Promise<boolean> {
  try {
    const r = await fetch(`${GATEWAY}/drive/v3/files/${id}?supportsAllDrives=true`, {
      method: "PATCH",
      headers: gwHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ trashed: true }),
    });
    return r.ok;
  } catch { return false; }
}

async function listChildFolders(parentId: string, name: string): Promise<string[]> {
  const safe = name.replace(/'/g, "\\'");
  const q = `name='${safe}' and mimeType='${FOLDER_MIME}' and '${parentId}' in parents and trashed=false`;
  const url = `${GATEWAY}/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,createdTime)&orderBy=createdTime&pageSize=100&supportsAllDrives=true&includeItemsFromAllDrives=true`;
  const r = await fetch(url, { headers: gwHeaders() });
  if (!r.ok) throw new Error(`Drive list failed ${r.status}: ${await r.text()}`);
  const data = await r.json();
  return (data.files || []).map((f: any) => f.id);
}

async function createDriveFolder(parentId: string, name: string): Promise<string> {
  const create = await fetch(`${GATEWAY}/drive/v3/files?supportsAllDrives=true`, {
    method: "POST",
    headers: gwHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ name, mimeType: FOLDER_MIME, parents: [parentId] }),
  });
  if (!create.ok) throw new Error(`Drive create failed ${create.status}: ${await create.text()}`);
  const j = await create.json();
  return j.id as string;
}

// Race-safe: cache lookup → list existing → create + INSERT cache with conflict handling
async function findOrCreateFolder(
  admin: any,
  parentId: string,
  name: string,
): Promise<string> {
  // 1. Cache hit?
  const { data: cached } = await admin
    .from("drive_folder_cache")
    .select("drive_id")
    .eq("parent_id", parentId)
    .eq("name", name)
    .maybeSingle();
  if (cached?.drive_id) return cached.drive_id;

  // 2. List existing (handles legacy duplicates)
  const existing = await listChildFolders(parentId, name);
  let driveId: string;
  if (existing.length > 0) {
    driveId = existing[0];
    // trash any extras
    for (const dup of existing.slice(1)) await trashDriveFolder(dup);
  } else {
    // 3. Create in Drive
    driveId = await createDriveFolder(parentId, name);
  }

  // 4. Try to claim the cache slot. If someone else already inserted,
  //    use theirs and trash the folder we just created.
  const { data: inserted, error } = await admin
    .from("drive_folder_cache")
    .insert({ parent_id: parentId, name, drive_id: driveId })
    .select("drive_id")
    .single();

  if (error) {
    // conflict: another instance won. Re-read cache.
    const { data: winner } = await admin
      .from("drive_folder_cache")
      .select("drive_id")
      .eq("parent_id", parentId)
      .eq("name", name)
      .single();
    if (winner && winner.drive_id !== driveId && existing.length === 0) {
      // we created a stray folder, trash it
      await trashDriveFolder(driveId);
    }
    if (!winner?.drive_id) throw new Error("Folder cache claim failed");
    return winner.drive_id;
  }
  if (!inserted?.drive_id) throw new Error("Folder cache insert failed");
  return inserted.drive_id;
}

async function uploadMarkdown(parentId: string, filename: string, content: string): Promise<string> {
  const boundary = "aegis_" + crypto.randomUUID();
  const metadata = { name: filename, parents: [parentId], mimeType: "text/markdown" };
  const body =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\nContent-Type: text/markdown; charset=UTF-8\r\n\r\n${content}\r\n--${boundary}--`;

  const r = await fetch(`${GATEWAY}/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true`, {
    method: "POST",
    headers: gwHeaders({ "Content-Type": `multipart/related; boundary=${boundary}` }),
    body,
  });
  if (!r.ok) throw new Error(`Drive upload failed ${r.status}: ${await r.text()}`);
  const j = await r.json();
  return j.id as string;
}

function sanitize(s: string): string {
  return (s || "Inconnu").replace(/[\\/:*?"<>|]/g, "_").trim().slice(0, 120) || "Inconnu";
}

function mapCategory(cat: string): string {
  const c = (cat || "").toLowerCase();
  if (c === "quiz" || c === "quizz") return "Quizz";
  if (c === "journal" || c === "rapport") return "Rapport";
  if (c === "mood") return "Mood";
  if (c === "decisions" || c === "decision") return "Decisions";
  if (c === "habits" || c === "habit") return "Habits";
  if (c === "toolbox") return "Toolbox";
  if (c === "people") return "People";
  return sanitize(cat);
}

function extractDate(filename: string): string {
  const m = filename.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : new Date().toISOString().slice(0, 10);
}

// Recursive cleanup: list children of `parentId`, group folders by name,
// keep oldest (with most descendants), trash duplicates, recurse.
async function dedupeFolder(admin: any, parentId: string, stats: { trashed: number; kept: number }): Promise<void> {
  const url = `${GATEWAY}/drive/v3/files?q=${encodeURIComponent(`'${parentId}' in parents and mimeType='${FOLDER_MIME}' and trashed=false`)}&fields=files(id,name,createdTime)&orderBy=createdTime&pageSize=1000&supportsAllDrives=true&includeItemsFromAllDrives=true`;
  const r = await fetch(url, { headers: gwHeaders() });
  if (!r.ok) throw new Error(`list children failed ${r.status}: ${await r.text()}`);
  const data = await r.json();
  const folders: Array<{ id: string; name: string }> = data.files || [];

  const groups = new Map<string, string[]>();
  for (const f of folders) {
    const arr = groups.get(f.name) || [];
    arr.push(f.id);
    groups.set(f.name, arr);
  }

  // Process all groups in parallel
  await Promise.all(Array.from(groups.entries()).map(async ([name, ids]) => {
    const keepId = ids[0];
    stats.kept++;
    await admin.from("drive_folder_cache")
      .upsert({ parent_id: parentId, name, drive_id: keepId }, { onConflict: "parent_id,name" });
    // Trash duplicates in parallel
    const trashResults = await Promise.all(ids.slice(1).map(trashDriveFolder));
    stats.trashed += trashResults.filter(Boolean).length;
    // Recurse into kept folder
    await dedupeFolder(admin, keepId, stats);
  }));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const serviceSecret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const exportSecret = Deno.env.get("EXPORT_INTERNAL_SECRET") || "";
    const auth = req.headers.get("Authorization") || "";
    const internalHeader = req.headers.get("x-internal-secret") || "";
    const isInternal =
      (!!serviceSecret && auth === `Bearer ${serviceSecret}`) ||
      (!!exportSecret && internalHeader === exportSecret);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    if (!isInternal) {
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: auth } } });
      const { data: { user } } = await userClient.auth.getUser();
      if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
      const { data: role } = await admin.from("user_roles").select("role").eq("user_id", user.id).in("role", ["admin", "superadmin"]).limit(1).maybeSingle();
      if (!role) return new Response(JSON.stringify({ error: "Admin required" }), { status: 403, headers: corsHeaders });
    }

    const body = await req.json().catch(() => ({}));

    if (body?.action === "dedupe") {
      await admin.from("drive_folder_cache").delete().neq("parent_id", "");
      const stats = { trashed: 0, kept: 0 };
      // Run in background; respond immediately to avoid client timeout
      // @ts-ignore EdgeRuntime is available in Supabase edge runtime
      EdgeRuntime.waitUntil(dedupeFolder(admin, ROOT_FOLDER_ID, stats)
        .then(() => console.log(`dedupe done: kept=${stats.kept} trashed=${stats.trashed}`))
        .catch((e) => console.error("dedupe failed:", e)));
      return new Response(JSON.stringify({ success: true, started: true }),
        { status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (body?.action === "export_user_full" || body?.action === "export_all") {
      if (body.action === "export_user_full" &&
          (typeof body.user_id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.user_id))) {
        return new Response(JSON.stringify({ error: "Valid user_id required" }), { status: 400, headers: corsHeaders });
      }
      const today = new Date().toISOString().slice(0, 10);
      const exportUser = async (p: { id: string; display_name: string | null }) => {
        const data: Record<string, unknown[]> = { profiles: [p] };
        data.profiles = await readAllRows((from, to) => admin.from("profiles").select("*").eq("id", p.id).order("id").range(from, to));
        for (const table of USER_EXPORT_TABLES) {
          data[table] = await readAllRows((from, to) => admin.from(table).select("*").eq("user_id", p.id).order("user_id").range(from, to));
        }
        data.admin_messages = await readAllRows((from, to) => admin.from("admin_messages").select("*").or(`sender_id.eq.${p.id},recipient_id.eq.${p.id}`).order("id").range(from, to));
        const bundleIds = (data.cartography_bundles as { id: string }[]).map(row => row.id);
        data.cartography_bundle_sections = bundleIds.length ? await readAllRows((from, to) => admin.from("cartography_bundle_sections").select("*").in("bundle_id", bundleIds).order("id").range(from, to)) : [];
        // Lease tokens are internal concurrency credentials, not user content.
        data.elevenlabs_drive_folders = data.elevenlabs_drive_folders.map(row => {
          const { sync_claim_token, ...safe } = row as Record<string, unknown>;
          return safe;
        });
        const clientName = sanitize(p.display_name || p.id);
        const counts = Object.fromEntries(Object.entries(data).map(([table, rows]) => [table, rows.length]));
        const clientId = await findOrCreateFolder(admin, ROOT_FOLDER_ID, clientName);
        const files: Array<{ path: string; fileId: string }> = [];
        const docs: Array<[string, string, string]> = [];
        for (const [table, rows] of Object.entries(data)) {
          if (!rows.length) continue;
          const category = categoryForTable(table);
          docs.push([category, `${today}_${table}.md`, `# ${category} — ${table} — ${clientName}\n\nExporté le ${new Date().toISOString()}\n\nUser ID: ${p.id}\n\n## ${table} (${rows.length})\n\n` + "```json\n" + JSON.stringify(rows, null, 2) + "\n```\n"]);
        }
        // Maisons answers are only interpretable with the scoring grid alongside them.
        if (data.houses72_responses?.length) docs.push(["Quizz", `${today}_houses72_bareme.md`, HOUSES72_BAREME_MD]);
        for (const [category, filename, md] of docs) {
          const catId = await findOrCreateFolder(admin, clientId, category);
          const dateId = await findOrCreateFolder(admin, catId, today);
          const fileId = await uploadMarkdown(dateId, filename, md);
          const verify = await fetch(`${GATEWAY}/drive/v3/files/${fileId}?fields=id,parents,size&supportsAllDrives=true`, { headers: gwHeaders() });
          if (!verify.ok) throw new Error(`Drive readback failed ${verify.status}: ${await verify.text()}`);
          const saved = await verify.json();
          if (!saved.parents?.includes(dateId) || Number(saved.size) !== new TextEncoder().encode(md).length) throw new Error(`Drive export readback mismatch for ${filename}`);
          files.push({ path: `${clientName}/${category}/${today}/${filename}`, fileId });
        }
        // Remove the previous single-file "BDD" layout for this user.
        const legacy = await listChildFolders(clientId, "BDD");
        for (const id of legacy) await trashDriveFolder(id);
        if (legacy.length) await admin.from("drive_folder_cache").delete().eq("parent_id", clientId).eq("name", "BDD");
        return { user_id: p.id, display_name: p.display_name, files, counts, removed_bdd: legacy.length, verified: true };
      };
      let query = admin.from("profiles").select("id, display_name").order("id");
      if (body.action === "export_user_full") query = query.eq("id", body.user_id);
      const { data: profiles, error } = await query;
      if (error) throw error;
      if (!profiles?.length) return new Response(JSON.stringify({ error: "No profiles found" }), { status: 404, headers: corsHeaders });
      if (body.action === "export_user_full") {
        const result = await exportUser(profiles[0]);
        return new Response(JSON.stringify({ success: true, ...result }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const runAll = async () => {
        for (const profile of profiles) {
          try { console.log("export_all verified:", JSON.stringify(await exportUser(profile))); }
          catch (error) { console.error(`export_all failed for ${profile.id}:`, error); }
        }
      };
      // @ts-ignore EdgeRuntime is available in Supabase edge runtime
      EdgeRuntime.waitUntil(runAll());
      return new Response(JSON.stringify({ success: true, started: true }), { status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { user_id, category, filename, content_md } = body;
    if (!user_id || !category || !filename || typeof content_md !== "string") {
      return new Response(JSON.stringify({ error: "Missing fields: user_id, category, filename, content_md" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: profile } = await admin.from("profiles").select("display_name").eq("id", user_id).maybeSingle();
    const clientName = sanitize(profile?.display_name || user_id);
    const cat = mapCategory(category);
    const fname = sanitize(filename).endsWith(".md") ? sanitize(filename) : `${sanitize(filename)}.md`;
    const dateFolder = extractDate(fname);

    const resolveAndUpload = async () => {
      const clientId = await findOrCreateFolder(admin, ROOT_FOLDER_ID, clientName);
      const catId    = await findOrCreateFolder(admin, clientId, cat);
      const dateId   = await findOrCreateFolder(admin, catId, dateFolder);
      return await uploadMarkdown(dateId, fname, content_md);
    };
    let fileId: string;
    try {
      fileId = await resolveAndUpload();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (!/\b404\b/.test(msg)) throw e;
      // A cached folder was deleted/moved in Drive: purge the cache and retry once.
      console.warn("export-to-drive: stale folder cache, purging and retrying:", msg);
      await admin.from("drive_folder_cache").delete().neq("parent_id", "");
      fileId = await resolveAndUpload();
    }

    return new Response(JSON.stringify({ success: true, fileId, path: `${clientName}/${cat}/${dateFolder}/${fname}` }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("export-to-drive error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
