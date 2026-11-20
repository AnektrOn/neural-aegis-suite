import { describe, expect, it } from "vitest";
import { resolvePublicClientEnv } from "../../scripts/publicClientEnv";

describe("public deployment connection settings", () => {
  it("provides usable public settings when the deploy has no environment", () => {
    const env = resolvePublicClientEnv({});
    expect(new URL(env.VITE_SUPABASE_URL).protocol).toBe("https:");
    expect(env.VITE_SUPABASE_PUBLISHABLE_KEY.length).toBeGreaterThan(100);
    const claims = JSON.parse(atob(env.VITE_SUPABASE_PUBLISHABLE_KEY.split(".")[1]));
    expect(claims.role).toBe("anon");
  });
  it("keeps explicitly configured deployment values authoritative", () => {
    expect(resolvePublicClientEnv({ VITE_SUPABASE_URL: "https://example.test", VITE_SUPABASE_PUBLISHABLE_KEY: "public-test" })).toEqual({ VITE_SUPABASE_URL: "https://example.test", VITE_SUPABASE_PUBLISHABLE_KEY: "public-test" });
  });
});