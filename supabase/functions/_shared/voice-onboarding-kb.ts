/** Onboarding vocal : lit le pack Drive (dossier user Obsidian) → docs ElevenLabs → override KB session. */

import {
  collectOnboardingDriveMarkdown,
  type DriveListFn,
} from "./onboarding-drive-pack.ts";
import { resolveOnboardingReportAgentId } from "./voice-onboarding-session.ts";

// deno-lint-ignore no-explicit-any
type Admin = any;

export type VoiceKnowledgeLocator = {
  type: string;
  name: string;
  id: string;
  usage_mode?: string;
};

const DRIVE = "https://connector-gateway.lovable.dev/google_drive/drive/v3";
const EL = "https://api.elevenlabs.io/v1";

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
    throw new Error(`Drive ${res.status}: ${details.slice(0, 300)}`);
  }
  return res;
}

const driveListPage: DriveListFn = async (folderId, pageToken) => {
  const params = new URLSearchParams({
    q: `'${folderId.replace(/'/g, "\\'")}' in parents and trashed = false`,
    fields: "nextPageToken,files(id,name,mimeType)",
    pageSize: "200",
    supportsAllDrives: "true",
    includeItemsFromAllDrives: "true",
  });
  if (pageToken) params.set("pageToken", pageToken);
  return (await driveFetch(`/files?${params}`)).json();
};

function elKey() {
  const k = Deno.env.get("ELEVENLABS_API_KEY");
  if (!k) throw new Error("ELEVENLABS_API_KEY manquante");
  return k;
}

async function elJson(path: string, init: RequestInit = {}) {
  const res = await fetch(`${EL}${path}`, {
    ...init,
    headers: { "xi-api-key": elKey(), ...(init.headers ?? {}) },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${text.slice(0, 400)}`);
  return text ? JSON.parse(text) : {};
}

async function sha256(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function listOnboardingPackFromDrive(userRootFolderId: string): Promise<
  { folder_name: string; files: { name: string; relativePath: string }[] }
> {
  const meta = await (
    await driveFetch(
      `/files/${encodeURIComponent(userRootFolderId)}?fields=id,name,mimeType&supportsAllDrives=true`,
    )
  ).json();
  if (meta.mimeType !== "application/vnd.google-apps.folder") {
    throw onboardingKbError("L’ID Drive configuré n’est pas un dossier.");
  }
  const mdFiles = await collectOnboardingDriveMarkdown(userRootFolderId, driveListPage);
  return {
    folder_name: meta.name ?? userRootFolderId,
    files: mdFiles.map((f) => ({ name: f.name, relativePath: f.relativePath })),
  };
}

async function resolveUserDriveRootId(
  admin: Admin,
  userId: string,
  overrideId?: string,
): Promise<string> {
  if (overrideId?.trim()) return overrideId.trim();
  const { data: profile, error } = await admin
    .from("profiles")
    .select("drive_folder_id, onboarding_drive_folder_id")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  const onboarding = typeof profile?.onboarding_drive_folder_id === "string"
    ? profile.onboarding_drive_folder_id.trim()
    : "";
  const fallback = typeof profile?.drive_folder_id === "string" ? profile.drive_folder_id.trim() : "";
  const id = onboarding || fallback;
  if (!id) {
    throw onboardingKbError(
      "Dossier Drive onboarding manquant. Renseigne onboarding_drive_folder_id (dossier Obsidian user) sur le profil.",
    );
  }
  return id;
}

/** Crée ou réutilise un doc KB ElevenLabs sans muter la KB par défaut de l’agent global. */
async function ensureOnboardingKbDocument(
  admin: Admin,
  opts: {
    onboardingAgentId: string;
    userId: string;
    driveFileId: string;
    name: string;
    relativePath: string;
    text: string;
  },
): Promise<string> {
  const hash = await sha256(opts.text);
  const { data: existingRows } = await admin
    .from("elevenlabs_documents")
    .select("*")
    .eq("target_agent_id", opts.onboardingAgentId)
    .eq("user_id", opts.userId)
    .eq("drive_file_id", opts.driveFileId)
    .order("created_at", { ascending: false })
    .limit(1);
  const existing = existingRows?.[0];

  if (
    existing?.status === "success" &&
    existing.content_hash === hash &&
    typeof existing.elevenlabs_document_id === "string"
  ) {
    return existing.elevenlabs_document_id as string;
  }

  const base = {
    user_id: opts.userId,
    target_agent_id: opts.onboardingAgentId,
    source_type: "drive_file" as const,
    drive_file_id: opts.driveFileId,
    file_name: opts.name,
    drive_relative_path: opts.relativePath,
    status: "uploading",
    error_message: null,
    updated_at: new Date().toISOString(),
  };
  let rowId = existing?.id;
  if (rowId) await admin.from("elevenlabs_documents").update(base).eq("id", rowId);
  else {
    const { data } = await admin.from("elevenlabs_documents").insert(base).select("id").single();
    rowId = data?.id;
  }

  try {
    const doc = await elJson("/convai/knowledge-base/text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: opts.text, name: `${opts.relativePath}` }),
    });
    const newId: string = doc.id;
    const oldId: string | null = existing?.elevenlabs_document_id ?? null;
    if (oldId && oldId !== newId) {
      await fetch(`${EL}/convai/knowledge-base/${oldId}?force=true`, {
        method: "DELETE",
        headers: { "xi-api-key": elKey() },
      }).catch(() => null);
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
      .eq("id", rowId);

    return newId;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await admin
      .from("elevenlabs_documents")
      .update({ status: "failed", error_message: msg, updated_at: new Date().toISOString() })
      .eq("id", rowId);
    throw e;
  }
}

export async function resolveOnboardingMemberKnowledgeBase(
  admin: Admin,
  userId: string,
  opts?: { drive_root_override?: string },
): Promise<VoiceKnowledgeLocator[]> {
  const onboardingAgentId = await resolveOnboardingReportAgentId(admin);
  if (!onboardingAgentId) {
    throw onboardingKbError("Agent Onboarding Report non déployé (admin ElevenLabs).");
  }

  const userRootId = await resolveUserDriveRootId(admin, userId, opts?.drive_root_override);

  const meta = await (
    await driveFetch(
      `/files/${encodeURIComponent(userRootId)}?fields=id,name,mimeType&supportsAllDrives=true`,
    )
  ).json();
  if (meta.mimeType !== "application/vnd.google-apps.folder") {
    throw onboardingKbError("L’ID Drive configuré n’est pas un dossier.");
  }

  const mdFiles = await collectOnboardingDriveMarkdown(userRootId, driveListPage);
  if (!mdFiles.length) {
    throw onboardingKbError(
      `Aucun pack onboarding trouvé dans le dossier « ${meta.name} ». Attendu : un 00_RAPPORT.md (ex. LEVEL_1/00_RAPPORT.md).`,
    );
  }

  const locators: VoiceKnowledgeLocator[] = [];
  for (const file of mdFiles) {
    const res = await driveFetch(
      `/files/${encodeURIComponent(file.id)}?alt=media&supportsAllDrives=true`,
    );
    const text = await res.text();
    if (!text.trim()) continue;
    const docId = await ensureOnboardingKbDocument(admin, {
      onboardingAgentId,
      userId,
      driveFileId: file.id,
      name: file.name,
      relativePath: file.relativePath,
      text,
    });
    locators.push({
      type: "text",
      id: docId,
      name: file.relativePath,
      usage_mode: "auto",
    });
  }

  if (!locators.length) {
    throw onboardingKbError("Les fichiers Drive du pack onboarding sont vides ou illisibles.");
  }

  return locators;
}

function onboardingKbError(message: string): Error {
  const err = new Error(message);
  (err as Error & { status?: number }).status = 422;
  return err;
}