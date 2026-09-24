import { beforeEach, describe, expect, it } from "vitest";
import { hasSeenIntro, markIntroSeen } from "./introSeen";

describe("introSeen", () => {
  beforeEach(() => localStorage.clear());

  it("is false until the intro is marked as seen", () => {
    expect(hasSeenIntro()).toBe(false);
    markIntroSeen();
    expect(hasSeenIntro()).toBe(true);
  });
});
