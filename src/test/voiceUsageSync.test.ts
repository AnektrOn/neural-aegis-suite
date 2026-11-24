import { describe, expect, it } from "vitest";
import { utcMonthUnixBounds } from "../../supabase/functions/elevenlabs-knowledge/voice-usage-sync";

describe("voiceUsageSync", () => {
  it("bounds UTC calendar month", () => {
    const { start, end } = utcMonthUnixBounds(new Date("2026-11-15T12:00:00.000Z"));
    expect(start).toBe(Math.floor(Date.UTC(2026, 10, 1) / 1000));
    expect(end).toBe(Math.floor(Date.UTC(2026, 11, 1) / 1000));
  });
});