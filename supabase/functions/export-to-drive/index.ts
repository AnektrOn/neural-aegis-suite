// Edge function: export-to-drive
// Path: {ROOT_FOLDER}/{ClientName}/{Category}/{YYYY-MM-DD}/{filename}.md
// Uses a DB cache (drive_folder_cache) to guarantee unique folders even under
// massively parallel pg_net calls.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { isInternalRequest } from "../_shared/internalAuth.ts";
import { corsHeaders as sdkCorsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { HOUSES72_BAREME_MD } from "./houses72-bareme.ts";
import { EXPORT_ROOT, USER_EXPORT_TABLES, readAllRows, categoryForTable } from "./full-export.ts";
import { completedVoiceFeedback, voiceFeedbackDocument, type VoiceFeedback } from "./voice-export.ts";
import { buildLogosTranscript } from "./logos-transcript.ts";

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

async function uploadMarkdown(parentId: string, filename: string, content: string, mimeType = "text/markdown", properties?: Record<string, string>): Promise<string> {
  const boundary = "aegis_" + crypto.randomUUID();
  const metadata = { name: filename, parents: [parentId], mimeType, ...(properties ? { appProperties: properties } : {}) };
  const body =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\nContent-Type: ${mimeType}; charset=UTF-8\r\n\r\n${content}\r\n--${boundary}--`;

  const r = await fetch(`${GATEWAY}/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true`, {
    method: "POST",
    headers: gwHeaders({ "Content-Type": `multipart/related; boundary=${boundary}` }),
    body,
  });
  if (!r.ok) throw new Error(`Drive upload failed ${r.status}: ${await r.text()}`);
  const j = await r.json();
  return j.id as string;
}

async function upsertVerifiedMarkdown(parentId: string, filename: string, content: string): Promise<string> {
  const q = `name='${filename.replace(/'/g, "\\'")}' and '${parentId}' in parents and trashed=false`;
  const existing = await fetch(`${GATEWAY}/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id)&supportsAllDrives=true`, { headers: gwHeaders() });
  if (!existing.ok) throw new Error(`Drive list failed ${existing.status}: ${await existing.text()}`);
  const files = (await existing.json()).files ?? [];
  let fileId = files[0]?.id as string | undefined;
  if (fileId) {
    const update = await fetch(`${GATEWAY}/upload/drive/v3/files/${fileId}?uploadType=media&supportsAllDrives=true`, {
      method: "PATCH", headers: gwHeaders({ "Content-Type": "text/markdown; charset=UTF-8" }), body: content,
    });
    if (!update.ok) throw new Error(`Drive update failed ${update.status}: ${await update.text()}`);
  } else fileId = await uploadMarkdown(parentId, filename, content);
  for (const duplicate of files.slice(1)) await trashDriveFolder(duplicate.id);
  const verify = await fetch(`${GATEWAY}/drive/v3/files/${fileId}?fields=id,parents,size&supportsAllDrives=true`, { headers: gwHeaders() });
  if (!verify.ok) throw new Error(`Drive readback failed ${verify.status}: ${await verify.text()}`);
  const saved = await verify.json();
  if (!saved.parents?.includes(parentId) || Number(saved.size) !== new TextEncoder().encode(content).length) throw new Error("Drive readback mismatch");
  return fileId;
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
  if (c === "logos") return "Logos";
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
    const auth = req.headers.get("Authorization") || "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);
    // The internal secret lives only in a private database table (rotated); the old committed value is no longer accepted.
    const isInternal = await isInternalRequest(req, admin);
    const body = await req.json().catch(() => ({}));

    if (body.action === "export_logos_transcript") {
      // Post-call payloads are trusted only from the server, never from a member/admin browser.
      if (!serviceSecret || auth !== `Bearer ${serviceSecret}`) return new Response(JSON.stringify({ error: "Service role required" }), { status: 403, headers: corsHeaders });
      let doc: ReturnType<typeof buildLogosTranscript>;
      try { doc = buildLogosTranscript(body); }
      catch (error) { return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), { status: 400, headers: corsHeaders }); }
      const { data: profile, error: profileError } = await admin.from("profiles").select("display_name").eq("id", doc.user_id).maybeSingle();
      if (profileError) throw profileError;
      if (!profile) return new Response(JSON.stringify({ error: "Profile not found" }), { status: 404, headers: corsHeaders });
      const token = crypto.randomUUID();
      const { data: claim, error: claimError } = await admin.rpc("claim_logos_transcript_export", { p_conversation_id: doc.elevenlabs_conversation_id, p_user_id: doc.user_id, p_date: doc.date, p_client_name: sanitize(profile.display_name || doc.user_id), p_token: token });
      if (claimError) return new Response(JSON.stringify({ error: claimError.message }), { status: 409, headers: corsHeaders });
      if (!claim?.claimed) return new Response(JSON.stringify({ error: "Export in progress", retryable: true }), { status: 409, headers: { ...corsHeaders, "Retry-After": "5" } });
      try {
        const clientName = claim.client_name;
        const clientId = await findOrCreateFolder(admin, ROOT_FOLDER_ID, clientName);
        const categoryId = await findOrCreateFolder(admin, clientId, "Logos");
        const dateId = await findOrCreateFolder(admin, categoryId, doc.date);
        const hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(doc.content)))).map(b => b.toString(16).padStart(2, "0")).join("");
        // Recover a file created before a process crash by its conversation appProperty.
        const q = `'${dateId}' in parents and trashed=false and appProperties has { key='aegis_logos_conversation' and value='${doc.elevenlabs_conversation_id}' }`;
        const list = await fetch(`${GATEWAY}/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id)&supportsAllDrives=true`, { headers: gwHeaders() });
        if (!list.ok) throw new Error(`Drive list failed ${list.status}: ${await list.text()}`);
        const files = (await list.json()).files ?? [];
        let fileId: string = files[0]?.id ?? claim.file_id;
        const properties = { aegis_logos_conversation: doc.elevenlabs_conversation_id };
        if (fileId) {
          const boundary = `aegis_${crypto.randomUUID()}`;
          const data = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify({ name: doc.filename, mimeType: doc.mimeType, appProperties: properties })}\r\n--${boundary}\r\nContent-Type: ${doc.mimeType}; charset=UTF-8\r\n\r\n${doc.content}\r\n--${boundary}--`;
          const response = await fetch(`${GATEWAY}/upload/drive/v3/files/${fileId}?uploadType=multipart&supportsAllDrives=true`, { method: "PATCH", headers: gwHeaders({ "Content-Type": `multipart/related; boundary=${boundary}` }), body: data });
          if (!response.ok) throw new Error(`Drive update failed ${response.status}: ${await response.text()}`);
        } else fileId = await uploadMarkdown(dateId, doc.filename, doc.content, doc.mimeType, properties);
        const verify = await fetch(`${GATEWAY}/drive/v3/files/${fileId}?fields=id,name,parents,size,mimeType&supportsAllDrives=true`, { headers: gwHeaders() });
        if (!verify.ok) throw new Error(`Drive readback failed ${verify.status}: ${await verify.text()}`);
        const saved = await verify.json();
        if (saved.name !== doc.filename || saved.mimeType !== doc.mimeType || !saved.parents?.includes(dateId) || Number(saved.size) !== new TextEncoder().encode(doc.content).length) throw new Error("LOGOS readback mismatch");
        for (const duplicate of files.slice(1)) await trashDriveFolder(duplicate.id);
        const path = `${clientName}/Logos/${doc.date}/${doc.filename}`;
        const { error: saveError } = await admin.from("logos_transcript_exports").update({ file_id: fileId, file_path: path, format: doc.format, content_hash: hash, lease_token: null, lease_until: null, updated_at: new Date().toISOString() }).eq("conversation_id", doc.elevenlabs_conversation_id).eq("lease_token", token);
        if (saveError) throw saveError;
        return new Response(JSON.stringify({ success: true, verified: true, fileId, path, format: doc.format, elevenlabs_conversation_id: doc.elevenlabs_conversation_id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } catch (error) {
        await admin.from("logos_transcript_exports").update({ lease_token: null, lease_until: null }).eq("conversation_id", doc.elevenlabs_conversation_id).eq("lease_token", token);
        throw error;
      }
    }

    if (!isInternal) {
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: auth } } });
      const { data: { user } } = await userClient.auth.getUser();
      if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
      const { data: role } = await admin.from("user_roles").select("role").eq("user_id", user.id).in("role", ["admin", "superadmin"]).limit(1).maybeSingle();
      const ownVoiceExport = body.action === "export_voice" && body.user_id === user.id && user.is_anonymous !== true;
      if (!role && !ownVoiceExport) return new Response(JSON.stringify({ error: "Admin required" }), { status: 403, headers: corsHeaders });
    }

    if (body.action === "export_voice") {
      if (typeof body.user_id !== "string" || !/^[0-9a-f-]{36}$/i.test(body.user_id)) return new Response(JSON.stringify({ error: "Valid user_id required" }), { status: 400, headers: corsHeaders });
      const { data: profile, error: profileError } = await admin.from("profiles").select("display_name").eq("id", body.user_id).single();
      if (profileError) throw profileError;
      const clientName = sanitize(profile.display_name || body.user_id);
      const batches = await readAllRows((from, to) => admin.from("daily_voice_prompts").select("*").eq("user_id", body.user_id).order("id").range(from, to));
      const feedbacks = await readAllRows((from, to) => admin.from("voice_session_feedbacks").select("*").eq("user_id", body.user_id).order("id").range(from, to)) as VoiceFeedback[];
      const files: Array<{ path: string; fileId: string }> = [];
      if (batches.length || feedbacks.some(completedVoiceFeedback)) {
        const clientId = await findOrCreateFolder(admin, ROOT_FOLDER_ID, clientName);
        const categoryId = await findOrCreateFolder(admin, clientId, "Voice");
        for (const raw of batches) {
          const row = raw as { id: string; date: string; prompts: unknown; batch_time: string };
          const dateId = await findOrCreateFolder(admin, categoryId, row.date);
          const filename = `${row.date}_prompts_${row.id}.md`;
          const content = `# Prompts vocaux — ${row.date} — ${row.batch_time}\n\n\`\`\`json\n${JSON.stringify(row.prompts, null, 2)}\n\`\`\`\n`;
          const fileId = await upsertVerifiedMarkdown(dateId, filename, content);
          files.push({ path: `${clientName}/Voice/${row.date}/${filename}`, fileId });
        }
        for (const row of feedbacks.filter(completedVoiceFeedback)) {
          const doc = voiceFeedbackDocument(row);
          const dateId = await findOrCreateFolder(admin, categoryId, doc.date);
          const fileId = await upsertVerifiedMarkdown(dateId, doc.filename, doc.content);
          const path = `${clientName}/Voice/${doc.date}/${doc.filename}`;
          const { error } = await admin.from("voice_session_feedbacks").update({ exported_to_drive: true, drive_file_path: path }).eq("id", row.id).eq("user_id", body.user_id).eq("transcript", row.transcript).eq("duration_seconds", row.duration_seconds);
          if (error) throw error;
          files.push({ path, fileId });
        }
      }
      return new Response(JSON.stringify({ success: true, verified: true, batches: batches.length, completed_sessions: feedbacks.filter(completedVoiceFeedback).length, files }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

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
          // Large accounts can be exported one category per call to stay under the request time limit.
          if (Array.isArray(body.categories) && !body.categories.includes(category)) continue;
          // Live triggers send only the tables that just changed.
          if (Array.isArray(body.tables) && !body.tables.includes(table)) continue;
          docs.push([category, `${today}_${table}.md`, `# ${category} — ${table} — ${clientName}\n\nExporté le ${new Date().toISOString()}\n\nUser ID: ${p.id}\n\n## ${table} (${rows.length})\n\n` + "```json\n" + JSON.stringify(rows, null, 2) + "\n```\n"]);
        }
        // Maisons answers are only interpretable with the scoring grid alongside them.
        if (data.houses72_responses?.length && (!Array.isArray(body.categories) || body.categories.includes("Quizz")) && (!Array.isArray(body.tables) || body.tables.includes("houses72_responses"))) docs.push(["Quizz", `${today}_houses72_bareme.md`, HOUSES72_BAREME_MD]);
        for (const [category, filename, md] of docs) {
          const catId = await findOrCreateFolder(admin, clientId, category);
          const dateId = await findOrCreateFolder(admin, catId, today);
          // Re-running the export replaces same-day files instead of duplicating them.
          const q = `name='${filename.replace(/'/g, "\\'")}' and '${dateId}' in parents and trashed=false`;
          const existing = await fetch(`${GATEWAY}/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id)&supportsAllDrives=true&includeItemsFromAllDrives=true`, { headers: gwHeaders() });
          if (!existing.ok) throw new Error(`Drive list failed ${existing.status}: ${await existing.text()}`);
          for (const f of (await existing.json()).files ?? []) await trashDriveFolder(f.id);
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
          try { await exportUser(profile); console.log("export_all verified:", profile.id); }
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
