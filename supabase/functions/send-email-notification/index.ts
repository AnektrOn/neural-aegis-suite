import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { type, user_id, data } = await req.json();

    // Get user email
    const { data: userData } = await supabase.auth.admin.getUserById(user_id);
    if (!userData?.user?.email) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const email = userData.user.email;
    let subject = "";
    let htmlBody = "";

    switch (type) {
      case "new_assignment":
        subject = "Nouveau contenu assigné - Aegis";
        htmlBody = `<h2>Bonjour,</h2><p>Un nouveau contenu vous a été assigné : <strong>${data?.title || "Nouvel outil"}</strong></p><p>Connectez-vous pour le découvrir.</p>`;
        break;
      case "admin_message":
        subject = `Message de votre coach : ${data?.subject || ""}`;
        htmlBody = `<h2>Bonjour,</h2><p>Vous avez reçu un message de votre coach :</p><blockquote style="border-left:3px solid #2dd4bf;padding-left:12px;margin:16px 0;color:#555;">${data?.body || ""}</blockquote>`;
        break;
      case "toolbox_abandoned":
        subject = "Outil abandonné - Notification Admin";
        htmlBody = `<h2>Notification Admin</h2><p>L'utilisateur <strong>${data?.user_name || "?"}</strong> a abandonné l'outil <strong>"${data?.tool_title || "?"}"</strong>.</p>`;
        break;
      default:
        subject = "Notification Aegis";
        htmlBody = `<p>${data?.message || "Vous avez une nouvelle notification."}</p>`;
    }

    // Log the email attempt (in production, integrate with an email provider)
    console.log(`Email notification: to=${email}, subject=${subject}, type=${type}`);

    // Create in-app notification as fallback
    await supabase.from("notifications").insert({
      user_id,
      title: subject,
      message: data?.message || data?.body || data?.title || "Nouvelle notification",
      type: type === "admin_message" ? "message" : "info",
    });

    return new Response(
      JSON.stringify({ success: true, email, subject }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Email notification error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
