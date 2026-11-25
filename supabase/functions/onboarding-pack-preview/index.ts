/** Dédié lab onboarding — preview Drive pack (liste + contenu). Stamp: onboarding-pack-preview-1 */
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import {
  mayUseOnboardingDriveOverride,
  parseDriveFolderId,
} from "../_shared/onboarding-lab-drive.ts";
import {
  fetchOnboardingDriveFilePreview,
  listOnboardingPackFromDrive,
} from "../_shared/voice-onboarding-kb.ts";

export const ONBOARDING_PACK_PREVIEW_STAMP = "onboarding-pack-preview-1";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !serviceKey) return json({ error: "Configuration serveur indisponible" }, 500);

    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "").trim();
    const admin = createClient(url, serviceKey);
    const { data: u } = await admin.auth.getUser(token);
    if (!u?.user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const action = String(body?.action ?? "preview_onboarding_pack");
    if (action !== "preview_onboarding_pack") {
      return json({ error: "Action inconnue" }, 400);
    }

    const raw = String(body?.drive_folder_id ?? body?.onboarding_drive_folder_id ?? "").trim();
    const folderId = parseDriveFolderId(raw);
    if (!folderId) return json({ error: "drive_folder_id requis" }, 400);
    if (!(await mayUseOnboardingDriveOverride(admin, u.user.id, folderId))) {
      return json({ error: "Forbidden" }, 403);
    }

    const embedPreviews = body?.embed_previews === true || body?.embed_previews === "true";
    const fileId = String(body?.drive_file_id ?? "").trim();
    const pack = await listOnboardingPackFromDrive(folderId);

    if (fileId) {
      const meta = pack.files.find((f) => f.id === fileId);
      if (!meta) return json({ error: "Fichier hors du pack onboarding" }, 403);
      const file = await fetchOnboardingDriveFilePreview(fileId);
      file.relativePath = meta.relativePath;
      file.name = meta.name;
      return json({
        ok: true,
        edge_stamp: ONBOARDING_PACK_PREVIEW_STAMP,
        drive_folder_id: folderId,
        folder_name: pack.folder_name,
        file,
      });
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
      return json({
        ok: true,
        edge_stamp: ONBOARDING_PACK_PREVIEW_STAMP,
        drive_folder_id: folderId,
        folder_name: pack.folder_name,
        files,
      });
    }

    return json({
      ok: true,
      edge_stamp: ONBOARDING_PACK_PREVIEW_STAMP,
      drive_folder_id: folderId,
      folder_name: pack.folder_name,
      files: pack.files,
    });
  } catch (e) {
    console.error("onboarding-pack-preview", e);
    const msg = e instanceof Error ? e.message : String(e);
    return json({ error: msg }, 422);
  }
});