import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defaultUserMenuPrefs, USER_MENU_PREFS_STORAGE_KEY } from "@/lib/userMenuPreferences";

const db = vi.hoisted(() => ({
  user: { id: "member-id" },
  row: { mobile_radial_menu: { v: 2, dock: ["home", "mood", "decisions", "habits"], overflow: ["journal"], hidden: [] }, sidebar_items: ["/dashboard"] } as Record<string, unknown>,
  error: null as { message: string } | null,
}));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: db.user }) }));
vi.mock("@/hooks/use-admin", () => ({ useAdmin: () => ({ isAdmin: false, loading: false }) }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: () => {
    let patch: Record<string, unknown> | undefined;
    const chain = {
      select: () => chain,
      eq: () => chain,
      maybeSingle: async () => ({ data: db.row, error: null }),
      update: (value: Record<string, unknown>) => { patch = value; return chain; },
      single: async () => {
        if (db.error) return { data: null, error: db.error };
        db.row = { ...db.row, ...patch };
        return { data: { id: "member-id" }, error: null };
      },
    };
    return chain;
  } },
}));
import { useUserMenuPrefs } from "@/hooks/useUserMenuPrefs";

describe("menu persistence", () => {
  beforeEach(() => {
    localStorage.clear();
    db.error = null;
    db.row = { mobile_radial_menu: { ...defaultUserMenuPrefs(), hidden: ["journal"] }, sidebar_items: ["/dashboard"] };
  });
  afterEach(cleanup);

  it("saves a restored journal and keeps it visible when preferences reload", async () => {
    const { result } = renderHook(() => useUserMenuPrefs());
    await waitFor(() => expect(result.current.prefs.hidden).toContain("journal"));
    await act(async () => { await result.current.savePrefs({ ...result.current.prefs, hidden: [] }); });
    await act(async () => { await result.current.reload(); });
    expect(result.current.prefs.hidden).not.toContain("journal");
    expect(db.row.sidebar_items).toEqual(["/dashboard"]);
  });

  it("rejects a failed save without changing preferences or the cache", async () => {
    const { result } = renderHook(() => useUserMenuPrefs());
    await waitFor(() => expect(result.current.prefs.hidden).toContain("journal"));
    const cached = localStorage.getItem(USER_MENU_PREFS_STORAGE_KEY);
    db.error = { message: "save denied" };
    await act(async () => {
      await expect(result.current.savePrefs({ ...result.current.prefs, hidden: [] })).rejects.toEqual(db.error);
    });
    expect(result.current.prefs.hidden).toContain("journal");
    expect(localStorage.getItem(USER_MENU_PREFS_STORAGE_KEY)).toBe(cached);
  });
});