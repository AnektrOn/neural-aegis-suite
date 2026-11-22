import { readFileSync } from "node:fs";
import ts from "typescript";
import { describe, expect, it, vi } from "vitest";
import { resolveCallerRoles } from "../../supabase/functions/_shared/b2b-roles";

// Exercise the deployed handler's authorization with a mocked Cloud client.
const source = readFileSync("supabase/functions/admin-subscription/index.ts", "utf8");
const code = ts.transpileModule(source.replace(/^import .*;\r?\n/gm, ""), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
}).outputText;

async function requestAs(roles: string[], action = "list", authenticated = true) {
  let handler: ((req: Request) => Promise<Response>) | undefined;
  const subscriptionReads = vi.fn();
  const client = {
    auth: { getUser: vi.fn(async () => ({ data: { user: authenticated ? { id: "caller" } : null } })) },
    from: vi.fn((table: string) => {
      const data = table === "user_roles" ? roles.map(role => ({ role }))
        : table === "company_memberships" ? []
        : [{ id: "subscription-1", status: "active", product_id: "solo" }];
      if (table === "subscriptions") subscriptionReads();
      const query = {
        select: () => query,
        eq: () => query,
        order: async () => ({ data }),
        then: (resolve: (value: { data: typeof data }) => unknown) => Promise.resolve({ data }).then(resolve),
      };
      return query;
    }),
  };
  new Function("Deno", "createClient", "resolveCallerRoles", "Stripe", code)(
    { env: { get: () => "test-only" }, serve: (callback: typeof handler) => { handler = callback; } },
    () => client, resolveCallerRoles, vi.fn(),
  );
  if (!handler) throw new Error("Handler was not registered");
  const response = await handler(new Request("https://example.test/admin-subscription", {
    method: "POST", headers: { Authorization: "Bearer test-only", "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: "target", action, status: "active" }),
  }));
  return { response, subscriptionReads };
}

describe("admin-subscription server authorization", () => {
  it("allows superadmins to read subscriptions", async () => {
    const { response } = await requestAs(["superadmin"]);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ subscriptions: [{ id: "subscription-1", status: "active", product_id: "solo" }] });
  });

  it("preserves legacy admin access even with multiple roles", async () => {
    const { response } = await requestAs(["admin", "user"]);
    expect(response.status).toBe(200);
  });

  it.each(["list", "set_status", "cancel", "cancel_now"])("denies company admins for %s before accessing billing data", async action => {
    const { response, subscriptionReads } = await requestAs(["company_admin"], action);
    expect(response.status).toBe(403);
    expect(subscriptionReads).not.toHaveBeenCalled();
  });

  it("denies ordinary members before accessing billing data", async () => {
    const { response, subscriptionReads } = await requestAs(["user"]);
    expect(response.status).toBe(403);
    expect(subscriptionReads).not.toHaveBeenCalled();
  });

  it("rejects invalid sessions before accessing billing data", async () => {
    const { response, subscriptionReads } = await requestAs(["superadmin"], "list", false);
    expect(response.status).toBe(401);
    expect(subscriptionReads).not.toHaveBeenCalled();
  });
});