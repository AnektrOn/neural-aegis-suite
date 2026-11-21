import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3';
import { sendTemplateEmail } from '../_shared/transactional-email-templates/send-email.ts';
import { redemptionEmails } from './email-rules.ts';

const Body = z.object({ code: z.string().trim().toUpperCase().regex(/^AEGIS-[A-Z0-9]{12}$/), locale: z.enum(['fr', 'en']).default('en') }).strict();
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
    const { code, locale } = parsed.data;
    // Keep the authenticated atomic database function authoritative for access.
    const { data: result, error } = await member.rpc('redeem_appsumo_code', { input_code: code });
    if (error) throw error;
    if (!result?.success) return respond(result);
    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
    const codeHash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(code))), b => b.toString(16).padStart(2, '0')).join('');
    try {
      const { data: redemption, error: readError } = await admin.from('appsumo_codes').select('redeemed_at').eq('code_hash', codeHash).eq('redeemed_by', user.id).single();
      if (readError || !redemption?.redeemed_at) throw new Error('Activation event not found');
      // Admin notices are best-effort: never block the member confirmation email.
      let adminEmails: string[] = [];
      try {
        const { data: roles, error: roleError } = await admin.from('user_roles').select('user_id').in('role', ['admin', 'superadmin']);
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
      // SMTP via contact@ — Hostinger cannot delegate Lovable's notify NS subdomain.
      const outcomes = await Promise.allSettled(jobs.map(job => sendTemplateEmail(job.template, job.recipient, { templateData: job.data, idempotencyKey: job.idempotencyKey, replyTo: 'contact@protocolenomos.com' })));
      for (const outcome of outcomes) {
        if (outcome.status === 'rejected') {
          const reason = outcome.reason;
          console.error('AppSumo confirmation failed:', reason instanceof Error ? reason.message : reason?.code || reason?.message || String(reason) || 'Email unavailable');
        }
      }
      // Member welcome is the confirmation buyers see; admin notice failures must not block them.
      const welcome = outcomes[0];
      if (!welcome || welcome.status === 'rejected') {
        const reason = welcome && welcome.status === 'rejected' ? welcome.reason : null;
        const emailError = reason instanceof Error ? reason.message : reason?.message || 'Email unavailable';
        return respond({ ...result, emails: 'pending', email_error: emailError });
      }
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