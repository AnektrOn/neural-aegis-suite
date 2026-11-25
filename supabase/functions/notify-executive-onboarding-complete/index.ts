import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { isInternalRequest } from "../_shared/internalAuth.ts";
import {
  executiveOnboardingAbandonSheetRow,
  executiveOnboardingAdminHtml,
  executiveOnboardingSheetRow,
  loadExecutiveLead,
  loadFunnelEvent,
} from "../_shared/executive-onboarding-lead.ts";
import { appendGoogleSheetRow } from "../_shared/googleSheetsAppend.ts";

const cors = {
  ...corsHeaders,
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-internal-secret",
};

const UUID_RE = /^[0-9a-f-]{36}$/i;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) throw new Error("Backend not configured");

    const admin = createClient(supabaseUrl, serviceKey);
    if (!(await isInternalRequest(req, admin))) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const mode = typeof body.mode === "string" ? body.mode : "complete";

    const internalHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceKey}`,
    };
    const forwardedSecret = req.headers.get("x-internal-secret")?.trim();
    if (forwardedSecret) internalHeaders["x-internal-secret"] = forwardedSecret;

    if (mode === "sheet_test") {
      const now = new Date().toISOString();
      const testRow = [
        now,
        "00000000-0000-4000-8000-0000000eef00",
        "",
        "Test AEGIS (sheet_test)",
        "test-onboarding@protocolenomos.com",
        "1990-01-01",
        "Paris (test)",
        "Dirigeant test",
        "Décision test",
        "Stakeholder test",
        "TEST",
      ];
      const sheetResult = await appendGoogleSheetRow(testRow);
      return new Response(
        JSON.stringify({
          success: sheetResult.ok,
          mode,
          sheet: sheetResult,
          row: testRow,
        }),
        { headers: { ...cors, "Content-Type": "application/json" } },
      );
    }

    if (mode === "funnel_abandon") {
      const eventId = typeof body.event_id === "string" ? body.event_id : null;
      if (!eventId || !UUID_RE.test(eventId)) {
        return new Response(JSON.stringify({ error: "Invalid event_id" }), {
          status: 400,
          headers: { ...cors, "Content-Type": "application/json" },
        });
      }

      const event = await loadFunnelEvent(admin, eventId);
      if (!event) {
        return new Response(JSON.stringify({ success: true, skipped: true, reason: "no_event" }), {
          headers: { ...cors, "Content-Type": "application/json" },
        });
      }

      const emailRes = await fetch(`${supabaseUrl}/functions/v1/send-email-notification`, {
        method: "POST",
        headers: internalHeaders,
        body: JSON.stringify({
          type: "executive_onboarding_abandoned",
          event_id: eventId,
        }),
      });

      const emailJson = await emailRes.json().catch(() => ({}));
      const sheetResult = await appendGoogleSheetRow(executiveOnboardingAbandonSheetRow(event));

      return new Response(
        JSON.stringify({
          success: true,
          mode,
          event_id: eventId,
          email: emailJson,
          sheet: sheetResult,
        }),
        { headers: { ...cors, "Content-Type": "application/json" } },
      );
    }

    const userId = typeof body.user_id === "string" ? body.user_id : null;
    if (!userId || !UUID_RE.test(userId)) {
      return new Response(JSON.stringify({ error: "Invalid user_id" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const lead = await loadExecutiveLead(admin, userId);
    if (!lead) {
      return new Response(JSON.stringify({ success: true, skipped: true, reason: "no_profile" }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const emailRes = await fetch(`${supabaseUrl}/functions/v1/send-email-notification`, {
      method: "POST",
      headers: internalHeaders,
      body: JSON.stringify({
        type: "executive_onboarding_completed",
        user_id: userId,
      }),
    });

    const emailJson = await emailRes.json().catch(() => ({}));
    const sheetResult = await appendGoogleSheetRow(executiveOnboardingSheetRow(lead));

    return new Response(
      JSON.stringify({
        success: true,
        user_id: userId,
        email: emailJson,
        sheet: sheetResult,
        preview_html: executiveOnboardingAdminHtml(lead),
      }),
      { headers: { ...cors, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});