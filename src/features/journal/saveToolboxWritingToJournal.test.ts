import { describe, expect, it } from "vitest";
import {
  engineTagForToolboxSlug,
  formatLabeledJournalContent,
  moodScoreFromGauge,
} from "./saveToolboxWritingToJournal";

describe("saveToolboxWritingToJournal helpers", () => {
  it("formats labeled sections and drops empties", () => {
    expect(
      formatLabeledJournalContent([
        { label: "Moi", body: "fatigué" },
        { label: "Autre", body: "  " },
        { label: "Pont", body: "demander une pause" },
      ]),
    ).toBe("## Moi\nfatigué\n\n## Pont\ndemander une pause");
  });

  it("maps slugs to engines", () => {
    expect(engineTagForToolboxSlug("gratitude")).toBe("savor");
    expect(engineTagForToolboxSlug("journal_stream")).toBe("stream");
    expect(engineTagForToolboxSlug("dialogue_parts")).toBe("voices");
  });

  it("maps gauge 0–10 to mood 1–5", () => {
    expect(moodScoreFromGauge(0)).toBe(1);
    expect(moodScoreFromGauge(5)).toBe(3);
    expect(moodScoreFromGauge(10)).toBe(5);
  });
});
