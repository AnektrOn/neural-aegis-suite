import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function sendWithResend({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "Aegis <notifications@aegis.local>";

  if (!resendApiKey) {
    console.warn("RESEND_API_KEY is not set. Email is logged only.");
    return { sent: false, provider: "none" };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [to],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend error ${response.status}: ${body}`);
  }

  return { sent: true, provider: "resend" };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { type, user_id, data } = await req.json();

    // Get user email by default; allow explicit target email for admin alerts.
    let email = data?.admin_email as string | undefined;
    if (!email) {
      const { data: userData } = await supabase.auth.admin.getUserById(user_id);
      if (!userData?.user?.email) {
        return new Response(JSON.stringify({ error: "User not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      email = userData.user.email;
    }
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
      case "admin_login_alert":
        subject = "Alerte admin - Connexion utilisateur";
        htmlBody = `<h2>Connexion détectée</h2><p><strong>${data?.user_name || "Utilisateur inconnu"}</strong> (${data?.user_email || "email indisponible"}) vient de se connecter.</p><p>Horodatage: ${data?.logged_at || new Date().toISOString()}</p>`;
        break;
      case "admin_user_entry_alert":
        subject = "Alerte admin - Nouvelle entrée utilisateur";
        htmlBody = `<h2>Nouvelle entrée utilisateur</h2><p><strong>${data?.user_name || "Utilisateur inconnu"}</strong> (${data?.user_email || "email indisponible"}) a créé une nouvelle entrée.</p><p>Titre: <strong>${data?.entry_title || "Sans titre"}</strong></p><p>Aperçu:</p><blockquote style="border-left:3px solid #2dd4bf;padding-left:12px;margin:16px 0;color:#555;">${data?.entry_preview || "Aucun contenu"}</blockquote><p>Horodatage: ${data?.created_at || new Date().toISOString()}</p>`;
        break;
      default:
        subject = "Notification Aegis";
        htmlBody = `<p>${data?.message || "Vous avez une nouvelle notification."}</p>`;
    }

    const sendResult = await sendWithResend({ to: email, subject, html: htmlBody });

    // Keep logs for observability even when provider is active.
    console.log(`Email notification: to=${email}, subject=${subject}, type=${type}`);

    // Create in-app notification as fallback
    await supabase.from("notifications").insert({
      user_id,
      title: subject,
      message: data?.message || data?.body || data?.title || "Nouvelle notification",
      type: type === "admin_message" ? "message" : "info",
    });

    return new Response(
      JSON.stringify({ success: true, email, subject, delivery: sendResult }),
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
