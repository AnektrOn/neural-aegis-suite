// deno-lint-ignore no-explicit-any
type Admin = any;

export async function userIsPlatformAdmin(admin: Admin, userId: string): Promise<boolean> {
  const { data: roles, error } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .in("role", ["admin", "superadmin"]);
  return !error && (roles?.length ?? 0) > 0;
}