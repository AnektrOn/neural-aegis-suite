import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { OPERATOR_ROLES, OWNER_EMAIL, RECOVERY_START, escapeHtml, isRecentLogin } from './activity-rules.ts';


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
  const fromEmail =
    Deno.env.get("RESEND_FROM_EMAIL")?.trim() || "Protocol Nomos <contact@protocolenomos.com>";

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

/** Envoi via la boîte SMTP existante (fallback quand Resend n'est pas configuré). */
async function sendWithSmtp({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ sent: boolean; provider: string }> {
  const host = Deno.env.get("SMTP_HOST")?.trim();
  const user = Deno.env.get("SMTP_USER")?.trim();
  const password = Deno.env.get("SMTP_PASSWORD")?.trim();
  if (!host || !user || !password) return { sent: false, provider: "none" };

  const port = Number(Deno.env.get("SMTP_PORT")?.trim() || "465");
  const from =
    Deno.env.get("NEWSLETTER_FROM_EMAIL")?.trim() ||
    Deno.env.get("SMTP_FROM")?.trim() ||
    "Protocol Nomos <contact@protocolenomos.com>";

  const client = new SMTPClient({
    connection: {
      hostname: host,
      port,
      tls: port === 465,
      auth: { username: user, password },
    },
  });
  try {
    await client.send({ from, to, subject, html, content: "auto" });
    return { sent: true, provider: "smtp" };
  } finally {
    await client.close();
  }
}

async function sendEmail(params: { to: string; subject: string; html: string }) {
  if (Deno.env.get("RESEND_API_KEY")) return await sendWithResend(params);
  return await sendWithSmtp(params);
}

/** E-mails de tous les comptes admin (destinataires par défaut des alertes admin). */
async function getAdminEmails(supabase: SupabaseClient): Promise<string[]> {
  const { data: admins, error } = await supabase
    .from("user_roles")
    .select("user_id")
    .in("role", OPERATOR_ROLES);
  if (error || !admins?.length) return [];
  const emails: string[] = [];
  for (const a of admins) {
    const { data } = await supabase.auth.admin.getUserById(a.user_id);
    const mail = data?.user?.email?.trim();
    if (mail) emails.push(mail);
  }
  return [...new Set(emails)];
}

/** One in-app notification per admin account (distinct from end-user notifications). */
async function insertNotificationsForAllAdmins(
  supabase: SupabaseClient,
  row: { title: string; message: string; type: string; link?: string | null },
) {
  const { data: admins, error: roleError } = await supabase
    .from("user_roles")
    .select("user_id")
    .in("role", OPERATOR_ROLES);
  if (roleError) {
    console.error("insertNotificationsForAllAdmins: user_roles", roleError.message);
    return;
  }
  if (!admins?.length) return;

  const payload = admins.map((a) => ({
    user_id: a.user_id,
    title: row.title,
    message: row.message,
    type: row.type,
    link: row.link ?? null,
  }));
  const { error } = await supabase.from("notifications").insert(payload);
  if (error) console.error("insertNotificationsForAllAdmins: insert", error.message);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) throw new Error('Missing server configuration');
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json();
    if (!body || typeof body.type !== 'string') return new Response(JSON.stringify({ error: 'Invalid type' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    const { type, user_id, data } = body;

    if (type === 'activity_event' || type === 'activity_catchup' || type === 'admin_login_alert') {
      const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
      const { data: caller } = token ? await supabase.auth.getUser(token) : { data: { user: null } };
      let key = '';
      let subject = '';
      let html = '';
      let recipients = await getAdminEmails(supabase);
      if (type === 'activity_catchup') {
        if (!caller.user) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: corsHeaders });
        const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', caller.user.id).in('role', OPERATOR_ROLES);
        if (!roles?.length) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: corsHeaders });
        recipients = [OWNER_EMAIL];
        key = `activity-catchup:${RECOVERY_START}:2026-11-11`;
        const { data: visits, error: vErr } = await supabase.from('user_sessions').select('user_id,started_at').gt('started_at', RECOVERY_START).lt('started_at', '2026-11-11T04:58:00Z').order('started_at');
        const { data: quizzes, error: qErr } = await supabase.from('assessment_sessions').select('user_id,submitted_at').eq('status','submitted').order('submitted_at');
        const { data: tools, error: tErr } = await supabase.from('toolbox_completions').select('user_id,completed_at,assignment_id').eq('status','completed').order('completed_at');
        if (vErr || qErr || tErr) throw new Error('Unable to read catch-up history');
        const { data: profiles } = await supabase.from('profiles').select('id,display_name');
        const names = new Map((profiles ?? []).map(p => [p.id, p.display_name]));
        const line = (id: string, date: string) => `<li>${escapeHtml(names.get(id) || 'Utilisateur')} — ${escapeHtml(date)}</li>`;
        const { data: ownerProfile } = await supabase.from('profiles').select('id').eq('id','25d80046-d3f4-43f2-933a-ade961f20e28').single();
        const realVisits = (visits ?? []).filter(v => v.user_id !== ownerProfile?.id);
        subject = 'Aegis — rattrapage des alertes d’activité';
        html = `<h2>Rattrapage des alertes</h2><p>Dernière alerte de connexion enregistrée : 17 octobre 2026 à 16:37 UTC. Cette date ne prouve pas une livraison en boîte mail. Les quiz et outils ne déclenchaient pas d’email dans le code examiné ; voici tout leur historique encore disponible.</p><h3>${realVisits.length} visites enregistrées depuis cette date</h3><p>Il s’agit de visites avec suivi accepté, pas de connexions authentifiées prouvées ; les visites sans suivi ne sont pas récupérables.</p><ul>${realVisits.map(v => line(v.user_id,v.started_at)).join('')}</ul><h3>${quizzes?.length ?? 0} quiz terminés conservés</h3><ul>${(quizzes ?? []).map(q => line(q.user_id,q.submitted_at)).join('')}</ul><h3>${tools?.length ?? 0} outils terminés conservés</h3><ul>${(tools ?? []).map(t => line(t.user_id,t.completed_at)).join('')}</ul><p>Aucun historique d’envoi antérieur ne permet de certifier quels emails avaient été reçus. Les données supprimées et anciennes répétitions d’un même outil ne sont pas récupérables.</p>`;
      } else if (type === 'activity_event') {
        if (!['assessment_sessions','toolbox_completions'].includes(body.table) || typeof body.event_id !== 'string' || !/^[0-9a-f-]{36}$/i.test(body.event_id)) return new Response(JSON.stringify({ error: 'Invalid event' }), { status: 400, headers: corsHeaders });
        // Webhooks carry no user JWT: only accept a persisted, recently completed
        // event and resolve its user, content and recipients exclusively server-side.
        const { data: event, error } = await supabase.from(body.table).select('*').eq('id',body.event_id).single();
        if (error || !event || !['completed','submitted'].includes(event.status)) return new Response(JSON.stringify({ error: 'Event not completed' }), { status: 400, headers: corsHeaders });
        const date = event.submitted_at || event.completed_at;
        if (!date || Math.abs(Date.now()-Date.parse(date)) > 300_000) return new Response(JSON.stringify({ error: 'Event outside delivery window' }), { status: 403, headers: corsHeaders });
        const { data: profile } = await supabase.from('profiles').select('display_name').eq('id',event.user_id).single();
        key = body.table === 'assessment_sessions' ? `quiz:${event.id}` : `tool:${event.id}:${date}`;
        subject = body.table === 'assessment_sessions' ? 'Aegis — Quiz terminé' : 'Aegis — Outil terminé';
        let title = '';
        if (event.assignment_id) { const { data: assignment } = await supabase.from('toolbox_assignments').select('title').eq('id',event.assignment_id).single(); title = assignment?.title ?? ''; }
        html = `<h2>${subject}</h2><p>${escapeHtml(profile?.display_name || 'Utilisateur')} a terminé ${body.table === 'assessment_sessions' ? 'un quiz' : `l’outil ${escapeHtml(title)}`}.</p><p>${escapeHtml(date)}</p>`;
      } else {
        if (!caller.user || caller.user.id !== user_id || caller.user.is_anonymous) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
        if (caller.user.email?.toLowerCase() === OWNER_EMAIL) return new Response(JSON.stringify({ success: true, skipped: true }), { headers: corsHeaders });
        const loginAt = caller.user.last_sign_in_at;
        if (!loginAt) throw new Error('Missing login timestamp');
        if (!isRecentLogin(loginAt)) return new Response(JSON.stringify({ success:true, skipped:true, reason:'restored_session' }), { headers:corsHeaders });
        key = `login:${user_id}:${loginAt}`;
        subject = 'Aegis — Connexion utilisateur';
        html = `<h2>Connexion utilisateur</h2><p>${escapeHtml(caller.user.email)} s’est connecté.</p><p>${escapeHtml(loginAt)}</p>`;
      }
      const results = [];
      for (const to of recipients) {
        const { error: claimError } = await supabase.from('activity_email_deliveries').insert({ event_key:key,recipient_email:to });
        if (claimError) {
          if (claimError.code === '23505') { results.push({ recipient:to, duplicate:true }); continue; }
          throw claimError;
        }
        try {
          const result = await sendEmail({ to,subject,html });
          if (!result.sent) throw new Error('Email transport unavailable');
          const { error: recordError } = await supabase.from('activity_email_deliveries').update({ status:'sent',sent_at:new Date().toISOString() }).eq('event_key',key).eq('recipient_email',to);
          if (recordError) throw recordError;
          results.push({ recipient:to,sent:true });
        } catch (error) {
          await supabase.from('activity_email_deliveries').update({ status:'failed',error_message:error instanceof Error ? error.message : 'Delivery failed' }).eq('event_key',key).eq('recipient_email',to);
          throw error;
        }
      }
      if (type === 'admin_login_alert' && results.some(r => r.sent)) await insertNotificationsForAllAdmins(supabase,{ title:subject,message:'Un utilisateur s’est connecté.',type:'admin_login',link:'/admin/analytics' });
      return new Response(JSON.stringify({ success:true,event_key:key,results }), { headers: { ...corsHeaders,'Content-Type':'application/json' } });
    }

    const adminEmailTypes = new Set([
      "admin_login_alert",
      "admin_user_entry_alert",
      "toolbox_abandoned",
    ]);
    let email = (data?.admin_email as string | undefined)?.trim() || undefined;

    if (!email && !adminEmailTypes.has(type)) {
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
      case "welcome_admin_created":
        subject = data?.title || "Bienvenue sur Aegis";
        htmlBody = `<h2>Bienvenue</h2><p>${data?.message || "Votre compte Aegis a été créé."}</p><p><a href="https://aegis.humancatalystbeacon.com/auth">Se connecter</a></p>`;
        break;
      case "subscription_update":
        subject = data?.title || "Votre abonnement AEGIS";
        htmlBody = `<p>${data?.message || ""}</p>`;
        break;
      case "pulse_card":
        subject = data?.title || "Nouvelle carte Pulse - Aegis";
        htmlBody = `<h2>Bonjour,</h2><p>Une nouvelle carte Pulse est disponible : <strong>${data?.message || data?.title || "Nouvelle carte"}</strong></p><p>Ouvrez l'app pour la découvrir.</p>`;
        break;
      case "password_setup":
        subject = "Créez votre mot de passe - Protocole Nomos";
        htmlBody = `<h2>Bonjour ${data?.display_name || ""},</h2>
<p>Votre accès est prêt. Cliquez sur le bouton ci-dessous pour <strong>choisir votre mot de passe</strong> : le lien ouvre directement le formulaire, aucune autre démarche n'est nécessaire.</p>
<p style="margin:28px 0;"><a href="${data?.link}" style="background:#0f766e;color:#ffffff;text-decoration:none;padding:14px 26px;border-radius:8px;font-weight:600;display:inline-block;">Créer mon mot de passe</a></p>
<p style="color:#666;font-size:13px;">Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br /><a href="${data?.link}">${data?.link}</a></p>
<p style="color:#666;font-size:13px;">Ce lien est valable 1 heure et ne peut être utilisé qu'une seule fois.</p>
<hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
<p style="color:#666;font-size:13px;"><em>Hello, your access is ready. Click the button above to choose your password — the link opens the form directly. It is valid for one hour and can be used once.</em></p>`;
        break;
      default:
        subject = data?.title || "Notification Aegis";
        htmlBody = `<p>${data?.message || "Vous avez une nouvelle notification."}</p>`;
    }

    let recipients: string[] = email ? [email] : [];
    if (!recipients.length && adminEmailTypes.has(type)) {
      recipients = await getAdminEmails(supabase);
    }

    let sendResult: { sent: boolean; provider: string } = { sent: false, provider: "none" };
    for (const to of recipients) {
      try {
        sendResult = await sendEmail({ to, subject, html: htmlBody });
      } catch (err) {
        console.error("email delivery failed", to, err instanceof Error ? err.message : err);
      }
    }
    if (!recipients.length) {
      console.log(`Email notification skipped (no recipient): subject=${subject}, type=${type}`);
    }

    console.log(`Email notification: to=${recipients.join(", ") || "(none)"}, subject=${subject}, type=${type}`);

    const skipInApp = data?.skip_in_app === true;

    // In-app: user-targeted vs admin-targeted (see plan: admin_user_entry_alert = email only — DB triggers own in-app).
    if (skipInApp) {
      // In-app déjà créée par le trigger SQL (Toolbox / Pulse).
    } else if (type === "subscription_update") {
      // In-app notification déjà créée par le webhook paiement.
    } else if (type === "admin_user_entry_alert") {
      // Journal in-app notifications come from Postgres triggers; avoid duplicates.
    } else if (type === "admin_login_alert") {
      const msg =
        `${data?.user_name || "Utilisateur"} (${data?.user_email || "?"}) s'est connecté.`;
      await insertNotificationsForAllAdmins(supabase, {
        title: subject,
        message: msg,
        type: "admin_login",
        link: "/admin/analytics",
      });
    } else if (type === "toolbox_abandoned") {
      const msg =
        `${data?.user_name || "?"} a abandonné l'outil « ${data?.tool_title || "?"} ».`;
      await insertNotificationsForAllAdmins(supabase, {
        title: subject,
        message: msg,
        type: "admin_toolbox",
        link: "/admin/toolbox",
      });
    } else if (type === "new_assignment" || type === "admin_message") {
      await supabase.from("notifications").insert({
        user_id,
        title: subject,
        message: data?.message || data?.body || data?.title || "Nouvelle notification",
        type: type === "admin_message" ? "message" : "info",
      });
    } else {
      await supabase.from("notifications").insert({
        user_id,
        title: subject,
        message: data?.message || data?.body || data?.title || "Nouvelle notification",
        type: "info",
      });
    }

    return new Response(
      JSON.stringify({ success: true, recipients, subject, delivery: sendResult }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Email notification error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
