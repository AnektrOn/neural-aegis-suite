// Edge function: export-to-drive
// Path: {ROOT_FOLDER}/{ClientName}/{Category}/{YYYY-MM-DD}/{filename}.md
// ROOT_FOLDER_ID is the user-provided shared Drive folder.
// Supports action=cleanup to trash stray top-level "Aegis" folders.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-internal-call",
};

const GATEWAY = "https://connector-gateway.lovable.dev/google_drive";
const FOLDER_MIME = "application/vnd.google-apps.folder";
const ROOT_FOLDER_ID = "1Gqkmqxr3EIymDFvGbC3vc7-ckEG59of8";

// Simple in-memory folder cache (per cold-start) to limit Drive API calls
const folderCache = new Map<string, string>();

function gwHeaders(extra: Record<string, string> = {}): HeadersInit {
  const lov = Deno.env.get("LOVABLE_API_KEY");
  const gd = Deno.env.get("GOOGLE_DRIVE_API_KEY");
  if (!lov) throw new Error("LOVABLE_API_KEY is not configured");
  if (!gd) throw new Error("GOOGLE_DRIVE_API_KEY is not configured");
  return { Authorization: `Bearer ${lov}`, "X-Connection-Api-Key": gd, ...extra };
}

async function findOrCreateFolder(name: string, parentId: string): Promise<string> {
  const cacheKey = `${parentId}/${name}`;
  const cached = folderCache.get(cacheKey);
  if (cached) return cached;

  const safe = name.replace(/'/g, "\\'");
  const q = `name='${safe}' and mimeType='${FOLDER_MIME}' and '${parentId}' in parents and trashed=false`;
  const url = `${GATEWAY}/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)&supportsAllDrives=true&includeItemsFromAllDrives=true`;
  const r = await fetch(url, { headers: gwHeaders() });
  if (!r.ok) throw new Error(`Drive list folder failed ${r.status}: ${await r.text()}`);
  const data = await r.json();
  if (data.files?.[0]?.id) {
    folderCache.set(cacheKey, data.files[0].id);
    return data.files[0].id;
  }

  const create = await fetch(`${GATEWAY}/drive/v3/files?supportsAllDrives=true`, {
    method: "POST",
    headers: gwHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ name, mimeType: FOLDER_MIME, parents: [parentId] }),
  });
  if (!create.ok) throw new Error(`Drive create folder failed ${create.status}: ${await create.text()}`);
  const created = await create.json();
  folderCache.set(cacheKey, created.id);
  return created.id as string;
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

// Map raw category names from triggers to user-friendly folder names
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

// Extract YYYY-MM-DD from a filename starting with timestamp, else today
function extractDate(filename: string): string {
  const m = filename.match(/^(\d{4}-\d{2}-\d{2})/);
  if (m) return m[1];
  return new Date().toISOString().slice(0, 10);
}

async function cleanupStrayAegis(): Promise<{ trashed: number; ids: string[] }> {
  // Trash any "Aegis" folder at My Drive root (created by previous bug)
  const q = `name='Aegis' and mimeType='${FOLDER_MIME}' and trashed=false`;
  const url = `${GATEWAY}/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,parents)&pageSize=1000`;
  const r = await fetch(url, { headers: gwHeaders() });
  if (!r.ok) throw new Error(`list Aegis failed ${r.status}: ${await r.text()}`);
  const data = await r.json();
  // Exclude the configured ROOT folder so we never trash it
  const ids: string[] = (data.files || []).map((f: any) => f.id).filter((id: string) => id !== ROOT_FOLDER_ID);

  let trashed = 0;
  // Parallel batches of 20
  const batchSize = 20;
  for (let i = 0; i < ids.length; i += batchSize) {
    const slice = ids.slice(i, i + batchSize);
    const results = await Promise.all(slice.map((id) =>
      fetch(`${GATEWAY}/drive/v3/files/${id}?supportsAllDrives=true`, {
        method: "PATCH",
        headers: gwHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ trashed: true }),
      }).then((t) => t.ok).catch(() => false)
    ));
    trashed += results.filter(Boolean).length;
  }
  return { trashed, total: ids.length, ids: ids.slice(0, 10) };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const internalSecret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const auth = req.headers.get("Authorization") || "";
    const isInternal = auth === `Bearer ${internalSecret}` || req.headers.get("x-internal-call") === "1";

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    if (!isInternal) {
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: auth } } });
      const { data: { user } } = await userClient.auth.getUser();
      if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
      const { data: role } = await admin.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
      if (!role) return new Response(JSON.stringify({ error: "Admin required" }), { status: 403, headers: corsHeaders });
    }

    const body = await req.json().catch(() => ({}));

    if (body?.action === "cleanup") {
      const result = await cleanupStrayAegis();
      return new Response(JSON.stringify({ success: true, ...result }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
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

    const clientId = await findOrCreateFolder(clientName, ROOT_FOLDER_ID);
    const catId = await findOrCreateFolder(cat, clientId);
    const dateId = await findOrCreateFolder(dateFolder, catId);
    const fileId = await uploadMarkdown(dateId, fname, content_md);

    return new Response(JSON.stringify({ success: true, fileId, path: `${clientName}/${cat}/${dateFolder}/${fname}` }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("export-to-drive error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
