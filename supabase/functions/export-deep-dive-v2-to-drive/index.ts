// Edge Function: export-deep-dive-v2-to-drive
// Uploads a Deep Dive V2 report (user or admin variant) to Google Drive,
// using a Google Service Account (JWT → OAuth2 access token).
//
// POST body:
//   {
//     userId:       string  (required, target user)
//     assessmentId: string? (optional — referenced session, included in metadata)
//     exportType:   "user" | "admin"
//     format?:      "markdown" | "json"   (default: markdown)
//     content?:     string                 (pre-rendered report from frontend)
//     payload?:     object                 (raw JSON when format=json)
//     filenameStem?: string                (optional override)
//   }
//
// Required secrets:
//   GOOGLE_CLIENT_EMAIL  (alias: GOOGLE_SERVICE_ACCOUNT_EMAIL)
//   GOOGLE_PRIVATE_KEY
//   GOOGLE_DRIVE_USER_FOLDER_ID
//   GOOGLE_DRIVE_ADMIN_FOLDER_ID
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   SUPABASE_ANON_KEY

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/* -------------------------------------------------------------------------- */
/* Google Service Account → access_token                                      */
/* -------------------------------------------------------------------------- */

function b64url(input: ArrayBuffer | string): string {
  const bytes =
    typeof input === "string"
      ? new TextEncoder().encode(input)
      : new Uint8Array(input);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/=+$/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const cleaned = pem
    .replace(/-----BEGIN [^-]+-----/g, "")
    .replace(/-----END [^-]+-----/g, "")
    .replace(/\s+/g, "");
  const bin = atob(cleaned);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

async function getAccessToken(): Promise<string> {
  const clientEmail =
    Deno.env.get("GOOGLE_SERVICE_ACCOUNT_EMAIL") ??
    Deno.env.get("GOOGLE_CLIENT_EMAIL");
  let privateKey = Deno.env.get("GOOGLE_PRIVATE_KEY");
  if (!clientEmail) throw new Error("GOOGLE_CLIENT_EMAIL/GOOGLE_SERVICE_ACCOUNT_EMAIL is not configured");
  if (!privateKey) throw new Error("GOOGLE_PRIVATE_KEY is not configured");
  privateKey = privateKey.replace(/\\n/g, "\n");

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/drive.file",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const unsigned = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(claim))}`;
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(privateKey),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(unsigned),
  );
  const jwt = `${unsigned}.${b64url(sig)}`;

  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  if (!resp.ok) {
    throw new Error(`Token exchange failed ${resp.status}: ${await resp.text()}`);
  }
  const j = await resp.json();
  return j.access_token as string;
}

/* -------------------------------------------------------------------------- */
/* Drive helpers                                                              */
/* -------------------------------------------------------------------------- */

const FOLDER_MIME = "application/vnd.google-apps.folder";

async function findOrCreateFolder(
  token: string,
  parentId: string,
  name: string,
): Promise<string> {
  const safe = name.replace(/'/g, "\\'");
  const q = `name='${safe}' and mimeType='${FOLDER_MIME}' and '${parentId}' in parents and trashed=false`;
  const list = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id)&pageSize=1&supportsAllDrives=true&includeItemsFromAllDrives=true`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!list.ok) throw new Error(`Drive list failed ${list.status}: ${await list.text()}`);
  const data = await list.json();
  if (data.files?.length) return data.files[0].id;

  const create = await fetch(
    `https://www.googleapis.com/drive/v3/files?supportsAllDrives=true`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, mimeType: FOLDER_MIME, parents: [parentId] }),
    },
  );
  if (!create.ok) throw new Error(`Drive create folder failed ${create.status}: ${await create.text()}`);
  const j = await create.json();
  return j.id as string;
}

async function uploadFile(
  token: string,
  parentId: string,
  filename: string,
  content: string,
  mimeType: string,
): Promise<{ id: string; webViewLink: string; name: string }> {
  const boundary = "aegis_" + crypto.randomUUID();
  const metadata = { name: filename, parents: [parentId], mimeType };
  const body =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\nContent-Type: ${mimeType}; charset=UTF-8\r\n\r\n${content}\r\n--${boundary}--`;

  const r = await fetch(
    `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id,name,webViewLink`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    },
  );
  if (!r.ok) throw new Error(`Drive upload failed ${r.status}: ${await r.text()}`);
  return await r.json();
}

function sanitize(s: string): string {
  return (s || "anon").replace(/[\\/:*?"<>|]/g, "_").trim().slice(0, 120) || "anon";
}

/* -------------------------------------------------------------------------- */
/* Handler                                                                    */
/* -------------------------------------------------------------------------- */

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

    // ---- AuthN ----
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

    // ---- Body validation ----
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

    // ---- AuthZ ----
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

    // ---- Resolve folder & filename ----
    const userFolder = Deno.env.get("GOOGLE_DRIVE_USER_FOLDER_ID");
    const adminFolder = Deno.env.get("GOOGLE_DRIVE_ADMIN_FOLDER_ID");
    if (!userFolder || !adminFolder) {
      throw new Error("Google Drive folder IDs are not configured");
    }
    const rootFolder = exportType === "admin" ? adminFolder : userFolder;

    const { data: profile } = await admin
      .from("profiles").select("display_name")
      .eq("id", userId).maybeSingle();
    const clientName = sanitize(profile?.display_name || userId);

    // ---- Build file content ----
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
        null,
        2,
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

    const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const stem = sanitize(filenameStem || `deep-dive-v2-${exportType}-${clientName}`);
    const fileName = `${ts}_${stem}.${ext}`;

    // ---- Upload to Drive ----
    const token = await getAccessToken();
    const clientFolderId = await findOrCreateFolder(token, rootFolder, clientName);
    const uploaded = await uploadFile(token, clientFolderId, fileName, fileBody, mimeType);

    return new Response(
      JSON.stringify({
        success: true,
        exportType,
        fileId: uploaded.id,
        fileName: uploaded.name,
        webViewLink: uploaded.webViewLink ?? null,
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
