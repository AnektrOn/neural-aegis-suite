/** Handler partagé — aperçu pack Drive onboarding (lab + prod admin). */

import {
  mayUseOnboardingDriveOverride,
  parseDriveFolderId,
} from "./onboarding-lab-drive.ts";
import {
  fetchOnboardingDriveFilePreview,
  listOnboardingPackFromDrive,
} from "./voice-onboarding-kb.ts";

// deno-lint-ignore no-explicit-any
type Admin = any;

export const AGENT_SESSION_ONBOARDING_PREVIEW_STAMP = "agent-session-onboarding-preview-1";

export async function buildOnboardingPackPreviewResponse(
  admin: Admin,
  userId: string,
  body: Record<string, unknown>,
  edgeStamp: string,
): Promise<{ status: number; payload: Record<string, unknown> }> {
  const raw = String(body?.drive_folder_id ?? body?.onboarding_drive_folder_id ?? "").trim();
  const folderId = parseDriveFolderId(raw);
  if (!folderId) return { status: 400, payload: { error: "drive_folder_id requis" } };
  if (!(await mayUseOnboardingDriveOverride(admin, userId, folderId))) {
    return { status: 403, payload: { error: "Forbidden" } };
  }

  const embedPreviews = body?.embed_previews === true || body?.embed_previews === "true";
  const fileId = String(body?.drive_file_id ?? "").trim();

  try {
    const pack = await listOnboardingPackFromDrive(folderId);

    if (fileId) {
      const meta = pack.files.find((f) => f.id === fileId);
      if (!meta) return { status: 403, payload: { error: "Fichier hors du pack onboarding" } };
      const file = await fetchOnboardingDriveFilePreview(fileId);
      file.relativePath = meta.relativePath;
      file.name = meta.name;
      return {
        status: 200,
        payload: {
          ok: true,
          edge_stamp: edgeStamp,
          drive_folder_id: folderId,
          folder_name: pack.folder_name,
          file,
        },
      };
    }

    if (embedPreviews) {
      const files = [];
      for (const meta of pack.files) {
        try {
          const file = await fetchOnboardingDriveFilePreview(meta.id);
          file.relativePath = meta.relativePath;
          file.name = meta.name;
          files.push(file);
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          files.push({
            id: meta.id,
            name: meta.name,
            relativePath: meta.relativePath,
            char_count: 0,
            preview: "",
            truncated: false,
            error: msg,
          });
        }
      }
      return {
        status: 200,
        payload: {
          ok: true,
          edge_stamp: edgeStamp,
          drive_folder_id: folderId,
          folder_name: pack.folder_name,
          files,
        },
      };
    }

    return {
      status: 200,
      payload: {
        ok: true,
        edge_stamp: edgeStamp,
        drive_folder_id: folderId,
        folder_name: pack.folder_name,
        files: pack.files,
      },
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { status: 422, payload: { error: msg } };
  }
}