/** Dédié lab onboarding — preview Drive pack (liste + contenu). Stamp: onboarding-pack-preview-1f */
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { buildOnboardingPackPreviewResponse } from "../_shared/onboarding-pack-preview-handler.ts";

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

    const { status, payload } = await buildOnboardingPackPreviewResponse(
      admin,
      u.user.id,
      body,
      ONBOARDING_PACK_PREVIEW_STAMP,
    );
    return json(payload, status);
  } catch (e) {
    console.error("onboarding-pack-preview", e);
    const msg = e instanceof Error ? e.message : String(e);
    return json({ error: msg }, 422);
  }
});
