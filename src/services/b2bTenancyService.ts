import { supabase } from "@/integrations/supabase/client";

export async function grantCompanyAdmin(userId: string, companyId: string) {
  const { data, error } = await supabase.rpc("grant_company_admin" as never, {
    p_user_id: userId,
    p_company_id: companyId,
  } as never);
  if (error) throw error;
  return data;
}

export async function revokeCompanyAdmin(userId: string, companyId: string) {
  const { data, error } = await supabase.rpc("revoke_company_admin" as never, {
    p_user_id: userId,
    p_company_id: companyId,
  } as never);
  if (error) throw error;
  return data;
}

export async function leaveCompany(userId?: string) {
  const { data, error } = await supabase.rpc("leave_company" as never, {
    p_user_id: userId ?? null,
  } as never);
  if (error) throw error;
  return data;
}

export async function acceptCompanyInvite(token: string) {
  const { data, error } = await supabase.rpc("accept_company_invite" as never, {
    p_token: token,
  } as never);
  if (error) throw error;
  return data;
}

export async function createCompanyInvite(params: {
  companyId: string;
  email: string;
  role?: "employee" | "company_admin";
}) {
  const { data: userData } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("company_invites" as never)
    .insert({
      company_id: params.companyId,
      email: params.email.trim().toLowerCase(),
      role: params.role ?? "employee",
      invited_by: userData.user?.id ?? null,
    } as never)
    .select("id, token, expires_at")
    .single();
  if (error) throw error;
  return data as { id: string; token: string; expires_at: string };
}

export async function logAdminDataAccess(
  action: string,
  targetUserId: string,
  meta: Record<string, unknown> = {},
) {
  try {
    await supabase.rpc("log_admin_data_access" as never, {
      p_action: action,
      p_target_user_id: targetUserId,
      p_meta: meta,
    } as never);
  } catch {
    /* non-blocking */
  }
}

export async function fetchEmployerConsent(userId: string) {
  const { data, error } = await supabase
    .from("employer_data_consent" as never)
    .select("*")
    .eq("user_id", userId)
    .is("revoked_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as {
    id: string;
    accepted_at: string | null;
    consent_version: string;
  } | null;
}

export async function setEmployerConsent(params: {
  userId: string;
  companyId: string | null;
  accept: boolean;
}) {
  if (params.accept) {
    const { error } = await supabase.from("employer_data_consent" as never).upsert(
      {
        user_id: params.userId,
        company_id: params.companyId,
        consent_version: "1",
        accepted_at: new Date().toISOString(),
        revoked_at: null,
      } as never,
      { onConflict: "user_id,consent_version" } as never,
    );
    if (error) throw error;
    return;
  }
  const { error } = await supabase
    .from("employer_data_consent" as never)
    .update({ revoked_at: new Date().toISOString() } as never)
    .eq("user_id", params.userId)
    .eq("consent_version", "1");
  if (error) throw error;
}
