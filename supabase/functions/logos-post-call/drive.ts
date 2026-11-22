import { LOGOS_DRIVE_ROOT_ID } from "./helpers.ts";

const GATEWAY = "https://connector-gateway.lovable.dev/google_drive";
const FOLDER_MIME = "application/vnd.google-apps.folder";

function gwHeaders(extra: Record<string, string> = {}): HeadersInit {
  const lov = Deno.env.get("LOVABLE_API_KEY");
  const gd = Deno.env.get("GOOGLE_DRIVE_API_KEY");
  if (!lov) throw new Error("LOVABLE_API_KEY is not configured");
  if (!gd) throw new Error("GOOGLE_DRIVE_API_KEY is not configured");
  return { Authorization: `Bearer ${lov}`, "X-Connection-Api-Key": gd, ...extra };
}

async function listChildFolders(parentId: string, name: string): Promise<string[]> {
  const safe = name.replace(/'/g, "\\'");
  const q = `name='${safe}' and mimeType='${FOLDER_MIME}' and '${parentId}' in parents and trashed=false`;
  const url = `${GATEWAY}/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,createdTime)&orderBy=createdTime&pageSize=20&supportsAllDrives=true&includeItemsFromAllDrives=true`;
  const r = await fetch(url, { headers: gwHeaders() });
  if (!r.ok) throw new Error(`Drive list failed ${r.status}: ${await r.text()}`);
  const data = await r.json();
  return (data.files || []).map((f: { id: string }) => f.id);
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

export async function findOrCreateChildFolder(parentId: string, name: string): Promise<string> {
  const existing = await listChildFolders(parentId, name);
  if (existing.length > 0) return existing[0]; // oldest first (orderBy createdTime)
  const createdId = await createDriveFolder(parentId, name);
  // Collapse create races: Drive allows duplicate names; always pin to oldest.
  const again = await listChildFolders(parentId, name);
  return again[0] ?? createdId;
}

/** Walk an existing path without creating folders. Prefers oldest duplicate at each level. */
export async function resolveLogosConversationFolder(parts: {
  userFolder: string;
  year: string;
  date: string;
  conversationId: string;
}): Promise<{ folderId: string; path: string } | null> {
  const root = Deno.env.get("LOGOS_DRIVE_ROOT_ID")?.trim() || LOGOS_DRIVE_ROOT_ID;
  let parent = root;
  for (const segment of [parts.userFolder, parts.year, parts.date, parts.conversationId]) {
    const ids = await listChildFolders(parent, segment);
    if (!ids.length) return null;
    parent = ids[0];
  }
  return {
    folderId: parent,
    path: `${parts.userFolder}/${parts.year}/${parts.date}/${parts.conversationId}`,
  };
}

export async function ensureLogosConversationFolder(parts: {
  userFolder: string;
  year: string;
  date: string;
  conversationId: string;
}): Promise<{ folderId: string; path: string }> {
  const resolved = await resolveLogosConversationFolder(parts);
  if (resolved) return resolved;

  const root = Deno.env.get("LOGOS_DRIVE_ROOT_ID")?.trim() || LOGOS_DRIVE_ROOT_ID;
  const userId = await findOrCreateChildFolder(root, parts.userFolder);
  const yearId = await findOrCreateChildFolder(userId, parts.year);
  const dateId = await findOrCreateChildFolder(yearId, parts.date);
  const folderId = await findOrCreateChildFolder(dateId, parts.conversationId);
  return {
    folderId,
    path: `${parts.userFolder}/${parts.year}/${parts.date}/${parts.conversationId}`,
  };
}

async function findFileId(parentId: string, filename: string): Promise<string | null> {
  const q = `name='${filename.replace(/'/g, "\\'")}' and '${parentId}' in parents and trashed=false`;
  const r = await fetch(
    `${GATEWAY}/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id)&supportsAllDrives=true&includeItemsFromAllDrives=true`,
    { headers: gwHeaders() },
  );
  if (!r.ok) throw new Error(`Drive list file failed ${r.status}: ${await r.text()}`);
  const files = (await r.json()).files ?? [];
  return files[0]?.id ?? null;
}

export async function upsertDriveBytes(
  parentId: string,
  filename: string,
  bytes: Uint8Array,
  mimeType: string,
): Promise<string> {
  const existingId = await findFileId(parentId, filename);
  if (existingId) {
    const update = await fetch(
      `${GATEWAY}/upload/drive/v3/files/${existingId}?uploadType=media&supportsAllDrives=true`,
      { method: "PATCH", headers: gwHeaders({ "Content-Type": mimeType }), body: bytes },
    );
    if (!update.ok) throw new Error(`Drive update failed ${update.status}: ${await update.text()}`);
    return existingId;
  }

  const boundary = "logos_" + crypto.randomUUID();
  const metadata = JSON.stringify({ name: filename, parents: [parentId], mimeType });
  const metaPart = new TextEncoder().encode(
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n` +
      `--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`,
  );
  const endPart = new TextEncoder().encode(`\r\n--${boundary}--`);
  const body = new Uint8Array(metaPart.length + bytes.length + endPart.length);
  body.set(metaPart, 0);
  body.set(bytes, metaPart.length);
  body.set(endPart, metaPart.length + bytes.length);

  const create = await fetch(
    `${GATEWAY}/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id`,
    {
      method: "POST",
      headers: gwHeaders({ "Content-Type": `multipart/related; boundary=${boundary}` }),
      body,
    },
  );
  if (!create.ok) throw new Error(`Drive upload failed ${create.status}: ${await create.text()}`);
  const j = await create.json();
  return j.id as string;
}

export async function upsertDriveText(
  parentId: string,
  filename: string,
  content: string,
  mimeType: string,
): Promise<string> {
  return upsertDriveBytes(parentId, filename, new TextEncoder().encode(content), mimeType);
}
