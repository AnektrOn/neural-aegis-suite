/** Pré-onboarding /start leads (complétion + abandons à forte intention). Override via secret Supabase. */
const DEFAULT_EXECUTIVE_ONBOARDING_SHEET_ID =
  "1e8WNADbIF-a3b93Iw5rRegmD1AmBABaUHGLuea5VH8w";

/**
 * Append one row to the executive onboarding Google Sheet.
 * Uses the same Lovable Google connection headers as Drive exports.
 *
 * Row layout (header row on tab `Leads`): completed_at, user_id, auth_email, full_name,
 * contact_email, birth_date, location, occupation, urgent_decision, stakeholders, clarity_or_step
 */
export async function appendGoogleSheetRow(values: string[]): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const sheetId =
    Deno.env.get("EXECUTIVE_ONBOARDING_SHEET_ID")?.trim() || DEFAULT_EXECUTIVE_ONBOARDING_SHEET_ID;

  const lov = Deno.env.get("LOVABLE_API_KEY")?.trim();
  const gd = Deno.env.get("GOOGLE_DRIVE_API_KEY")?.trim();
  if (!lov || !gd) {
    return { ok: false, error: "Google connection not configured" };
  }

  const range = Deno.env.get("EXECUTIVE_ONBOARDING_SHEET_RANGE")?.trim() || "Leads!A:Z";
  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/` +
    `${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lov}`,
      "X-Connection-Api-Key": gd,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ values: [values] }),
  });

  if (!res.ok) {
    const body = await res.text();
    return { ok: false, error: `Sheets append ${res.status}: ${body.slice(0, 400)}` };
  }

  return { ok: true };
}