import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { collectDriveTree, ensureDriveFolder } from "./drive-sync.ts";
import {
  createVoiceConversationToken,
  mapVoiceSessionError,
} from "../_shared/voice-session.ts";

const DRIVE = "https://connector-gateway.lovable.dev/google_drive/drive/v3";
function driveHeaders(): HeadersInit {
  const key = Deno.env.get("LOVABLE_API_KEY");
  const connection = Deno.env.get("GOOGLE_DRIVE_API_KEY");
  if (!key || !connection) throw new Error("La connexion Google Drive n'est pas disponible.");
  return { Authorization: `Bearer ${key}`, "X-Connection-Api-Key": connection };
}
async function driveFetch(path: string) {
  const res = await fetch(`${DRIVE}${path}`, { headers: driveHeaders() });
  if (!res.ok) {
    const details = await res.text();
    console.error(`Drive ${res.status}: ${details}`);
    throw new Error(`Drive ${res.status}: ${details}`);
  }
  return res;
}

const EL = "https://api.elevenlabs.io/v1";
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

function elKey() {
  const k = Deno.env.get("ELEVENLABS_API_KEY");
  if (!k) throw new Error("ElevenLabs n'est pas connecté au projet");
  return k;
}

/** fetch with retry on 429 / 5xx / network errors */
async function elFetch(path: string, init: RequestInit = {}, tries = 3): Promise<Response> {
  let last: unknown;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(`${EL}${path}`, {
        ...init,
        headers: { "xi-api-key": elKey(), ...(init.headers ?? {}) },
      });
      if (res.status === 429 || res.status >= 500) {
        last = new Error(`ElevenLabs ${res.status}: ${await res.text()}`);
      } else return res;
    } catch (e) {
      last = e;
    }
    await new Promise((r) => setTimeout(r, 800 * (i + 1)));
  }
  throw last instanceof Error ? last : new Error(String(last));
}

async function elJson(path: string, init: RequestInit = {}) {
  const res = await elFetch(path, init);
  const text = await res.text();
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${text}`);
  return text ? JSON.parse(text) : {};
}

async function sha256(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

type KbItem = { type: string; name: string; id: string; usage_mode?: string };

async function setAgentKb(agentId: string, mutate: (items: KbItem[]) => KbItem[], useRag = false) {
  const agent = await elJson(`/convai/agents/${agentId}`);
  const current: KbItem[] = agent?.conversation_config?.agent?.prompt?.knowledge_base ?? [];
  const next = mutate(current);
  const update: RequestInit = {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ conversation_config: { agent: { prompt: {
      knowledge_base: next,
      ...(useRag ? { rag: { ...agent?.conversation_config?.agent?.prompt?.rag, enabled: true } } : {}),
    } } } }),
  };
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      await elJson(`/convai/agents/${agentId}`, update);
      return;
    } catch (error) {
      if (!(error instanceof Error) || !error.message.includes("rag_index_not_ready") || attempt === 4) throw error;
      await new Promise((resolve) => setTimeout(resolve, 2000 * (attempt + 1)));
    }
  }
}

// deno-lint-ignore no-explicit-any
type Admin = any;

async function uploadMarkdown(
  admin: Admin,
  opts: {
    agentId: string;
    userId: string | null;
    name: string;
    text: string;
    source: "manual_md" | "drive_file";
    driveFileId?: string | null;
    parentFolderId?: string;
    relativePath?: string;
  },
): Promise<{ status: "success" | "skipped" | "failed"; error?: string; documentId?: string }> {
  const hash = await sha256(opts.text);
  let q = admin.from("elevenlabs_documents").select("*").eq("target_agent_id", opts.agentId);
  q = opts.driveFileId ? q.eq("drive_file_id", opts.driveFileId) : q.eq("file_name", opts.name);
  const { data: existingRows } = await q.order("created_at", { ascending: false }).limit(1);
  const existing = existingRows?.[0];

  if (existing && existing.status === "success" && existing.content_hash === hash && existing.file_name === opts.name) {
    if (opts.parentFolderId && existing.elevenlabs_parent_folder_id !== opts.parentFolderId && existing.elevenlabs_document_id) {
      await elJson(`/convai/knowledge-base/${existing.elevenlabs_document_id}/move`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ move_to: opts.parentFolderId }),
      });
      const { error } = await admin.from("elevenlabs_documents").update({
        elevenlabs_parent_folder_id: opts.parentFolderId, drive_relative_path: opts.relativePath,
      }).eq("id", existing.id);
      if (error) throw error;
      return { status: "success", documentId: existing.elevenlabs_document_id };
    }
    return { status: "skipped", documentId: existing.elevenlabs_document_id };
  }

  const rowId = existing?.id;
  const base = {
    user_id: opts.userId,
    target_agent_id: opts.agentId,
    source_type: opts.source,
    drive_file_id: opts.driveFileId ?? null,
    file_name: opts.name,
    status: "uploading",
    error_message: null,
    updated_at: new Date().toISOString(),
  };
  let id = rowId;
  if (id) await admin.from("elevenlabs_documents").update(base).eq("id", id);
  else {
    const { data } = await admin.from("elevenlabs_documents").insert(base).select("id").single();
    id = data?.id;
  }

  try {
    const doc = await elJson(`/convai/knowledge-base/text`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: opts.text, name: opts.name, ...(opts.parentFolderId ? { parent_folder_id: opts.parentFolderId } : {}) }),
    });
    const newId: string = doc.id;
    const oldId: string | null = existing?.elevenlabs_document_id ?? null;

    await setAgentKb(opts.agentId, (items) => [
      ...items.filter((i) => i.id !== oldId && i.id !== newId),
      { type: "text", name: opts.name, id: newId, usage_mode: "auto" },
    ], opts.source === "drive_file");

    if (oldId && oldId !== newId) {
      await elFetch(`/convai/knowledge-base/${oldId}?force=true`, { method: "DELETE" }).catch(() => null);
    }

    await admin
      .from("elevenlabs_documents")
      .update({
        status: "success",
        elevenlabs_document_id: newId,
        content_hash: hash,
        elevenlabs_parent_folder_id: opts.parentFolderId ?? null,
        drive_relative_path: opts.relativePath ?? null,
        uploaded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    return { status: "success", documentId: newId };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await admin
      .from("elevenlabs_documents")
      .update({ status: "failed", error_message: msg, updated_at: new Date().toISOString() })
      .eq("id", id);
    return { status: "failed", error: msg };
  }
}

async function listDriveMd(folderId: string) {
  const metadata = await (await driveFetch(`/files/${encodeURIComponent(folderId)}?fields=id,name,mimeType&supportsAllDrives=true`)).json();
  if (metadata.mimeType !== "application/vnd.google-apps.folder") throw new Error("Cet ID Drive ne correspond pas à un dossier.");
  return collectDriveTree(folderId, metadata.name, async (id, pageToken) => {
    const params = new URLSearchParams({
      q: `'${id.replace(/'/g, "\\'")}' in parents and trashed = false`,
      fields: "nextPageToken,files(id,name,mimeType)", pageSize: "200",
      supportsAllDrives: "true", includeItemsFromAllDrives: "true",
    });
    if (pageToken) params.set("pageToken", pageToken);
    return (await driveFetch(`/files?${params}`)).json();
  });
}

async function syncUser(admin: Admin, userId: string, offset = 0, batchSize?: number) {
  const { data: p } = await admin
    .from("profiles")
    .select("id, elevenlabs_agent_id, drive_folder_id")
    .eq("id", userId)
    .maybeSingle();
  if (!p?.elevenlabs_agent_id) throw new Error("Cet utilisateur n'a pas d'agent ElevenLabs");
  if (!p?.drive_folder_id) throw new Error("Aucun dossier Drive configuré");
  const tree = await listDriveMd(p.drive_folder_id);
  const { data: mappings, error: mappingError } = await admin.from("elevenlabs_drive_folders")
    .select("drive_folder_id,elevenlabs_folder_id")
    .eq("user_id", userId).eq("target_agent_id", p.elevenlabs_agent_id).eq("drive_root_id", p.drive_folder_id);
  if (mappingError) throw mappingError;
  const folderIds = new Map<string, string>((mappings ?? []).filter((m: { elevenlabs_folder_id: string | null }) => m.elevenlabs_folder_id)
    .map((m: { drive_folder_id: string; elevenlabs_folder_id: string }) => [m.drive_folder_id, m.elevenlabs_folder_id]));
  const lookup = async (id: string) => folderIds.get(id) ?? null;
  // Folder units precede document units, keeping preparation within the same short batches.
  const units = [...tree.folders.map((folder) => ({ folder })), ...tree.files.map((file) => ({ file }))];
  const batch = units.slice(offset, batchSize ? offset + batchSize : undefined);
  const results: { file: string; status: string; error?: string }[] = [];
  for (const unit of batch) {
    if ("folder" in unit) {
      const folder = unit.folder;
      const existed = folderIds.has(folder.id);
      // Reserve first: concurrent syncs cannot create duplicate provider folders.
      const { error: reserveError } = await admin.from("elevenlabs_drive_folders").upsert({
        user_id: userId, target_agent_id: p.elevenlabs_agent_id, drive_root_id: p.drive_folder_id,
        drive_folder_id: folder.id, parent_drive_folder_id: folder.parentId,
        folder_name: folder.name, relative_path: folder.relativePath,
      }, { onConflict: "user_id,target_agent_id,drive_root_id,drive_folder_id", ignoreDuplicates: true });
      if (reserveError) throw reserveError;
      const claimTime = new Date().toISOString();
      const claimToken = crypto.randomUUID();
      const { data: claim, error: claimError } = await admin.from("elevenlabs_drive_folders")
        .update({ sync_claim_token: claimToken, sync_claim_expires_at: new Date(Date.now() + 120000).toISOString() }).eq("user_id", userId).eq("target_agent_id", p.elevenlabs_agent_id)
        .eq("drive_root_id", p.drive_folder_id).eq("drive_folder_id", folder.id)
        .is("elevenlabs_folder_id", null).or(`sync_claim_expires_at.is.null,sync_claim_expires_at.lt.${claimTime}`).select("id");
      if (claimError) throw claimError;
      if (!existed && !claim?.length) throw new Error("Dossier en cours de synchronisation ; relancez la synchronisation.");
      const id = await ensureDriveFolder(folder, lookup, async (name, parent) => {
        const doc = await elJson("/convai/knowledge-base/folder", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, ...(parent ? { parent_folder_id: parent } : {}) }),
        });
        if (typeof doc.id !== "string" || !doc.id) throw new Error("ElevenLabs : ID de dossier absent");
        return doc.id;
      }, async (created, id) => {
        const { error } = await admin.from("elevenlabs_drive_folders").update({ elevenlabs_folder_id: id, sync_claim_token: null, sync_claim_expires_at: null, updated_at: new Date().toISOString() })
          .eq("user_id", userId).eq("target_agent_id", p.elevenlabs_agent_id).eq("drive_root_id", p.drive_folder_id).eq("drive_folder_id", created.id).eq("sync_claim_token", claimToken);
        if (error) throw error;
      });
      folderIds.set(folder.id, id);
      results.push({ file: `${folder.relativePath || folder.name}/`, status: existed ? "skipped" : "success" });
      continue;
    }
    const f = unit.file;
    try {
      const parentFolderId = folderIds.get(f.parentId);
      if (!parentFolderId) throw new Error(`Dossier parent non synchronisé : ${f.relativePath}`);
      const res = await driveFetch(`/files/${encodeURIComponent(f.id)}?alt=media&supportsAllDrives=true`);
      const text = await res.text();
      const r = await uploadMarkdown(admin, {
        agentId: p.elevenlabs_agent_id,
        userId,
        name: f.name,
        text,
        source: "drive_file",
        driveFileId: f.id,
        parentFolderId,
        relativePath: f.relativePath,
      });
      results.push({ file: f.relativePath, status: r.status, error: r.error });
    } catch (e) {
      results.push({ file: f.relativePath, status: "failed", error: e instanceof Error ? e.message : String(e) });
    }
  }
  const nextOffset = offset + batch.length;
  const done = nextOffset >= units.length;
  if (done) await admin.from("profiles").update({ last_synced_at: new Date().toISOString() }).eq("id", userId);
  return { results, total: units.length, documents_total: tree.files.length, folders_total: tree.folders.length, next_offset: nextOffset, done };
}

async function startJob(admin: Admin, mode: string, userId: string | null) {
  const { data } = await admin.from("sync_jobs").insert({ mode, user_id: userId, status: "running" }).select("id").single();
  return data?.id as string;
}
async function finishJob(admin: Admin, id: string, results: { status: string; file?: string; error?: string }[], summary?: string) {
  const failed = results.filter((r) => r.status === "failed").length;
  const ok = results.length - failed;
  await admin
    .from("sync_jobs")
    .update({
      status: results.length === 0 ? "success" : failed === 0 ? "success" : ok === 0 ? "failed" : "partial_success",
      files_processed: results.length,
      files_succeeded: ok,
      files_failed: failed,
      finished_at: new Date().toISOString(),
      summary: summary ?? null,
    })
    .eq("id", id);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !serviceKey) throw new Error("Configuration serveur indisponible");
    const admin = createClient(url, serviceKey);
    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "").trim();
    const { data: u } = await admin.auth.getUser(token);
    if (!u?.user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const action = String(body?.action ?? "");
    const userId: string | null = typeof body?.user_id === "string" ? body.user_id : null;
    if (userId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) return json({ error: "Identifiant utilisateur invalide" }, 400);

    if (action === "voice_conversation_token") {
      try {
        const payload = await createVoiceConversationToken(admin, u.user.id);
        return json(payload);
      } catch (e) {
        console.error("elevenlabs-knowledge voice_conversation_token", e);
        const mapped = mapVoiceSessionError(e);
        return json({ error: mapped.message }, mapped.status);
      }
    }

    const { data: roles, error: rolesError } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", u.user.id)
      .in("role", ["admin", "superadmin"]);
    if (u.user.is_anonymous || rolesError || !roles?.length) return json({ error: "Forbidden" }, 403);

    switch (action) {
      case "create_agent": {
        if (!userId) return json({ error: "user_id requis" }, 400);
        const { data: p } = await admin.from("profiles").select("display_name, elevenlabs_agent_id").eq("id", userId).maybeSingle();
        if (!p) return json({ error: "Utilisateur introuvable" }, 404);
        if (p.elevenlabs_agent_id) return json({ agent_id: p.elevenlabs_agent_id });
        const agent = await elJson(`/convai/agents/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: `AEGIS — ${p.display_name || userId}`,
            conversation_config: {
              agent: {
                language: "fr",
                first_message: "",
                prompt: { prompt: "Tu es l'agent personnel AEGIS de cet utilisateur. Appuie-toi uniquement sur sa base de connaissances." },
              },
            },
          }),
        });
        await admin.from("profiles").update({ elevenlabs_agent_id: agent.agent_id }).eq("id", userId);
        return json({ agent_id: agent.agent_id });
      }

      case "set_user_agent": {
        if (!userId) return json({ error: "user_id requis" }, 400);
        const agentId = String(body?.agent_id ?? "").trim();
        if (!agentId) return json({ error: "ID d'agent requis" }, 400);
        const { data: p } = await admin.from("profiles").select("id").eq("id", userId).maybeSingle();
        if (!p) return json({ error: "Utilisateur introuvable" }, 404);
        await elJson(`/convai/agents/${agentId}`); // échoue si l'agent n'existe pas dans ElevenLabs
        await admin.from("profiles").update({ elevenlabs_agent_id: agentId }).eq("id", userId);
        return json({ ok: true, agent_id: agentId });
      }

      case "upload": {
        const target = body?.target === "main" ? "main" : "user";
        const docs: { name: string; text: string }[] = Array.isArray(body?.documents) ? body.documents : [];
        if (!docs.length) return json({ error: "Aucun document" }, 400);
        let agentId: string | null = null;
        if (target === "main") {
          const { data: s } = await admin.from("elevenlabs_settings").select("main_agent_id").eq("id", true).maybeSingle();
          agentId = s?.main_agent_id ?? null;
          if (!agentId) return json({ error: "Agent principal non configuré" }, 400);
        } else {
          if (!userId) return json({ error: "user_id requis" }, 400);
          const { data: p } = await admin.from("profiles").select("elevenlabs_agent_id").eq("id", userId).maybeSingle();
          agentId = p?.elevenlabs_agent_id ?? null;
          if (!agentId) return json({ error: "Cet utilisateur n'a pas d'agent ElevenLabs" }, 400);
        }
        const jobId = await startJob(admin, "manual_md_upload", target === "main" ? null : userId);
        const results = [];
        for (const d of docs) {
          const name = String(d?.name ?? "").trim().slice(0, 200);
          const text = String(d?.text ?? "");
          if (!name || !text.trim()) {
            results.push({ file: name || "(sans nom)", status: "failed", error: "Nom ou contenu vide" });
            continue;
          }
          const r = await uploadMarkdown(admin, {
            agentId,
            userId: target === "main" ? null : userId,
            name,
            text,
            source: "manual_md",
          });
          results.push({ file: name, status: r.status, error: r.error });
        }
        await finishJob(admin, jobId, results);
        return json({ results });
      }

      case "delete_document": {
        const docId = String(body?.document_row_id ?? "");
        const { data: row } = await admin.from("elevenlabs_documents").select("*").eq("id", docId).maybeSingle();
        if (!row) return json({ error: "Document introuvable" }, 404);
        if (row.elevenlabs_document_id) {
          await setAgentKb(row.target_agent_id, (items) => items.filter((i) => i.id !== row.elevenlabs_document_id));
          await elFetch(`/convai/knowledge-base/${row.elevenlabs_document_id}?force=true`, { method: "DELETE" }).catch(() => null);
        }
        await admin.from("elevenlabs_documents").delete().eq("id", docId);
        return json({ ok: true });
      }

      case "set_main_agent": {
        const id = String(body?.agent_id ?? "").trim() || null;
        await admin.from("elevenlabs_settings").upsert({ id: true, main_agent_id: id, updated_at: new Date().toISOString() });
        return json({ ok: true });
      }

      case "set_drive": {
        if (!userId) return json({ error: "user_id requis" }, 400);
        const folder = String(body?.drive_folder_id ?? "").trim();
        const m = folder.match(/folders\/([a-zA-Z0-9_-]+)/);
        await admin
          .from("profiles")
          .update({ drive_folder_id: (m?.[1] ?? folder) || null, elevenlabs_sync_enabled: !!body?.enabled })
          .eq("id", userId);
        return json({ ok: true });
      }

      case "sync_user": {
        if (!userId) return json({ error: "user_id requis" }, 400);
        const offset = Number(body?.offset ?? 0);
        if (!Number.isSafeInteger(offset) || offset < 0) return json({ error: "Position de synchronisation invalide" }, 400);
        const jobId = await startJob(admin, "drive_user_sync", userId);
        try {
          const batch = await syncUser(admin, userId, offset, 5);
          await finishJob(admin, jobId, batch.results, `${batch.next_offset}/${batch.total}`);
          return json(batch);
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          await finishJob(admin, jobId, [{ status: "failed", error: msg }], msg);
          return json({ error: msg }, 400);
        }
      }

      case "sync_all": {
        const { data: users } = await admin
          .from("profiles")
          .select("id, display_name")
          .eq("elevenlabs_sync_enabled", true)
          .not("drive_folder_id", "is", null)
          .not("elevenlabs_agent_id", "is", null);
        const jobId = await startJob(admin, "drive_all_users_sync", null);
        const all: { status: string }[] = [];
        const perUser: { user: string; ok: number; failed: number; skipped: number; error?: string }[] = [];
        for (const usr of users ?? []) {
          try {
            const { results: r } = await syncUser(admin, usr.id);
            all.push(...r);
            perUser.push({
              user: usr.display_name || usr.id,
              ok: r.filter((x) => x.status === "success").length,
              skipped: r.filter((x) => x.status === "skipped").length,
              failed: r.filter((x) => x.status === "failed").length,
            });
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            all.push({ status: "failed" });
            perUser.push({ user: usr.display_name || usr.id, ok: 0, skipped: 0, failed: 1, error: msg });
          }
        }
        await finishJob(admin, jobId, all, `${perUser.length} utilisateur(s)`);
        return json({ users: perUser });
      }

      default:
        return json({ error: "Action inconnue" }, 400);
    }
  } catch (e) {
    console.error("elevenlabs-knowledge", e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
