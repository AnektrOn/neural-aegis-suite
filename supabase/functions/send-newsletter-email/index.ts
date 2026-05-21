import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type Locale = "fr" | "en";

function appBaseUrl(): string {
  const raw = Deno.env.get("APP_BASE_URL")?.trim() || "";
  return raw.replace(/\/$/, "") || "https://aegis.humancatalystbeacon.com";
}

function newsletterHubUrl(): string {
  return `${appBaseUrl()}/newsletter`;
}

function editionUrl(slug: string): string {
  return `${appBaseUrl()}/newsletter/${encodeURIComponent(slug)}`;
}

function unsubscribeUrl(email: string): string {
  return `${newsletterHubUrl()}?unsubscribe=${encodeURIComponent(email)}`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function truncateBrief(text: string, max = 280): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  from: string;
}

function getSmtpConfig(): SmtpConfig | null {
  const host = Deno.env.get("SMTP_HOST")?.trim();
  const user = Deno.env.get("SMTP_USER")?.trim();
  const password = Deno.env.get("SMTP_PASSWORD")?.trim();
  if (!host || !user || !password) return null;

  const port = Number(Deno.env.get("SMTP_PORT")?.trim() || "465");
  const from =
    Deno.env.get("NEWSLETTER_FROM_EMAIL")?.trim() ||
    Deno.env.get("SMTP_FROM")?.trim() ||
    "Protocol Nomos <contact@protocolenomos.com>";

  return { host, port, user, password, from };
}

/** Envoi via la boîte SMTP existante (hébergeur mail) — pas de Resend. */
async function sendWithSmtp({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ sent: boolean; provider: string }> {
  const smtp = getSmtpConfig();
  if (!smtp) {
    console.warn(
      "[newsletter] SMTP non configuré (SMTP_HOST, SMTP_USER, SMTP_PASSWORD). E-mail ignoré.",
    );
    console.log(`[newsletter] to=${to} subject=${subject}`);
    return { sent: false, provider: "none" };
  }

  // Port 465 = TLS implicite (tls: true). Port 587 = STARTTLS (tls: false).
  const client = new SMTPClient({
    connection: {
      hostname: smtp.host,
      port: smtp.port,
      tls: smtp.port === 465,
      auth: {
        username: smtp.user,
        password: smtp.password,
      },
    },
  });

  try {
    await client.send({
      from: smtp.from,
      to,
      subject,
      html,
      content: "auto",
    });
    return { sent: true, provider: "smtp" };
  } finally {
    await client.close();
  }
}

function emailShell(params: {
  locale: Locale;
  title: string;
  bodyHtml: string;
  ctaLabel: string;
  ctaHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  footerNote: string;
  unsubscribeHref: string;
}): string {
  const { locale, title, bodyHtml, ctaLabel, ctaHref, secondaryLabel, secondaryHref, footerNote, unsubscribeHref } =
    params;
  const lang = locale === "en" ? "en" : "fr";

  return `<!DOCTYPE html>
<html lang="${lang}">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#0f1115;font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1115;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#1a1d24;border:1px solid #2a2f3a;border-radius:16px;overflow:hidden;">
        <tr><td style="padding:28px 32px 8px;">
          <p style="margin:0;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#9ca3af;">Neural Aegis</p>
          <h1 style="margin:12px 0 0;font-size:22px;font-weight:500;color:#f3f4f6;line-height:1.35;">${title}</h1>
        </td></tr>
        <tr><td style="padding:8px 32px 24px;color:#d1d5db;font-size:15px;line-height:1.6;">${bodyHtml}</td></tr>
        <tr><td style="padding:0 32px 28px;">
          <a href="${ctaHref}" style="display:inline-block;padding:14px 24px;background:#c9a227;color:#0f1115;text-decoration:none;border-radius:10px;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;font-family:system-ui,sans-serif;">${ctaLabel}</a>
          ${secondaryLabel && secondaryHref ? `<p style="margin:20px 0 0;"><a href="${secondaryHref}" style="color:#9ca3af;font-size:13px;">${secondaryLabel}</a></p>` : ""}
        </td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid #2a2f3a;font-size:11px;color:#6b7280;line-height:1.5;">
          ${footerNote}<br/>
          <a href="${unsubscribeHref}" style="color:#6b7280;">${locale === "en" ? "Unsubscribe" : "Se désabonner"}</a>
          · <a href="${newsletterHubUrl()}" style="color:#6b7280;">${locale === "en" ? "Newsletter hub" : "Espace newsletter"}</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function welcomeEmail(locale: Locale, email: string) {
  const isEn = locale === "en";
  const title = isEn ? "You're subscribed" : "Inscription confirmée";
  const brief = isEn
    ? "You'll receive a short email when a new edition is published. The full letter is always available in the Neural Aegis app."
    : "Vous recevrez un court e-mail à chaque nouvelle édition. La lettre complète est toujours disponible dans l'application Neural Aegis.";
  const body = `<p style="margin:0;color:#9ca3af;font-size:14px;line-height:1.6;">${escapeHtml(brief)}</p>`;
  const html = emailShell({
    locale,
    title,
    bodyHtml: body,
    ctaLabel: isEn ? "Open in app" : "Ouvrir dans l'app",
    ctaHref: newsletterHubUrl(),
    footerNote: isEn
      ? "Notification only — read the full newsletter in the app."
      : "Notification uniquement — lisez la newsletter complète dans l'app.",
    unsubscribeHref: unsubscribeUrl(email),
  });
  const subject = isEn
    ? "Neural Aegis — Newsletter subscription"
    : "Neural Aegis — Inscription newsletter";
  return { subject, html };
}

function editionEmail(
  locale: Locale,
  email: string,
  edition: {
    slug: string;
    title_fr: string;
    title_en: string;
    excerpt_fr: string;
    excerpt_en: string;
  },
) {
  const isEn = locale === "en";
  const editionTitle = isEn ? edition.title_en : edition.title_fr;
  const excerpt = truncateBrief(isEn ? edition.excerpt_en : edition.excerpt_fr);
  const notifTitle = isEn ? "New edition available" : "Nouvelle édition disponible";
  const intro = isEn
    ? "A new Neural Letter is in the app. Here is a brief preview:"
    : "Une nouvelle Lettre Neural est dans l'app. Voici un bref aperçu :";
  const briefBlock = excerpt
    ? `<blockquote style="margin:16px 0;padding:12px 16px;border-left:3px solid #c9a227;color:#d1d5db;font-size:14px;line-height:1.55;">${escapeHtml(excerpt)}</blockquote>`
    : `<p style="color:#9ca3af;font-size:14px;font-style:italic;">${isEn ? "Open the app to read the full edition." : "Ouvrez l'app pour lire l'édition complète."}</p>`;
  const body = `<p style="margin:0 0 8px;">${intro}</p><p style="margin:0 0 4px;font-weight:500;color:#f3f4f6;">${escapeHtml(editionTitle)}</p>${briefBlock}<p style="margin:16px 0 0;color:#6b7280;font-size:12px;">${isEn ? "Full content is only in the Neural Aegis app." : "Le contenu intégral est uniquement dans l'application Neural Aegis."}</p>`;
  const html = emailShell({
    locale,
    title: notifTitle,
    bodyHtml: body,
    ctaLabel: isEn ? "Read in app" : "Lire dans l'app",
    ctaHref: editionUrl(edition.slug),
    secondaryLabel: isEn ? "Newsletter hub" : "Espace newsletter",
    secondaryHref: newsletterHubUrl(),
    footerNote: isEn
      ? "This email is a notification with a brief — not the full letter."
      : "Cet e-mail est une notification avec un brief — pas la lettre complète.",
    unsubscribeHref: unsubscribeUrl(email),
  });
  const subject = isEn
    ? `Neural Letter — ${editionTitle}`
    : `Lettre Neural — ${editionTitle}`;
  return { subject, html };
}

async function processQueue(
  supabase: ReturnType<typeof createClient>,
  limit: number,
) {
  const { data: jobs, error } = await supabase
    .from("newsletter_email_queue")
    .select("id, kind, recipient_email, locale, edition_id")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) throw error;
  if (!jobs?.length) return { processed: 0, sent: 0 };

  let sent = 0;
  for (const job of jobs) {
    const locale = (job.locale === "en" ? "en" : "fr") as Locale;
    try {
      let subject = "";
      let html = "";

      if (job.kind === "welcome") {
        const mail = welcomeEmail(locale, job.recipient_email);
        subject = mail.subject;
        html = mail.html;
      } else if (job.kind === "edition" && job.edition_id) {
        const { data: edition, error: edErr } = await supabase
          .from("newsletter_editions")
          .select("slug, title_fr, title_en, excerpt_fr, excerpt_en, status")
          .eq("id", job.edition_id)
          .single();
        if (edErr || !edition || edition.status !== "published") {
          throw new Error("edition_not_found");
        }
        const mail = editionEmail(locale, job.recipient_email, edition);
        subject = mail.subject;
        html = mail.html;
      } else {
        throw new Error("invalid_job");
      }

      await sendWithSmtp({ to: job.recipient_email, subject, html });

      await supabase
        .from("newsletter_email_queue")
        .update({ status: "sent", sent_at: new Date().toISOString(), error_message: null })
        .eq("id", job.id);

      sent++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "unknown";
      await supabase
        .from("newsletter_email_queue")
        .update({ status: "failed", error_message: msg })
        .eq("id", job.id);
    }
  }

  return { processed: jobs.length, sent };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json();
    const { action, limit, email, locale, edition_id } = body;

    if (action === "process_queue") {
      const result = await processQueue(supabase, Math.min(Math.max(Number(limit) || 10, 1), 50));
      return new Response(JSON.stringify({ success: true, ...result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "welcome" && email) {
      const loc = (locale === "en" ? "en" : "fr") as Locale;
      const mail = welcomeEmail(loc, String(email).trim().toLowerCase());
      const delivery = await sendWithSmtp({
        to: String(email).trim().toLowerCase(),
        subject: mail.subject,
        html: mail.html,
      });
      return new Response(JSON.stringify({ success: true, delivery }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "edition_broadcast" && edition_id) {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: userData } = await userClient.auth.getUser();
      if (!userData?.user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: role } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userData.user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!role) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: queued, error: rpcErr } = await supabase.rpc("enqueue_newsletter_edition_emails", {
        p_edition_id: edition_id,
      });
      if (rpcErr) throw rpcErr;

      const result = await processQueue(supabase, 50);

      await supabase
        .from("newsletter_editions")
        .update({ email_sent_at: new Date().toISOString() })
        .eq("id", edition_id);

      return new Response(
        JSON.stringify({ success: true, queued: queued ?? 0, ...result }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("send-newsletter-email:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
