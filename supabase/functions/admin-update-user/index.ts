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
    const body = await req.json().catch(() => ({}));
    const action = body.action ?? "update";
    let userId: string | undefined = body.user_id;

    const { resolveCallerRoles } = await import("../_shared/b2b-roles.ts");
    const roles = await resolveCallerRoles(adminClient, caller.id);
    const isAdmin = roles.isPlatformOperator;
    const isSuperAdmin = roles.isSuperAdmin;

    // Self-delete: any authenticated user may delete their own account (no admin role).
    if (action === "self_delete") {
      userId = caller.id;
      const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
      const { data: subs } = await adminClient
        .from("subscriptions")
        .select("id, paddle_subscription_id, status")
        .eq("user_id", userId);

      const cancelResults: Array<{ id: string; mode: string; error?: string }> = [];
      for (const sub of subs ?? []) {
        const status = sub.status as string | null;
        if (!status || !["active", "trialing", "past_due"].includes(status)) continue;
        const stripeId = sub.paddle_subscription_id as string | null;
        if (stripeKey && stripeId?.startsWith("sub_")) {
          try {
            const Stripe = (await import("npm:stripe@17")).default;
            const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
            await stripe.subscriptions.cancel(stripeId);
            await adminClient
              .from("subscriptions")
              .update({ status: "canceled", updated_at: new Date().toISOString() })
              .eq("id", sub.id);
            cancelResults.push({ id: sub.id, mode: "stripe_cancel" });
          } catch (e) {
            cancelResults.push({
              id: sub.id,
              mode: "stripe_error",
              error: e instanceof Error ? e.message : String(e),
            });
          }
        } else {
          await adminClient
            .from("subscriptions")
            .update({ status: "canceled", updated_at: new Date().toISOString() })
            .eq("id", sub.id);
          cancelResults.push({ id: sub.id, mode: "db_only" });
        }
      }

      await adminClient.from("admin_audit_log").insert({
        actor_id: caller.id,
        action: "self_delete_user",
        target_user_id: userId,
        meta: { cancelResults },
      });

      const { error } = await adminClient.auth.admin.deleteUser(userId);
      if (error) return json({ error: error.message, cancelResults }, 400);
      return json({ ok: true, deleted: userId, cancelResults });
    }

    if (!isAdmin) return json({ error: "Admin access required" }, 403);

    // Destructive / credential actions: superadmin only
    if ((action === "delete" || action === "reset_password" || action === "update") && !isSuperAdmin) {
      return json({ error: "Superadmin access required" }, 403);
    }

    // Resolve by email when no user_id is supplied
    if (
      !userId &&
      (action === "delete" || action === "get" || action === "reset_password") &&
      typeof body.email === "string" && body.email.trim()
    ) {
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

    // Send a branded "create your password" email with a direct set-password link.
    if (action === "reset_password") {
      const { data: target, error: getErr } = await adminClient.auth.admin.getUserById(userId);
      if (getErr) return json({ error: getErr.message }, 400);
      const targetEmail = target.user?.email;
      if (!targetEmail) return json({ error: "This account has no email address" }, 400);

      const redirectTo = typeof body.redirect_to === "string" && body.redirect_to.startsWith("http")
        ? body.redirect_to
        : "https://aegis.humancatalystbeacon.com/create-password";

      const { data: linkData, error: linkErr } = await adminClient.auth.admin.generateLink({
        type: "recovery",
        email: targetEmail,
        options: { redirectTo },
      });
      if (linkErr) return json({ error: linkErr.message }, 400);

      const hashedToken = linkData?.properties?.hashed_token;
      if (!hashedToken) return json({ error: "Could not generate the password link" }, 400);

      const setPasswordUrl = `${redirectTo}${redirectTo.includes("?") ? "&" : "?"}token_hash=${encodeURIComponent(hashedToken)}&type=recovery`;

      const displayName =
        (target.user?.user_metadata?.display_name as string | undefined) || targetEmail;

      const { error: mailErr } = await adminClient.functions.invoke("send-email-notification", {
        body: {
          type: "password_setup",
          user_id: userId,
          data: { link: setPasswordUrl, display_name: displayName },
        },
      });
      if (mailErr) return json({ error: mailErr.message }, 400);

      return json({ ok: true, sent_to: targetEmail, redirect_to: redirectTo });
    }

    if (action === "delete") {
      if (userId === caller.id) return json({ error: "Cannot delete yourself" }, 400);

      // Cancel active Stripe subscriptions before deleting the auth user
      const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
      const { data: subs } = await adminClient
        .from("subscriptions")
        .select("id, paddle_subscription_id, status")
        .eq("user_id", userId);

      const cancelResults: Array<{ id: string; mode: string; error?: string }> = [];
      for (const sub of subs ?? []) {
        const status = sub.status as string | null;
        if (!status || !["active", "trialing", "past_due"].includes(status)) continue;
        const stripeId = sub.paddle_subscription_id as string | null;
        if (stripeKey && stripeId?.startsWith("sub_")) {
          try {
            const Stripe = (await import("npm:stripe@17")).default;
            const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
            await stripe.subscriptions.cancel(stripeId);
            await adminClient
              .from("subscriptions")
              .update({ status: "canceled", updated_at: new Date().toISOString() })
              .eq("id", sub.id);
            cancelResults.push({ id: sub.id, mode: "stripe_cancel" });
          } catch (e) {
            cancelResults.push({
              id: sub.id,
              mode: "stripe_error",
              error: e instanceof Error ? e.message : String(e),
            });
          }
        } else {
          await adminClient
            .from("subscriptions")
            .update({ status: "canceled", updated_at: new Date().toISOString() })
            .eq("id", sub.id);
          cancelResults.push({ id: sub.id, mode: "db_only" });
        }
      }

      await adminClient.from("admin_audit_log").insert({
        actor_id: caller.id,
        action: "delete_user",
        target_user_id: userId,
        meta: { cancelResults },
      });

      const { error } = await adminClient.auth.admin.deleteUser(userId);
      if (error) return json({ error: error.message, cancelResults }, 400);
      return json({ ok: true, deleted: userId, cancelResults });
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
