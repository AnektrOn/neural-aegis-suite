// Drive list / mkdir / upload probe (screenshots campaign helper)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-internal-call",
};

const GATEWAY = "https://connector-gateway.lovable.dev/google_drive";
const ROOT = "1S9nImUA3zt3n8byGLmixpAl75lDdjGZg";
const FOLDER_MIME = "application/vnd.google-apps.folder";

function gwHeaders(extra: Record<string, string> = {}): HeadersInit {
  const lov = Deno.env.get("LOVABLE_API_KEY");
  const gd = Deno.env.get("GOOGLE_DRIVE_API_KEY");
  if (!lov || !gd) throw new Error("Drive gateway keys missing");
  return {
    Authorization: `Bearer ${lov}`,
    "X-Connection-Api-Key": gd,
    ...extra,
  };
}

async function listChildren(parent: string) {
  const q = `'${parent}' in parents and trashed=false`;
  const url =
    `${GATEWAY}/drive/v3/files?q=${encodeURIComponent(q)}` +
    `&fields=files(id,name,mimeType,createdTime,owners(emailAddress))` +
    `&orderBy=name&pageSize=1000&supportsAllDrives=true&includeItemsFromAllDrives=true`;
  const r = await fetch(url, { headers: gwHeaders() });
  return { status: r.status, data: await r.json() };
}

async function getMeta(id: string) {
  const url =
    `${GATEWAY}/drive/v3/files/${id}?fields=id,name,mimeType,owners(emailAddress),capabilities` +
    `&supportsAllDrives=true`;
  const r = await fetch(url, { headers: gwHeaders() });
  return { status: r.status, data: await r.json() };
}

async function findChildFolder(parentId: string, name: string): Promise<string | null> {
  const safe = name.replace(/'/g, "\\'");
  const q =
    `name='${safe}' and mimeType='${FOLDER_MIME}' and '${parentId}' in parents and trashed=false`;
  const url =
    `${GATEWAY}/drive/v3/files?q=${encodeURIComponent(q)}` +
    `&fields=files(id)&pageSize=5&supportsAllDrives=true&includeItemsFromAllDrives=true`;
  const r = await fetch(url, { headers: gwHeaders() });
  if (!r.ok) throw new Error(`list folder failed ${r.status}: ${await r.text()}`);
  const data = await r.json();
  return data.files?.[0]?.id ?? null;
}

async function createFolder(parentId: string, name: string): Promise<string> {
  const existing = await findChildFolder(parentId, name);
  if (existing) return existing;
  const create = await fetch(`${GATEWAY}/drive/v3/files?supportsAllDrives=true`, {
    method: "POST",
    headers: gwHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ name, mimeType: FOLDER_MIME, parents: [parentId] }),
  });
  if (!create.ok) throw new Error(`create folder failed ${create.status}: ${await create.text()}`);
  const j = await create.json();
  return j.id as string;
}

async function uploadBytes(
  parentId: string,
  filename: string,
  mimeType: string,
  bytes: Uint8Array,
): Promise<{ id: string; name: string }> {
  const boundary = "aegis_" + crypto.randomUUID();
  const metadata = { name: filename, parents: [parentId], mimeType };
  const metaPart =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n`;
  const binHeader =
    `--${boundary}\r\nContent-Type: ${mimeType}\r\nContent-Transfer-Encoding: binary\r\n\r\n`;
  const footer = `\r\n--${boundary}--`;

  const enc = new TextEncoder();
  const head = enc.encode(metaPart + binHeader);
  const tail = enc.encode(footer);
  const body = new Uint8Array(head.length + bytes.length + tail.length);
  body.set(head, 0);
  body.set(bytes, head.length);
  body.set(tail, head.length + bytes.length);

  const r = await fetch(
    `${GATEWAY}/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id,name`,
    {
      method: "POST",
      headers: gwHeaders({
        "Content-Type": `multipart/related; boundary=${boundary}`,
      }),
      body,
    },
  );
  if (!r.ok) throw new Error(`upload failed ${r.status}: ${await r.text()}`);
  return await r.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url0 = new URL(req.url);
    const action = url0.searchParams.get("action") || "list";
    const parent = url0.searchParams.get("parent") || ROOT;

    if (action === "meta") {
      const id = url0.searchParams.get("id") || parent;
      const out = await getMeta(id);
      return new Response(JSON.stringify(out, null, 2), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "mkdir") {
      const name = url0.searchParams.get("name");
      if (!name) throw new Error("name required");
      const id = await createFolder(parent, name);
      return new Response(JSON.stringify({ ok: true, id, name, parent }, null, 2), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "mkdir-tree") {
      // ?action=mkdir-tree&parent=ROOT&path=A/B/C  creates nested folders
      const path = url0.searchParams.get("path");
      if (!path) throw new Error("path required");
      const parts = path.split("/").map((p) => p.trim()).filter(Boolean);
      let cur = parent;
      const created: { name: string; id: string }[] = [];
      for (const part of parts) {
        cur = await createFolder(cur, part);
        created.push({ name: part, id: cur });
      }
      return new Response(JSON.stringify({ ok: true, leafId: cur, created }, null, 2), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "upload" && req.method === "POST") {
      const filename = url0.searchParams.get("filename") || "upload.bin";
      const mimeType = url0.searchParams.get("mime") || "application/octet-stream";
      const buf = new Uint8Array(await req.arrayBuffer());
      const uploaded = await uploadBytes(parent, filename, mimeType, buf);
      return new Response(JSON.stringify({ ok: true, uploaded, parent }, null, 2), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const out = await listChildren(parent);
    return new Response(JSON.stringify(out.data, null, 2), {
      status: out.status >= 400 ? 200 : 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }, null, 2),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
