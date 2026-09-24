import { describe, expect, it } from "vitest";
import { createIntroReducer, INITIAL_INTRO_STATE, type IntroAction, type IntroState } from "./useIntroMachine";

const reduce = createIntroReducer(2);
const run = (actions: IntroAction[], from: IntroState = INITIAL_INTRO_STATE) =>
  actions.reduce(reduce, from);

describe("introReducer", () => {
  it("walks a chapter through title, interaction and narration", () => {
    expect(run([{ type: "ENTER" }])).toEqual({ phase: "chapterTitle", chapterIndex: 0 });
    expect(run([{ type: "ENTER" }, { type: "TITLE_DONE" }]).phase).toBe("interact");
    expect(run([{ type: "ENTER" }, { type: "TITLE_DONE" }, { type: "INTERACT_DONE" }]).phase).toBe("narrate");
    expect(
      run([{ type: "ENTER" }, { type: "TITLE_DONE" }, { type: "INTERACT_DONE" }, { type: "NARRATE_DONE" }]),
    ).toEqual({ phase: "chapterTitle", chapterIndex: 1 });
  });

  it("ends after the last chapter", () => {
    expect(run([{ type: "NARRATE_DONE" }], { phase: "narrate", chapterIndex: 1 }).phase).toBe("end");
    expect(run([{ type: "SKIP_CHAPTER" }], { phase: "interact", chapterIndex: 1 }).phase).toBe("end");
  });

  it("ignores out-of-phase actions", () => {
    expect(run([{ type: "INTERACT_DONE" }])).toEqual(INITIAL_INTRO_STATE);
    expect(run([{ type: "SKIP_CHAPTER" }])).toEqual(INITIAL_INTRO_STATE);
    const state: IntroState = { phase: "interact", chapterIndex: 0 };
    expect(run([{ type: "TITLE_DONE" }], state)).toBe(state);
  });

  it("restarts from the entry screen", () => {
    expect(run([{ type: "RESTART" }], { phase: "end", chapterIndex: 1 })).toEqual(INITIAL_INTRO_STATE);
  });
});
