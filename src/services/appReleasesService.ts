import { supabase } from "@/integrations/supabase/client";

export type AppRelease = {
  id: string;
  platform: string;
  version_code: number;
  version_name: string;
  apk_storage_path: string;
  apk_public_url: string;
  release_notes: string | null;
  force_update: boolean;
  min_version_code: number | null;
  is_published: boolean;
  sha256: string | null;
  file_size_bytes: number | null;
  created_by: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type UserAppVersion = {
  id: string;
  user_id: string;
  platform: string;
  version_code: number;
  version_name: string | null;
  device_id: string | null;
  reported_at: string;
};

const BUCKET = "app-releases";

async function sha256Hex(file: Blob): Promise<string> {
  const buf = await file.arrayBuffer();
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function listReleases(): Promise<AppRelease[]> {
  const { data, error } = await supabase
    .from("app_releases")
    .select("*")
    .order("version_code", { ascending: false });
  if (error) throw error;
  return (data ?? []) as AppRelease[];
}

export async function getPublishedRelease(
  platform = "android",
): Promise<AppRelease | null> {
  const { data, error } = await supabase
    .from("app_releases")
    .select("*")
    .eq("platform", platform)
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as AppRelease | null;
}

export type CreateReleaseInput = {
  versionCode: number;
  versionName: string;
  releaseNotes?: string;
  forceUpdate?: boolean;
  minVersionCode?: number | null;
  apkFile: File;
};

export async function createAndUploadRelease(
  input: CreateReleaseInput,
): Promise<AppRelease> {
  const safeName = input.versionName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `neural-aegis-${safeName}-${Date.now()}.apk`;

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, input.apkFile, {
      contentType: "application/vnd.android.package-archive",
      upsert: false,
    });
  if (upErr) throw upErr;

  const sha = await sha256Hex(input.apkFile);

  // Initial signed URL (will be refreshed on publish)
  const { data: signed } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 60 * 60 * 24 * 365);

  const { data: userRes } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("app_releases")
    .insert({
      platform: "android",
      version_code: input.versionCode,
      version_name: input.versionName,
      apk_storage_path: path,
      apk_public_url: signed?.signedUrl ?? "",
      release_notes: input.releaseNotes ?? null,
      force_update: !!input.forceUpdate,
      min_version_code: input.minVersionCode ?? null,
      sha256: sha,
      file_size_bytes: input.apkFile.size,
      created_by: userRes.user?.id ?? null,
    })
    .select("*")
    .single();
  if (error) {
    // best-effort cleanup
    await supabase.storage.from(BUCKET).remove([path]);
    throw error;
  }
  return data as AppRelease;
}

export async function publishRelease(releaseId: string) {
  const { data, error } = await supabase.functions.invoke(
    "publish-app-release",
    { body: { releaseId } },
  );
  if (error) throw error;
  if (!data?.ok) throw new Error(data?.error ?? "publish_failed");
  return data as {
    ok: true;
    release: AppRelease;
    manifestUrl: string | null;
    apkUrl: string;
  };
}

export async function deleteRelease(release: AppRelease) {
  await supabase.storage.from(BUCKET).remove([release.apk_storage_path]);
  const { error } = await supabase
    .from("app_releases")
    .delete()
    .eq("id", release.id);
  if (error) throw error;
}

export async function reportInstalledVersion(opts: {
  versionCode: number;
  versionName: string;
  deviceId?: string | null;
  platform?: string;
}) {
  const { data: userRes } = await supabase.auth.getUser();
  const userId = userRes.user?.id;
  if (!userId) return;

  const platform = opts.platform ?? "android";

  const { error } = await supabase.from("user_app_versions").upsert(
    {
      user_id: userId,
      platform,
      version_code: opts.versionCode,
      version_name: opts.versionName,
      device_id: opts.deviceId ?? undefined,
      reported_at: new Date().toISOString(),
    },
    { onConflict: "user_id,platform" },
  );
  if (error) {
    console.warn("[reportInstalledVersion] failed", error);
    return;
  }

  // Best-effort analytics event
  await supabase.from("app_update_events").insert({
    user_id: userId,
    event_type: "report_version",
    version_code: opts.versionCode,
    metadata: { platform, version_name: opts.versionName },
  });
}

export type AppUpdateEventType =
  | "prompt_shown"
  | "prompt_dismissed"
  | "download_started"
  | "download_complete"
  | "install_intent_opened"
  | "report_version";

export async function logUpdateEvent(opts: {
  type: AppUpdateEventType;
  releaseId?: string | null;
  versionCode?: number | null;
  metadata?: Record<string, unknown>;
}) {
  try {
    const { data: userRes } = await supabase.auth.getUser();
    const userId = userRes.user?.id ?? null;
    await supabase.from("app_update_events").insert({
      user_id: userId ?? undefined,
      release_id: opts.releaseId ?? undefined,
      event_type: opts.type,
      version_code: opts.versionCode ?? undefined,
      metadata: (opts.metadata ?? {}) as never,
    });
  } catch (e) {
    console.warn("[logUpdateEvent] failed", e);
  }
}

export type AdoptionRow = {
  user_id: string;
  display_name: string | null;
  version_code: number;
  version_name: string | null;
  reported_at: string;
};

export async function listUserVersions(): Promise<AdoptionRow[]> {
  const { data, error } = await supabase
    .from("user_app_versions")
    .select(
      "user_id, version_code, version_name, reported_at, profiles:profiles!user_app_versions_user_id_fkey(display_name)",
    )
    .order("reported_at", { ascending: false });
  if (error) {
    // fallback simple shape if FK alias not present
    const { data: simple, error: e2 } = await supabase
      .from("user_app_versions")
      .select("user_id, version_code, version_name, reported_at")
      .order("reported_at", { ascending: false });
    if (e2) throw e2;
    return (simple ?? []).map((r) => ({
      user_id: r.user_id,
      display_name: null,
      version_code: r.version_code,
      version_name: r.version_name,
      reported_at: r.reported_at,
    }));
  }
  type Row = {
    user_id: string;
    version_code: number;
    version_name: string | null;
    reported_at: string;
    profiles: { display_name: string | null } | null;
  };
  return ((data as unknown as Row[]) ?? []).map((r) => ({
    user_id: r.user_id,
    display_name: r.profiles?.display_name ?? null,
    version_code: r.version_code,
    version_name: r.version_name,
    reported_at: r.reported_at,
  }));
}
