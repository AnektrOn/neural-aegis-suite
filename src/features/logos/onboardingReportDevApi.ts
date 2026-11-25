import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export async function readEdgeFunctionError(error: FunctionsHttpError): Promise<string> {
  let detail = error.message;
  try {
    const ctx = (await error.context.json()) as { error?: string } | null;
    if (ctx?.error) detail = String(ctx.error);
  } catch {
    /* ignore */
  }
  if (detail === "Action inconnue") {
    return "Fonction Edge non à jour — redéploie elevenlabs-knowledge sur Supabase (Dashboard → Edge Functions → deploy).";
  }
  if (detail.includes("non-2xx")) {
    return "Fonction Edge non à jour ou erreur serveur — redéploie elevenlabs-knowledge.";
  }
  return detail;
}

export async function fetchOnboardingReportAgentId(): Promise<string | null> {
  const { data, error } = await supabase.functions.invoke<{ agent_id?: string | null; error?: string }>(
    "elevenlabs-knowledge",
    { body: { action: "onboarding_report_status" } },
  );
  if (error instanceof FunctionsHttpError) {
    if ((await readEdgeFunctionError(error)).includes("non à jour")) return null;
    throw error;
  }
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data?.agent_id?.trim() || null;
}

export async function previewOnboardingDrivePack(driveFolderId: string): Promise<{
  folder_name?: string;
  files?: { relativePath: string; name: string }[];
}> {
  const { data, error } = await supabase.functions.invoke<{
    ok?: boolean;
    folder_name?: string;
    files?: { relativePath: string; name: string }[];
    error?: string;
  }>("elevenlabs-knowledge", {
    body: { action: "preview_onboarding_pack", drive_folder_id: driveFolderId },
  });
  if (error instanceof FunctionsHttpError) {
    throw new Error(await readEdgeFunctionError(error));
  }
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data ?? {};
}