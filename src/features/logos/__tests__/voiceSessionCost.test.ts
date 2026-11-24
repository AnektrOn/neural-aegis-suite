import { describe, expect, it } from "vitest";
import {
  estimateVoiceSessionCost,
  formatVoiceDuration,
  formatVoiceUsageLabel,
  LOGOS_VOICE_CREDITS_PER_SECOND,
} from "../voiceSessionCost";

describe("voiceSessionCost", () => {
  it("calibrates ~1489 credits at 180s", () => {
    const e = estimateVoiceSessionCost(180);
    expect(e.credits).toBeCloseTo(1489, 0);
    expect(LOGOS_VOICE_CREDITS_PER_SECOND).toBeCloseTo(1489 / 180, 5);
  });

  it("formats durations", () => {
    expect(formatVoiceDuration(65)).toBe("1:05");
    expect(formatVoiceDuration(3661)).toBe("1:01:01");
    expect(formatVoiceUsageLabel(900)).toBe("15 min");
    expect(formatVoiceUsageLabel(65)).toBe("1 min 5 s");
  });
});