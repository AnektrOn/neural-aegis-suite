import { describe, expect, it } from "vitest";
import { EXPORT_ROOT, USER_EXPORT_TABLES, readAllRows, categoryForTable } from "../../supabase/functions/export-to-drive/full-export";

describe("complete user Drive exports", () => {
  it("uses the user's requested Drive root", () => {
    expect(EXPORT_ROOT).toBe("1dVrAm_xlKF9pt5WX-7yomm63JpiZyi75");
  });
  it("includes Maisons responses alongside both other questionnaires and reports", () => {
    expect(USER_EXPORT_TABLES).toContain("houses72_responses");
    expect(USER_EXPORT_TABLES).toContain("assessment_responses");
    expect(USER_EXPORT_TABLES).toContain("deepdive_responses");
    expect(USER_EXPORT_TABLES).toContain("user_reports");
  });
  it("does not silently truncate a user's data", async () => {
    const source = Array.from({ length: 1123 }, (_, id) => ({ id }));
    const rows = await readAllRows(async (from, to) => ({ data: source.slice(from, to + 1), error: null }));
    expect(rows).toHaveLength(1123);
    expect(rows.at(-1)).toEqual({ id: 1122 });
  });
  it("fails rather than declaring an incomplete export successful", async () => {
    await expect(readAllRows(async () => ({ data: null, error: { message: "unavailable" } }))).rejects.toThrow("unavailable");
  });
  it("routes each table into its per-user category folder", () => {
    expect(categoryForTable("houses72_responses")).toBe("Quizz");
    expect(categoryForTable("mood_entries")).toBe("Mood");
    expect(categoryForTable("decisions")).toBe("Decisions");
    expect(categoryForTable("habit_completions")).toBe("Habits");
    expect(categoryForTable("toolbox_completions")).toBe("Toolbox");
    expect(categoryForTable("journal_entries")).toBe("Journal");
    expect(categoryForTable("people_contacts")).toBe("People");
    expect(categoryForTable("user_reports")).toBe("Rapport");
  });
});
