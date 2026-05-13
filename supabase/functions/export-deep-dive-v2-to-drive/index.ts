// Edge Function: export-deep-dive-v2-to-drive
// Uploads a Deep Dive V2 report (user or admin variant) to Google Drive
// via the Lovable Google Drive connector gateway.
//
// Folder layout: {ROOT_FOLDER_ID}/{ClientName}/DeepDiveV2/{filename}
//
// POST body:
//   {
//     userId:       string  (required, target user)
//     assessmentId: string? (optional)
//     exportType:   "user" | "admin"
//     format?:      "markdown" | "json"   (default: markdown)
//     content?:     string                 (pre-rendered markdown)
//     payload?:     object                 (raw JSON when format=json)
//     filenameStem?: string                (optional override)
//   }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GATEWAY = "https://connector-gateway.lovable.dev/google_drive";
const FOLDER_MIME = "application/vnd.google-apps.folder";
const ROOT_FOLDER_ID = "1iSKGS57UVxgYK39EzzdjN3Ef-ABdyfYq";

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
  const r = await fetch(`${GATEWAY}/drive/v3/files?supportsAllDrives=true`, {
    method: "POST",
    headers: gwHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ name, mimeType: FOLDER_MIME, parents: [parentId] }),
  });
  if (!r.ok) throw new Error(`Drive create failed ${r.status}: ${await r.text()}`);
  const j = await r.json();
  return j.id as string;
}

async function findOrCreateFolder(admin: any, parentId: string, name: string): Promise<string> {
  const { data: cached } = await admin
    .from("drive_folder_cache")
    .select("drive_id")
    .eq("parent_id", parentId)
    .eq("name", name)
    .maybeSingle();
  if (cached?.drive_id) return cached.drive_id;

  const existing = await listChildFolders(parentId, name);
  let driveId: string;
  if (existing.length > 0) {
    driveId = existing[0];
    for (const dup of existing.slice(1)) await trashDriveFolder(dup);
  } else {
    driveId = await createDriveFolder(parentId, name);
  }

  const { data: inserted, error } = await admin
    .from("drive_folder_cache")
    .insert({ parent_id: parentId, name, drive_id: driveId })
    .select("drive_id")
    .single();

  if (error) {
    const { data: winner } = await admin
      .from("drive_folder_cache")
      .select("drive_id")
      .eq("parent_id", parentId)
      .eq("name", name)
      .single();
    if (winner && winner.drive_id !== driveId && existing.length === 0) {
      await trashDriveFolder(driveId);
    }
    return winner!.drive_id;
  }
  return inserted!.drive_id;
}

async function uploadFile(
  parentId: string,
  filename: string,
  content: string,
  mimeType: string,
): Promise<{ id: string; name: string; webViewLink: string | null }> {
  const boundary = "aegis_" + crypto.randomUUID();
  const metadata = { name: filename, parents: [parentId], mimeType };
  const body =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\nContent-Type: ${mimeType}; charset=UTF-8\r\n\r\n${content}\r\n--${boundary}--`;

  const r = await fetch(
    `${GATEWAY}/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id,name,webViewLink`,
    {
      method: "POST",
      headers: gwHeaders({ "Content-Type": `multipart/related; boundary=${boundary}` }),
      body,
    },
  );
  if (!r.ok) throw new Error(`Drive upload failed ${r.status}: ${await r.text()}`);
  const j = await r.json();
  return { id: j.id, name: j.name, webViewLink: j.webViewLink ?? null };
}

function sanitize(s: string): string {
  return (s || "Inconnu").replace(/[\\/:*?"<>|]/g, "_").trim().slice(0, 120) || "Inconnu";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    const auth = req.headers.get("Authorization") || "";
    if (!auth.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: auth } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const userId: string | undefined = body.userId;
    const assessmentId: string | undefined = body.assessmentId ?? body.submissionId;
    const exportType: "user" | "admin" = body.exportType;
    const format: "markdown" | "json" = body.format === "json" ? "json" : "markdown";
    const content: string | undefined = body.content;
    const payload = body.payload;
    const filenameStem: string | undefined = body.filenameStem;

    if (!userId || !exportType || !["user", "admin"].includes(exportType)) {
      return new Response(JSON.stringify({ error: "Missing/invalid fields: userId, exportType" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roleRow } = await admin
      .from("user_roles").select("role")
      .eq("user_id", user.id).eq("role", "admin").maybeSingle();
    const isAdmin = !!roleRow;

    if (exportType === "admin" && !isAdmin) {
      return new Response(JSON.stringify({ error: "Admin role required for admin export" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (exportType === "user" && user.id !== userId && !isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden: cannot export another user's report" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await admin
      .from("profiles").select("display_name")
      .eq("id", userId).maybeSingle();
    const clientName = sanitize(profile?.display_name || userId);

    let fileBody: string;
    let mimeType: string;
    let ext: string;

    if (format === "json") {
      const obj = payload ?? { note: "no payload provided", content: content ?? null };
      fileBody = JSON.stringify(
        {
          exportType,
          generatedAt: new Date().toISOString(),
          userId,
          assessmentId: assessmentId ?? null,
          generatedBy: user.id,
          data: obj,
        },
        null, 2,
      );
      mimeType = "application/json";
      ext = "json";
    } else {
      if (typeof content !== "string" || !content.trim()) {
        return new Response(JSON.stringify({ error: "Missing 'content' (markdown report) for format=markdown" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const meta = [
        `<!--`,
        `exportType: ${exportType}`,
        `generatedAt: ${new Date().toISOString()}`,
        `userId: ${userId}`,
        `assessmentId: ${assessmentId ?? "null"}`,
        `generatedBy: ${user.id}`,
        `-->`,
        "",
      ].join("\n");
      fileBody = meta + content;
      mimeType = "text/markdown";
      ext = "md";
    }

    // ---- Fetch ALL related data (deep dive + quiz + archetypes) ----
    const fullData = await fetchFullDeepDiveData(admin, userId, assessmentId);

    if (format === "json") {
      // Merge into JSON
      const parsed = JSON.parse(fileBody);
      parsed.data = { client: parsed.data, fullExport: fullData };
      fileBody = JSON.stringify(parsed, null, 2);
    } else {
      // Append a structured appendix + raw JSON dump to the markdown
      const appendix = renderFullDataAppendix(fullData);
      fileBody = fileBody + "\n\n" + appendix;
    }

    const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const stem = sanitize(filenameStem || `deep-dive-v2-${exportType}-${clientName}`);
    const fileName = `${ts}_${stem}.${ext}`;

    // {ROOT}/{ClientName}/DeepDiveV2/
    const clientFolderId = await findOrCreateFolder(admin, ROOT_FOLDER_ID, clientName);
    const ddFolderId = await findOrCreateFolder(admin, clientFolderId, "DeepDiveV2");
    const uploaded = await uploadFile(ddFolderId, fileName, fileBody, mimeType);

    // Also drop a companion JSON next to the markdown for full machine-readable dump
    if (format !== "json") {
      try {
        const jsonName = `${ts}_${stem}.full.json`;
        await uploadFile(
          ddFolderId,
          jsonName,
          JSON.stringify({ exportType, generatedAt: new Date().toISOString(), userId, assessmentId: assessmentId ?? null, fullExport: fullData }, null, 2),
          "application/json",
        );
      } catch (e) {
        console.error("companion JSON upload failed:", e);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        exportType,
        fileId: uploaded.id,
        fileName: uploaded.name,
        webViewLink: uploaded.webViewLink,
        path: `${clientName}/DeepDiveV2/${fileName}`,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("export-deep-dive-v2-to-drive error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
