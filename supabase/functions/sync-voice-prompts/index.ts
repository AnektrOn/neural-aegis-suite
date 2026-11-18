import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const GATEWAY = "https://connector-gateway.lovable.dev/google_drive/drive/v3";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const reply = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const anon = Deno.env.get("SUPABASE_ANON_KEY");
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const key = Deno.env.get("LOVABLE_API_KEY");
    const drive = Deno.env.get("GOOGLE_DRIVE_API_KEY");
    if (!url || !anon || !service || !key || !drive) throw new Error("Voice Drive connection not configured");
    const authorization = req.headers.get("Authorization") ?? "";
    const caller = createClient(url, anon, { global: { headers: { Authorization: authorization } } });
    const { data: { user } } = await caller.auth.getUser();
    if (!user || user.is_anonymous) return reply({ error: "Unauthorized" }, 401);
    const body = await req.json().catch(() => ({}));
    const userId = body.user_id ?? user.id;
    if (typeof userId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) return reply({ error: "Invalid user_id" }, 400);
    const admin = createClient(url, service);
    if (userId !== user.id) {
      const { data: role } = await admin.from("user_roles").select("role").eq("user_id", user.id).in("role", ["admin", "superadmin"]).limit(1).maybeSingle();
      if (!role) return reply({ error: "Forbidden" }, 403);
    }
    const { data: source, error: sourceError } = await admin.from("voice_prompt_sources").select("drive_folder_id").eq("user_id", userId).maybeSingle();
    if (sourceError) throw sourceError;
    if (!source) return reply({ synced: false, reason: "no_source", prompts: 0 });
    const headers = { Authorization: `Bearer ${key}`, "X-Connection-Api-Key": drive };
    const driveRead = async (path: string) => {
      const response = await fetch(`${GATEWAY}${path}`, { headers });
      if (!response.ok) {
        const details = await response.text();
        console.error(`Voice Drive failed [${response.status}]: ${details}`);
        throw Object.assign(new Error(details), { status: response.status });
      }
      return response.json();
    };
    const q = `name='LATEST_BATCH.json' and '${source.drive_folder_id.replace(/'/g, "\\'")}' in parents and trashed=false`;
    const listed = await driveRead(`/files?q=${encodeURIComponent(q)}&fields=files(id,modifiedTime)&orderBy=modifiedTime%20desc&pageSize=1`);
    const file = listed.files?.[0];
    if (!file) return reply({ error: "LATEST_BATCH.json missing in mapped folder" }, 404);
    const batch = await driveRead(`/files/${encodeURIComponent(file.id)}?alt=media`);
    if (typeof batch.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(batch.date) || typeof batch.batch_time !== "string" || !Array.isArray(batch.prompts) || !batch.prompts.length || batch.prompts.length > 100) return reply({ error: "Invalid voice batch" }, 422);
    for (const prompt of batch.prompts) {
      if (!prompt || typeof prompt.title !== "string" || typeof prompt.agent_mandate !== "string" || typeof prompt.first_message_agent !== "string" || typeof prompt.slot_index !== "number") return reply({ error: "Invalid voice prompt" }, 422);
    }
    if (new Set(batch.prompts.map((p: { slot_index: number }) => p.slot_index)).size !== batch.prompts.length) return reply({ error: "Duplicate prompt slots" }, 422);
    const { data: existing } = await admin.from("daily_voice_prompts").select("id,prompts").eq("user_id", userId).eq("date", batch.date).eq("batch_time", batch.batch_time).maybeSingle();
    if (!existing || JSON.stringify(existing.prompts) !== JSON.stringify(batch)) {
      const { error } = await admin.from("daily_voice_prompts").upsert({ user_id: userId, date: batch.date, batch_time: batch.batch_time, prompts: batch, synced_at: new Date().toISOString() }, { onConflict: "user_id,date,batch_time" });
      if (error) throw error;
    }
    // Service-originated writes don't carry a member JWT in database webhooks.
    // Export explicitly and synchronously, including on retry after a prior Drive failure.
    const exported = await fetch(`${url}/functions/v1/export-to-drive`, {
      method: "POST", headers: { Authorization: `Bearer ${service}`, "Content-Type": "application/json" },
      body: JSON.stringify({ action: "export_voice", user_id: userId }),
    });
    if (!exported.ok) throw new Error(`Voice export [${exported.status}]: ${await exported.text()}`);
    const result = await exported.json();
    return reply({ synced: true, prompts: batch.prompts.length, date: batch.date, batch_time: batch.batch_time, exported: result.verified, files: result.files });
  } catch (error) {
    const status = typeof (error as { status?: number }).status === "number" ? (error as { status: number }).status : 500;
    return reply({ error: error instanceof Error ? error.message : String(error) }, status);
  }
});