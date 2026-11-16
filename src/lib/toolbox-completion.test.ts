import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  row: null as Record<string, unknown> | null,
  completedCount: 0,
  patches: [] as Record<string, unknown>[],
  error: null as { message: string } | null,
  rpc: vi.fn(),
}));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {
  rpc: db.rpc,
  from: () => {
    let patch: Record<string, unknown> | undefined;
    const filters: Record<string, unknown> = {};
    const chain = {
      select: () => chain,
      eq: (key: string, value: unknown) => { filters[key] = value; return chain; },
      update: (value: Record<string, unknown>) => { patch = value; db.patches.push(value); return chain; },
      maybeSingle: async () => {
        if (db.error) return { data: null, error: db.error };
        if (patch && (!db.row || Object.entries(filters).some(([k, v]) => db.row?.[k] !== v))) {
          return { data: null, error: null };
        }
        if (patch && db.row) db.row = { ...db.row, ...patch };
        return { data: db.row, error: null };
      },
      upsert: async (value: Record<string, unknown>) => {
        db.row = { id: "completion", ...value }; return { error: null };
      },
    };
    return chain;
  },
} }));
import { updateToolboxPostState, upsertToolboxCompletion } from "./toolbox-completion";

const assignment = { assignmentId: "assignment", userId: "member" };
describe("post-exercise feedback", () => {
  beforeEach(() => {
    db.row = null; db.completedCount = 0; db.error = null; db.patches = [];
    db.rpc.mockReset().mockImplementation(async (_name, args) => {
      if (args.p_status === "completed") db.completedCount += 1;
      return { error: null };
    });
  });
  it("keeps one completion and one admin count after two different feeling selections", async () => {
    await upsertToolboxCompletion({ ...assignment, status: "completed", payload: { elapsedSec: 90 } });
    const completedAt = db.row?.completed_at;
    await updateToolboxPostState({ ...assignment, postState: "tension_released" });
    await updateToolboxPostState({ ...assignment, postState: "clarity_restored" });
    expect(db.row?.completion_count).toBe(1);
    expect(db.completedCount).toBe(1);
    expect(db.row?.post_state).toBe("clarity_restored");
    expect(db.row?.completed_at).toBe(completedAt);
    expect(db.row?.elapsed_sec).toBe(90);
    expect(db.patches).toEqual([{ post_state: "tension_released" }, { post_state: "clarity_restored" }]);
  });
  it("counts a genuinely repeated exercise and clears its previous feeling", async () => {
    await upsertToolboxCompletion({ ...assignment, status: "completed" });
    await updateToolboxPostState({ ...assignment, postState: "still_in_resistance" });
    await upsertToolboxCompletion({ ...assignment, status: "completed" });
    expect(db.row?.completion_count).toBe(2);
    expect(db.completedCount).toBe(2);
    expect(db.row?.post_state).toBeNull();
  });
  it("does not create a completion for a missing or other user's assignment", async () => {
    expect((await updateToolboxPostState({ ...assignment, postState: "clarity_restored" })).error).toBe("completion_not_found");
    await upsertToolboxCompletion({ ...assignment, status: "completed" });
    expect((await updateToolboxPostState({ ...assignment, userId: "other", postState: "clarity_restored" })).error).toBe("completion_not_found");
    expect(db.row?.post_state).toBeNull();
    expect(db.completedCount).toBe(1);
  });
  it("returns a failed save without altering feedback or counters", async () => {
    await upsertToolboxCompletion({ ...assignment, status: "completed" });
    db.error = { message: "save denied" };
    expect((await updateToolboxPostState({ ...assignment, postState: "tension_released" })).error).toBe("save denied");
    expect(db.row?.post_state).toBeNull();
    expect(db.completedCount).toBe(1);
  });
});