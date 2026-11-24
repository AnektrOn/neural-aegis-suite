import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3';
import { sendTemplateEmail } from '../_shared/transactional-email-templates/send-email.ts';
import { redemptionEmails } from './email-rules.ts';
import { deliverConfirmationFirst } from './delivery-rules.ts';

const Code = z.string().trim().toUpperCase().regex(/^AEGIS-[A-Z0-9]{12}$/);
const Body = z.union([
  z.object({ code: Code, locale: z.enum(['fr', 'en']).default('en') }).strict(),
  z.object({ resend: z.literal(true), locale: z.enum(['fr', 'en']).default('en') }).strict(),
  z.object({ status: z.literal(true) }).strict(),
]);
const respond = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return respond({ error: 'Method not allowed' }, 405);
  try {
    const url = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
    if (!url || !anonKey || !serviceKey) throw new Error('Server configuration missing');
    if (!token) return respond({ error: 'sign_in_required' }, 401);
    const member = createClient(url, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } });
    const { data: auth, error: authError } = await member.auth.getUser(token);
    const user = auth.user;
    if (authError || !user || user.is_anonymous || !user.email) return respond({ error: 'sign_in_required' }, 401);
    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return respond({ error: 'invalid_code' }, 400);
    const locale = 'locale' in parsed.data ? parsed.data.locale : 'en';
    const statusOnly = 'status' in parsed.data;
    const resend = 'resend' in parsed.data;
    const code = 'code' in parsed.data ? parsed.data.code : '';
    // Only initial activation touches access; retries resolve the caller's persisted event.
    let result: Record<string, unknown> = { success: true, already_redeemed: true };
    if (!resend && !statusOnly) {
      const { data, error } = await member.rpc('redeem_appsumo_code', { input_code: code });
      if (error) throw error;
      if (!data?.success) return respond(data);
      result = data;
    }
    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
    try {
      const { data: redemption, error: readError } = await admin.from('appsumo_codes').select('redeemed_at').eq('redeemed_by', user.id).single();
      if (statusOnly) {
        if (readError && readError.code !== 'PGRST116') throw readError;
        if (!redemption?.redeemed_at) return respond({ success: true, activated: false });
        const { data: delivery, error: deliveryError } = await admin.from('activity_email_deliveries').select('status').eq('event_key', `appsumo-welcome:${user.id}:${redemption.redeemed_at}`).eq('recipient_email', user.email).maybeSingle();
        if (deliveryError) throw deliveryError;
        return respond({ success: true, activated: true, emails: delivery?.status === 'sent' ? 'processed' : 'pending' });
      }
      if (readError || !redemption?.redeemed_at) {
        if (resend) return respond({ error: 'activation_not_found' }, 400);
        throw new Error('Activation event not found');
      }
      // Admin notices are best-effort: never block the member confirmation email.
      let adminEmails: string[] = [];
      try {
        const { data: roles, error: roleError } = !result.already_redeemed
          ? await admin.from('user_roles').select('user_id').in('role', ['admin', 'superadmin'])
          : { data: [], error: null };
        if (roleError) throw roleError;
        const resolved = await Promise.all([...new Set((roles ?? []).map(row => row.user_id))].map(async id => {
          const { data, error } = await admin.auth.admin.getUserById(id);
          if (error) {
            console.error('AppSumo admin lookup failed:', error.message);
            return null;
          }
          return data.user?.email ?? null;
        }));
        adminEmails = resolved.filter((email): email is string => Boolean(email));
      } catch (adminError) {
        console.error('AppSumo admin notice skipped:', adminError instanceof Error ? adminError.message : 'Admin lookup unavailable');
      }
      const { data: profile } = await admin.from('profiles').select('display_name').eq('id', user.id).maybeSingle();
      const jobs = redemptionEmails({ userId: user.id, redeemedAt: redemption.redeemed_at, email: user.email, name: profile?.display_name, createdAt: user.created_at, locale, code }, adminEmails);
      await deliverConfirmationFirst(jobs, async job => {
        // Reuse the private activity delivery ledger; SMTP itself has no idempotency keys.
        const key = job.idempotencyKey;
        const { error: claimError } = await admin.from('activity_email_deliveries').insert({ event_key: key, recipient_email: job.recipient });
        if (claimError) {
          if (claimError.code !== '23505') throw claimError;
          const { data: existing, error: lookupError } = await admin.from('activity_email_deliveries').select('status,created_at').eq('event_key', key).eq('recipient_email', job.recipient).single();
          if (lookupError) throw lookupError;
          if (existing.status === 'sent') return;
          if (existing.status === 'sending' && Date.now() - Date.parse(existing.created_at) < 120_000) throw new Error('Confirmation already sending; retry shortly');
          const { data: claimed, error: retryError } = await admin.from('activity_email_deliveries').update({ status: 'sending', created_at: new Date().toISOString(), error_message: null }).eq('event_key', key).eq('recipient_email', job.recipient).eq('status', existing.status).eq('created_at', existing.created_at).select('event_key');
          if (retryError) throw retryError;
          if (!claimed?.length) throw new Error('Confirmation already sending; retry shortly');
        }
        try {
          const sent = await sendTemplateEmail(job.template, job.recipient, { templateData: job.data, idempotencyKey: key, replyTo: 'contact@protocolenomos.com' });
          if (!sent.sent) throw new Error('Confirmation not sent');
          const { error: recordError } = await admin.from('activity_email_deliveries').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('event_key', key).eq('recipient_email', job.recipient);
          if (recordError) throw recordError;
          console.log('AppSumo email accepted', job.template);
        } catch (error) {
          await admin.from('activity_email_deliveries').update({ status: 'failed', error_message: error instanceof Error ? error.message : 'Email unavailable' }).eq('event_key', key).eq('recipient_email', job.recipient);
          throw error;
        }
      });
      return respond({ ...result, emails: 'processed' });
    } catch (emailError) {
      const message = emailError instanceof Error ? emailError.message : 'Email unavailable';
      console.error('AppSumo confirmation failed:', message);
      return respond({ ...result, emails: 'pending', email_error: message });
    }
  } catch (error) {
    console.error('AppSumo redemption failed:', error instanceof Error ? error.message : 'Unknown error');
    return respond({ error: 'Redemption unavailable' }, 500);
  }
});