/** Lovable Cloud redeploy stamp: onboarding_drive_folder_id override + KB session (2026-11-25f). */
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { mayUseOnboardingDriveOverride, parseDriveFolderId } from "../_shared/onboarding-lab-drive.ts";
import { createVoiceConversationToken, mapVoiceSessionError } from "../_shared/voice-session.ts";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) {
      console.error("agent-session: missing Supabase env");
      return json({ error: "Server misconfigured" }, 500);
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const jwt = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
    const user = userData?.user;
    if (userErr || !user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const agentKind =
      body && typeof body === "object" && body.agent_kind === "onboarding_report"
        ? "onboarding_report"
        : "personal_logos";

    let onboarding_drive_root_override: string | undefined;
    if (
      agentKind === "onboarding_report" &&
      body &&
      typeof body === "object" &&
      typeof body.onboarding_drive_folder_id === "string" &&
      body.onboarding_drive_folder_id.trim()
    ) {
      const raw = body.onboarding_drive_folder_id.trim();
      if (await mayUseOnboardingDriveOverride(admin, user.id, raw)) {
        onboarding_drive_root_override = parseDriveFolderId(raw) || undefined;
      }
    }

    const payload = await createVoiceConversationToken(admin, user.id, {
      agent_kind: agentKind,
      onboarding_drive_root_override,
    });
    return json(payload);
  } catch (e) {
    console.error("agent-session", e);
    const mapped = mapVoiceSessionError(e);
    return json({ error: mapped.message }, mapped.status);
  }
});
