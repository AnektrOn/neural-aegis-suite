import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller is admin
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { resolveCallerRoles } = await import("../_shared/b2b-roles.ts");
    const roles = await resolveCallerRoles(adminClient, caller.id);
    if (!roles.isSuperAdmin) {
      return new Response(JSON.stringify({ error: "Superadmin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, password, display_name, company_id, country } = await req.json();

    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Email and password are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (password.length < 8 || !/[A-Za-zÀ-ÿ]/.test(password) || !/[0-9]/.test(password)) {
      return new Response(
        JSON.stringify({
          error: "Password must be at least 8 characters and include a letter and a digit",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (company_id) {
      const { data: hasSeat } = await adminClient.rpc("company_has_seat_available", {
        _company_id: company_id,
      });
      if (hasSeat === false) {
        return new Response(JSON.stringify({ error: "No seats available for this company" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Create user via admin API
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: display_name || email },
    });

    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update profile with company and country if provided
    if (newUser?.user && (company_id || country)) {
      await adminClient
        .from("profiles")
        .update({
          ...(company_id ? { company_id } : {}),
          ...(country ? { country } : {}),
        })
        .eq("id", newUser.user.id);
    }

    // Welcome email (transactional) — password was set by admin
    if (newUser?.user?.email) {
      try {
        const name = display_name || newUser.user.email;
        await fetch(`${supabaseUrl}/functions/v1/send-email-notification`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${supabaseServiceKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "welcome_admin_created",
            user_id: newUser.user.id,
            data: {
              title: "Bienvenue sur Aegis",
              message: `Bonjour ${name}, votre compte Aegis a été créé. Connectez-vous sur https://aegis.humancatalystbeacon.com/auth avec l'e-mail ${newUser.user.email} et le mot de passe communiqué par votre coach.`,
              skip_in_app: false,
            },
          }),
        });
      } catch (e) {
        console.error("welcome email failed:", e);
      }
    }

    return new Response(JSON.stringify({ user: { id: newUser.user.id, email: newUser.user.email } }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
