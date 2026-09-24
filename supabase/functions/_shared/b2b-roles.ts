/** Shared admin/role helpers for Supabase edge functions. */

export type RoleCheck = {
  isSuperAdmin: boolean;
  isCompanyAdmin: boolean;
  isPlatformOperator: boolean;
  companyIds: string[];
};

export async function resolveCallerRoles(
  // deno-lint-ignore no-explicit-any
  adminClient: any,
  callerId: string,
): Promise<RoleCheck> {
  const { data: roles } = await adminClient
    .from("user_roles")
    .select("role")
    .eq("user_id", callerId);

  const roleSet = new Set(
    ((roles as { role: string }[] | null) ?? []).map((r) => r.role),
  );
  const isSuperAdmin = roleSet.has("superadmin") || roleSet.has("admin");

  const { data: memberships } = await adminClient
    .from("company_memberships")
    .select("company_id, role")
    .eq("user_id", callerId)
    .eq("role", "company_admin");

  const companyIds = ((memberships as { company_id: string }[] | null) ?? []).map(
    (m) => m.company_id,
  );
  const isCompanyAdmin = !isSuperAdmin && (roleSet.has("company_admin") || companyIds.length > 0);

  return {
    isSuperAdmin,
    isCompanyAdmin,
    isPlatformOperator: isSuperAdmin || isCompanyAdmin,
    companyIds,
  };
}

export async function assertCanActOnUser(
  // deno-lint-ignore no-explicit-any
  adminClient: any,
  callerId: string,
  targetUserId: string,
  opts: { requireSuperAdmin?: boolean } = {},
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const roles = await resolveCallerRoles(adminClient, callerId);
  if (opts.requireSuperAdmin) {
    if (!roles.isSuperAdmin) return { ok: false, status: 403, error: "Forbidden" };
    return { ok: true };
  }
  if (roles.isSuperAdmin) return { ok: true };
  if (!roles.isCompanyAdmin) return { ok: false, status: 403, error: "Forbidden" };

  const { data: target } = await adminClient
    .from("profiles")
    .select("company_id")
    .eq("id", targetUserId)
    .maybeSingle();

  const companyId = (target as { company_id: string | null } | null)?.company_id;
  if (!companyId || !roles.companyIds.includes(companyId)) {
    return { ok: false, status: 403, error: "Forbidden: outside company scope" };
  }
  return { ok: true };
}
