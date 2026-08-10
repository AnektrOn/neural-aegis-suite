import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "No authorization header" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) return json({ error: "Unauthorized" }, 401);

    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleData) return json({ error: "Admin access required" }, 403);

    const body = await req.json().catch(() => ({}));
    const action = body.action ?? "update";
    let userId: string | undefined = body.user_id;

    // Resolve by email when no user_id is supplied
    if (!userId && typeof body.email === "string" && body.email.trim()) {
      const target = body.email.trim().toLowerCase();
      let page = 1;
      while (page <= 20 && !userId) {
        const { data: list, error: listErr } = await adminClient.auth.admin.listUsers({ page, perPage: 200 });
        if (listErr) return json({ error: listErr.message }, 400);
        const found = list.users.find((u) => (u.email ?? "").toLowerCase() === target);
        if (found) userId = found.id;
        if (list.users.length < 200) break;
        page++;
      }
      if (!userId) return json({ error: `User not found: ${body.email}` }, 404);
    }

    if (!userId) return json({ error: "user_id is required" }, 400);

    if (action === "delete") {
      if (userId === caller.id) return json({ error: "Cannot delete yourself" }, 400);
      const { error } = await adminClient.auth.admin.deleteUser(userId);
      if (error) return json({ error: error.message }, 400);
      return json({ ok: true, deleted: userId });
    }

    if (action === "get") {
      const { data, error } = await adminClient.auth.admin.getUserById(userId);
      if (error) return json({ error: error.message }, 400);
      return json({
        user: {
          id: data.user?.id,
          email: data.user?.email,
          last_sign_in_at: data.user?.last_sign_in_at,
        },
      });
    }

    const password: string | undefined = body.password?.trim() || undefined;
    const email: string | undefined = body.email?.trim() || undefined;

    if (!password && !email) return json({ error: "Nothing to update" }, 400);
    if (password && password.length < 8) {
      return json({ error: "Password must be at least 8 characters" }, 400);
    }

    const { data, error } = await adminClient.auth.admin.updateUserById(userId, {
      ...(password ? { password } : {}),
      ...(email ? { email, email_confirm: true } : {}),
    });
    if (error) return json({ error: error.message }, 400);

    return json({ ok: true, user: { id: data.user?.id, email: data.user?.email } });
  } catch (err: unknown) {
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});
