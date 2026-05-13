/**
 * Frontend service for the `export-deep-dive-v2-to-drive` Edge Function.
 * Sends a pre-built markdown (or raw JSON payload) to Google Drive.
 */
import { supabase } from "@/integrations/supabase/client";

export type DeepDiveExportType = "user" | "admin";
export type DeepDiveExportFormat = "markdown" | "json";

export interface ExportDeepDiveToDriveArgs {
  userId: string;
  assessmentId?: string | null;
  exportType: DeepDiveExportType;
  format?: DeepDiveExportFormat;
  /** Required when format = "markdown". */
  content?: string;
  /** Optional raw payload, used when format = "json". */
  payload?: unknown;
  /** Optional override for the filename stem (sanitized server-side). */
  filenameStem?: string;
}

export interface ExportDeepDiveToDriveResult {
  success: boolean;
  fileId: string;
  fileName: string;
  webViewLink: string | null;
  exportType: DeepDiveExportType;
}

export async function exportDeepDiveV2ToDrive(
  args: ExportDeepDiveToDriveArgs,
): Promise<ExportDeepDiveToDriveResult> {
  const { data, error } = await supabase.functions.invoke(
    "export-deep-dive-v2-to-drive",
    { body: args },
  );
  if (error) throw error;
  if (!data || data.error) {
    throw new Error(data?.error || "Drive export failed");
  }
  return data as ExportDeepDiveToDriveResult;
}
