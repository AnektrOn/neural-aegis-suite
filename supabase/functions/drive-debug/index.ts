// Temporary debug listing endpoint
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-internal-call",
};

const GATEWAY = "https://connector-gateway.lovable.dev/google_drive";
const ROOT = "1Gqkmqxr3EIymDFvGbC3vc7-ckEG59of8";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const lov = Deno.env.get("LOVABLE_API_KEY")!;
  const gd = Deno.env.get("GOOGLE_DRIVE_API_KEY")!;
  const headers = { Authorization: `Bearer ${lov}`, "X-Connection-Api-Key": gd };

  const url0 = new URL(req.url);
  const parent = url0.searchParams.get("parent") || ROOT;
  const q = `'${parent}' in parents and trashed=false`;
  const url = `${GATEWAY}/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,mimeType,createdTime,owners(emailAddress))&orderBy=name&pageSize=1000&supportsAllDrives=true&includeItemsFromAllDrives=true`;
  const r = await fetch(url, { headers });
  const data = await r.json();
  return new Response(JSON.stringify(data, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
