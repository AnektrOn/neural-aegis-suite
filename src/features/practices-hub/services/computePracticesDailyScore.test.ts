import { describe, expect, it } from "vitest";
import { computePracticesDailyScore } from "./computePracticesDailyScore";

describe("computePracticesDailyScore", () => {
  it("habits only when no deck and no swipe", () => {
    expect(
      computePracticesDailyScore({
        habitsDone: 2,
        habitsTotal: 4,
        deckCardCount: 0,
        pulseSwipedToday: false,
      }),
    ).toEqual({ done: 2, total: 4, hasItems: true });
  });

  it("adds pulse denominator when deck has cards but no swipe yet", () => {
    expect(
      computePracticesDailyScore({
        habitsDone: 2,
        habitsTotal: 4,
        deckCardCount: 3,
        pulseSwipedToday: false,
      }),
    ).toEqual({ done: 2, total: 5, hasItems: true });
  });

  it("counts pulse in numerator and denominator after swipe with cards remaining", () => {
    expect(
      computePracticesDailyScore({
        habitsDone: 2,
        habitsTotal: 4,
        deckCardCount: 10,
        pulseSwipedToday: true,
      }),
    ).toEqual({ done: 3, total: 5, hasItems: true });
  });

  it("keeps pulse slot when deck exhausted but swipe happened today", () => {
    expect(
      computePracticesDailyScore({
        habitsDone: 2,
        habitsTotal: 4,
        deckCardCount: 0,
        pulseSwipedToday: true,
      }),
    ).toEqual({ done: 3, total: 5, hasItems: true });
  });

  it("excludes pulse when deck empty and no swipe today", () => {
    expect(
      computePracticesDailyScore({
        habitsDone: 0,
        habitsTotal: 0,
        deckCardCount: 0,
        pulseSwipedToday: false,
      }),
    ).toEqual({ done: 0, total: 0, hasItems: false });
  });
});
