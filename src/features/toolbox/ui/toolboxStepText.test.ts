import { describe, expect, it } from "vitest";
import { isLongToolboxCopy, parseToolboxStepBullet } from "./toolboxStepText";

describe("toolboxStepText", () => {
  it("parseToolboxStepBullet splits title and body on em dash", () => {
    const line =
      "1. La Sélection de la Cible — Identifie consciemment un domaine de faible enjeu.";
    expect(parseToolboxStepBullet(line)).toEqual({
      title: "La Sélection de la Cible",
      body: "Identifie consciemment un domaine de faible enjeu.",
    });
  });

  it("isLongToolboxCopy detects cognitive framework paragraphs", () => {
    const short = "Respire trois fois.";
    const long = "A".repeat(300);
    expect(isLongToolboxCopy(short)).toBe(false);
    expect(isLongToolboxCopy(long)).toBe(true);
  });
});
