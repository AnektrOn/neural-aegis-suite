import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { getGoogleAccessToken } from "../_shared/google-drive.ts";

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

async function setAgentKb(agentId: string, mutate: (items: KbItem[]) => KbItem[]) {
  const agent = await elJson(`/convai/agents/${agentId}`);
  const current: KbItem[] = agent?.conversation_config?.agent?.prompt?.knowledge_base ?? [];
  const next = mutate(current);
  await elJson(`/convai/agents/${agentId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ conversation_config: { agent: { prompt: { knowledge_base: next } } } }),
  });
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
  },
): Promise<{ status: "success" | "skipped" | "failed"; error?: string; documentId?: string }> {
  const hash = await sha256(opts.text);
  let q = admin.from("elevenlabs_documents").select("*").eq("target_agent_id", opts.agentId);
  q = opts.driveFileId ? q.eq("drive_file_id", opts.driveFileId) : q.eq("file_name", opts.name);
  const { data: existingRows } = await q.order("created_at", { ascending: false }).limit(1);
  const existing = existingRows?.[0];

  if (existing && existing.status === "success" && existing.content_hash === hash) {
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
      body: JSON.stringify({ text: opts.text, name: opts.name }),
    });
    const newId: string = doc.id;
    const oldId: string | null = existing?.elevenlabs_document_id ?? null;

    await setAgentKb(opts.agentId, (items) => [
      ...items.filter((i) => i.id !== oldId && i.id !== newId),
      { type: "text", name: opts.name, id: newId, usage_mode: "auto" },
    ]);

    if (oldId && oldId !== newId) {
      await elFetch(`/convai/knowledge-base/${oldId}?force=true`, { method: "DELETE" }).catch(() => null);
    }

    await admin
      .from("elevenlabs_documents")
      .update({
        status: "success",
        elevenlabs_document_id: newId,
        content_hash: hash,
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
  const token = await getGoogleAccessToken();
  const q = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
  const files: { id: string; name: string; mimeType: string }[] = [];
  let pageToken = "";
  do {
    const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=nextPageToken,files(id,name,mimeType)&pageSize=200&supportsAllDrives=true&includeItemsFromAllDrives=true${pageToken ? `&pageToken=${pageToken}` : ""}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`Drive ${res.status}: ${await res.text()}`);
    const j = await res.json();
    files.push(...(j.files ?? []));
    pageToken = j.nextPageToken ?? "";
  } while (pageToken);
  return {
    token,
    files: files.filter((f) => f.name.toLowerCase().endsWith(".md") || f.mimeType === "text/markdown"),
  };
}

async function syncUser(admin: Admin, userId: string) {
  const { data: p } = await admin
    .from("profiles")
    .select("id, elevenlabs_agent_id, drive_folder_id")
    .eq("id", userId)
    .maybeSingle();
  if (!p?.elevenlabs_agent_id) throw new Error("Cet utilisateur n'a pas d'agent ElevenLabs");
  if (!p?.drive_folder_id) throw new Error("Aucun dossier Drive configuré");
  const { token, files } = await listDriveMd(p.drive_folder_id);
  const results: { file: string; status: string; error?: string }[] = [];
  for (const f of files) {
    try {
      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${f.id}?alt=media&supportsAllDrives=true`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Drive ${res.status}: ${await res.text()}`);
      const text = await res.text();
      const r = await uploadMarkdown(admin, {
        agentId: p.elevenlabs_agent_id,
        userId,
        name: f.name,
        text,
        source: "drive_file",
        driveFileId: f.id,
      });
      results.push({ file: f.name, status: r.status, error: r.error });
    } catch (e) {
      results.push({ file: f.name, status: "failed", error: e instanceof Error ? e.message : String(e) });
    }
  }
  await admin.from("profiles").update({ last_synced_at: new Date().toISOString() }).eq("id", userId);
  return results;
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
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "").trim();
    const { data: u } = await admin.auth.getUser(token);
    if (!u?.user) return json({ error: "Unauthorized" }, 401);
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: u.user.id, _role: "admin" });
    if (!isAdmin) return json({ error: "Forbidden" }, 403);

    const body = await req.json().catch(() => ({}));
    const action = String(body?.action ?? "");
    const userId: string | null = typeof body?.user_id === "string" ? body.user_id : null;

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
        const jobId = await startJob(admin, "drive_user_sync", userId);
        try {
          const results = await syncUser(admin, userId);
          await finishJob(admin, jobId, results);
          return json({ results });
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
            const r = await syncUser(admin, usr.id);
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
