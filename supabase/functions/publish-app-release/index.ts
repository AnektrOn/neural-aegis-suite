import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ ok: false, error: "missing_auth" }, 401);
    }

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: userData } = await userClient.auth.getUser();
    const user = userData?.user;
    if (!user) return json({ ok: false, error: "not_authenticated" }, 401);

    const { data: isAdmin } = await admin.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });
    if (!isAdmin) return json({ ok: false, error: "forbidden" }, 403);

    const body = await req.json().catch(() => ({}));
    const releaseId = body?.releaseId;
    if (!releaseId || typeof releaseId !== "string") {
      return json({ ok: false, error: "invalid_release_id" }, 400);
    }

    // 1. Publish in DB (via user client so RLS/owner is preserved)
    const { data: published, error: pubErr } = await userClient.rpc(
      "publish_app_release",
      { p_release_id: releaseId },
    );
    if (pubErr) return json({ ok: false, error: pubErr.message }, 400);

    // 2. Generate long-lived signed URL for APK (1 year)
    const oneYear = 60 * 60 * 24 * 365;
    const { data: signed, error: signErr } = await admin.storage
      .from("app-releases")
      .createSignedUrl(published.apk_storage_path, oneYear);

    if (signErr || !signed?.signedUrl) {
      return json({ ok: false, error: signErr?.message ?? "sign_failed" }, 500);
    }

    // Persist the signed URL on the release row
    await admin
      .from("app_releases")
      .update({ apk_public_url: signed.signedUrl })
      .eq("id", releaseId);

    // 3. Build latest.json manifest
    const manifest = {
      android: {
        versionCode: published.version_code,
        versionName: published.version_name,
        apkUrl: signed.signedUrl,
        releaseNotes: published.release_notes ?? "",
        forceUpdate: !!published.force_update,
        minVersionCode: published.min_version_code ?? null,
        sha256: published.sha256 ?? null,
        publishedAt: published.published_at,
      },
    };

    const manifestBytes = new TextEncoder().encode(
      JSON.stringify(manifest, null, 2),
    );

    const { error: uploadErr } = await admin.storage
      .from("app-releases")
      .upload("latest.json", manifestBytes, {
        contentType: "application/json",
        upsert: true,
        cacheControl: "60",
      });
    if (uploadErr) {
      return json({ ok: false, error: uploadErr.message }, 500);
    }

    // 4. Long-lived signed URL for the manifest
    const { data: manifestSigned } = await admin.storage
      .from("app-releases")
      .createSignedUrl("latest.json", oneYear);

    return json({
      ok: true,
      release: published,
      manifestUrl: manifestSigned?.signedUrl ?? null,
      apkUrl: signed.signedUrl,
    });
  } catch (e) {
    return json({ ok: false, error: (e as Error).message }, 500);
  }
});

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
