// Edge function: export-to-drive
// Uses Lovable Google Drive connector (OAuth) to create files in user's Drive.
// Path: My Drive / Aegis / {ClientName} / {Category} / {filename}.md
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-internal-call",
};

const GATEWAY = "https://connector-gateway.lovable.dev/google_drive";
const FOLDER_MIME = "application/vnd.google-apps.folder";

function gwHeaders(extra: Record<string, string> = {}): HeadersInit {
  const lov = Deno.env.get("LOVABLE_API_KEY");
  const gd = Deno.env.get("GOOGLE_DRIVE_API_KEY");
  if (!lov) throw new Error("LOVABLE_API_KEY is not configured");
  if (!gd) throw new Error("GOOGLE_DRIVE_API_KEY is not configured");
  return { Authorization: `Bearer ${lov}`, "X-Connection-Api-Key": gd, ...extra };
}

async function findOrCreateFolder(name: string, parentId: string | null): Promise<string> {
  const safe = name.replace(/'/g, "\\'");
  const parentClause = parentId ? `and '${parentId}' in parents` : "and 'root' in parents";
  const q = `name='${safe}' and mimeType='${FOLDER_MIME}' ${parentClause} and trashed=false`;
  const url = `${GATEWAY}/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)&spaces=drive`;
  const r = await fetch(url, { headers: gwHeaders() });
  if (!r.ok) throw new Error(`Drive list folder failed ${r.status}: ${await r.text()}`);
  const data = await r.json();
  if (data.files?.[0]?.id) return data.files[0].id;

  const body = {
    name,
    mimeType: FOLDER_MIME,
    parents: parentId ? [parentId] : undefined,
  };
  const create = await fetch(`${GATEWAY}/drive/v3/files`, {
    method: "POST",
    headers: gwHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });
  if (!create.ok) throw new Error(`Drive create folder failed ${create.status}: ${await create.text()}`);
  const created = await create.json();
  return created.id as string;
}

async function uploadMarkdown(parentId: string, filename: string, content: string): Promise<string> {
  const boundary = "aegis_" + crypto.randomUUID();
  const metadata = { name: filename, parents: [parentId], mimeType: "text/markdown" };
  const body =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\nContent-Type: text/markdown; charset=UTF-8\r\n\r\n${content}\r\n--${boundary}--`;

  const r = await fetch(`${GATEWAY}/upload/drive/v3/files?uploadType=multipart`, {
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

    const { user_id, category, filename, content_md } = await req.json();
    if (!user_id || !category || !filename || typeof content_md !== "string") {
      return new Response(JSON.stringify({ error: "Missing fields: user_id, category, filename, content_md" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: profile } = await admin.from("profiles").select("display_name").eq("id", user_id).maybeSingle();
    const clientName = sanitize(profile?.display_name || user_id);
    const cat = sanitize(category);
    const fname = sanitize(filename).endsWith(".md") ? sanitize(filename) : `${sanitize(filename)}.md`;

    const aegisId = await findOrCreateFolder("Aegis", null);
    const clientId = await findOrCreateFolder(clientName, aegisId);
    const catId = await findOrCreateFolder(cat, clientId);
    const fileId = await uploadMarkdown(catId, fname, content_md);

    return new Response(JSON.stringify({ success: true, fileId, path: `Aegis/${clientName}/${cat}/${fname}` }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("export-to-drive error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
