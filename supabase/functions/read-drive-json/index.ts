import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DRIVE_SCOPE_DEFAULT = "https://www.googleapis.com/auth/drive.readonly";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB per file
const MAX_FOLDER_FILES = 100;
const ALLOWED_MIME_PREFIXES = ["application/json", "text/", "application/octet-stream"];
const FOLDER_MIME = "application/vnd.google-apps.folder";

/* ── Google Service Account JWT ─────────────────────────────────── */

function toBase64Url(input: Uint8Array | string): string {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function normalizePrivateKey(rawKey: string): string {
  return rawKey.replace(/\\n/g, "\n").trim();
}

async function createServiceAccountJwt(
  clientEmail: string,
  privateKeyPem: string,
  scopes: string,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = { iss: clientEmail, scope: scopes, aud: GOOGLE_TOKEN_URL, iat: now, exp: now + 3600 };

  const encodedHeader = toBase64Url(JSON.stringify(header));
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  const keyData = normalizePrivateKey(privateKeyPem)
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");

  const binaryKey = Uint8Array.from(atob(keyData), (c) => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(unsignedToken),
  );

  return `${unsignedToken}.${toBase64Url(new Uint8Array(signature))}`;
}

async function getGoogleAccessToken(): Promise<string> {
  const clientEmail = Deno.env.get("GOOGLE_CLIENT_EMAIL");
  const privateKey = Deno.env.get("GOOGLE_PRIVATE_KEY");
  const scopes = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_SCOPES") || DRIVE_SCOPE_DEFAULT;

  if (!clientEmail || !privateKey) throw new Error("Missing GOOGLE_CLIENT_EMAIL or GOOGLE_PRIVATE_KEY.");

  const assertion = await createServiceAccountJwt(clientEmail, privateKey, scopes);
  const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }).toString(),
  });

  if (!tokenRes.ok) {
    const details = await tokenRes.text();
    throw new Error(`Google token error (${tokenRes.status}): ${details}`);
  }

  const tokenJson = await tokenRes.json();
  if (!tokenJson?.access_token) throw new Error("Google token response missing access_token.");
  return tokenJson.access_token as string;
}

/* ── Drive helpers ──────────────────────────────────────────────── */

function extractDriveId(rawInput: string): { id: string; isFolder: boolean } | null {
  const input = rawInput.trim();
  if (!input) return null;

  try {
    const url = new URL(input);

    const folderMatch = url.pathname.match(/\/folders\/([a-zA-Z0-9_-]+)/);
    if (folderMatch?.[1]) return { id: folderMatch[1], isFolder: true };

    const idFromQuery = url.searchParams.get("id");
    if (idFromQuery) return { id: idFromQuery, isFolder: false };

    const filePathMatch = url.pathname.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (filePathMatch?.[1]) return { id: filePathMatch[1], isFolder: false };

    const dPathMatch = url.pathname.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (dPathMatch?.[1]) return { id: dPathMatch[1], isFolder: false };
  } catch {
    // Not a URL — try as plain ID
  }

  if (/^[a-zA-Z0-9_-]{20,}$/.test(input)) return { id: input, isFolder: false };
  return null;
}

type DriveFileMeta = { id: string; name: string; mimeType: string; size?: string };

async function listFolderFiles(accessToken: string, folderId: string): Promise<DriveFileMeta[]> {
  const files: DriveFileMeta[] = [];
  let pageToken: string | null = null;

  do {
    const params = new URLSearchParams({
      q: `'${folderId}' in parents and trashed = false and (mimeType = 'text/markdown' or mimeType = 'text/plain' or mimeType = 'application/json' or mimeType = 'application/octet-stream')`,
      fields: "nextPageToken,files(id,name,mimeType,size)",
      pageSize: "100",
    });
    if (pageToken) params.set("pageToken", pageToken);

    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?${params}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`Drive list error (${res.status}): ${detail}`);
    }

    const json = await res.json();
    files.push(...(json.files ?? []));
    pageToken = json.nextPageToken ?? null;

    if (files.length > MAX_FOLDER_FILES) {
      throw new Error(`Folder contains too many files (>${MAX_FOLDER_FILES}). Filter the folder.`);
    }
  } while (pageToken);

  return files.filter((f) => f.name.endsWith(".md") || f.name.endsWith(".json"));
}

async function downloadFileContent(accessToken: string, fileId: string): Promise<string> {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Drive download error (${res.status}): ${detail}`);
  }

  return res.text();
}

/* ── Handler ────────────────────────────────────────────────────── */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const driveUrl = typeof body?.url === "string" ? body.url.trim() : "";
    if (!driveUrl) {
      return new Response(JSON.stringify({ error: "Missing 'url' in request body." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = extractDriveId(driveUrl);
    if (!parsed) {
      return new Response(JSON.stringify({ error: "Could not extract a Drive file/folder ID from the provided URL." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const accessToken = await getGoogleAccessToken();

    // ── Check if it's a folder by metadata (handles ambiguous IDs) ──
    let isFolder = parsed.isFolder;
    if (!isFolder) {
      const checkRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${parsed.id}?fields=mimeType`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      if (checkRes.ok) {
        const checkMeta = await checkRes.json();
        if (checkMeta.mimeType === FOLDER_MIME) isFolder = true;
      }
    }

    // ── Folder mode: list + download all .md/.json ──
    if (isFolder) {
      const fileMetas = await listFolderFiles(accessToken, parsed.id);

      if (fileMetas.length === 0) {
        return new Response(JSON.stringify({ error: "No .md or .json files found in this folder." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const files: { fileName: string; content: string; format: string }[] = [];

      for (const fm of fileMetas) {
        const size = Number(fm.size ?? 0);
        if (size > MAX_FILE_SIZE) continue;

        const content = await downloadFileContent(accessToken, fm.id);
        const format = fm.name.endsWith(".json") ? "json" : fm.name.endsWith(".md") ? "markdown" : "unknown";
        files.push({ fileName: fm.name, content, format });
      }

      return new Response(
        JSON.stringify({ mode: "folder", folderFileCount: fileMetas.length, files }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // ── Single file mode ──
    const metaRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${parsed.id}?fields=name,mimeType,size`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (!metaRes.ok) {
      const detail = await metaRes.text();
      throw new Error(`Drive metadata error (${metaRes.status}): ${detail}`);
    }

    const meta = await metaRes.json();
    const size = Number(meta.size ?? 0);
    if (size > MAX_FILE_SIZE) {
      return new Response(JSON.stringify({ error: `File too large (${Math.round(size / 1024)} KB). Max 5 MB.` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mime = (meta.mimeType ?? "") as string;
    if (!ALLOWED_MIME_PREFIXES.some((p) => mime.startsWith(p))) {
      return new Response(JSON.stringify({ error: `Unsupported file type: ${mime}. Expected text or JSON.` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const text = await downloadFileContent(accessToken, parsed.id);
    const fileName = (meta.name ?? "unknown") as string;
    const detectedFormat = fileName.endsWith(".json") ? "json" : fileName.endsWith(".md") ? "markdown" : "unknown";

    return new Response(
      JSON.stringify({ mode: "file", fileName, content: text, mimeType: mime, format: detectedFormat }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
