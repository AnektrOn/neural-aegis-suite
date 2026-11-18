import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const sql = readFileSync("drizzle/migrations/0012_daily_voice_prompts_and_feedbacks.sql", "utf8");

describe("daily voice schema", () => {
  it("stores distinct batches per member, date and time", () => {
    expect(sql).toMatch(/UNIQUE\(user_id, date, batch_time\)/);
  });
  it("scopes prompt reads to the caller and excludes guests", () => {
    expect(sql).toMatch(/FOR SELECT TO authenticated\s+USING \(auth.uid\(\) = user_id AND \(auth.jwt\(\) ->> 'is_anonymous'\)::boolean IS NOT TRUE\)/);
    expect(sql).toContain("GRANT SELECT ON public.daily_voice_prompts TO authenticated");
    expect(sql).not.toMatch(/GRANT (?:ALL|INSERT|UPDATE|DELETE).*daily_voice_prompts TO authenticated/);
  });
  it("scopes feedback writes and reads to non-guest owners", () => {
    expect(sql).toMatch(/WITH CHECK \(auth.uid\(\) = user_id AND \(auth.jwt\(\) ->> 'is_anonymous'\)::boolean IS NOT TRUE\)/);
    expect(sql).toContain("GRANT SELECT, INSERT, UPDATE, DELETE ON public.voice_session_feedbacks TO authenticated");
  });
});