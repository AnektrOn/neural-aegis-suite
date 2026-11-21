// Server-to-server authentication: service role bearer or the private database-held internal secret.
// deno-lint-ignore no-explicit-any
export async function isInternalRequest(req: Request, admin: any): Promise<boolean> {
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const auth = req.headers.get("Authorization") || "";
  if (serviceKey && auth === `Bearer ${serviceKey}`) return true;
  const supplied = req.headers.get("x-internal-secret") || "";
  if (!supplied) return false;
  const { data, error } = await admin.rpc("check_internal_secret", { p_secret: supplied });
  return !error && data === true;
}

// deno-lint-ignore no-explicit-any
export async function getCallerRoles(req: Request, admin: any): Promise<{ userId: string | null; email: string | null; isOperator: boolean; isAnonymous: boolean }> {
  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return { userId: null, email: null, isOperator: false, isAnonymous: false };
  const { data } = await admin.auth.getUser(token);
  const user = data?.user;
  if (!user) return { userId: null, email: null, isOperator: false, isAnonymous: false };
  const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", user.id).in("role", ["admin", "superadmin"]);
  return { userId: user.id, email: user.email ?? null, isOperator: !!roles?.length, isAnonymous: !!user.is_anonymous };
}
