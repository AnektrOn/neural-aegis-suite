import { describe, expect, it } from "vitest";
import {
  normalizeReportToMarkdown,
  repairCollapsedTables,
} from "./normalizeReportMarkdown";

const SAMPLE_REPORT = `Technical Masterclass Report: Active and Passive Vibrational Engineering
Session Date:  September 2, 2026  Subject:  Advanced Healing Protocols and Informational Anchoring  Status:  Clinical Documentation / Tier 2 Implementation
1. Introduction: The Paradigm Shift to Wave-Body Medicine
The evolution of clinical intervention marks a strategic transition from fluidic, physical medicine to "Wave-Body" medicine.
Operational Definitions: Prana vs. Chi
To navigate the vibrational field, the practitioner must distinguish between primary energetic mediums:| Feature | Prana | Chi || ------ | ------ | ------ || Operational Nature | Static energy principle; informational carrier concentrated in atmospheric sunlight. | Kinetic and fluidic; biological energy. |
Synthesis of the Implicate Order
Matter is fundamentally viewed as "stored, folded information."
2. Meta-Analytical Framework: Laws of Vibrational Polarity
Strategic vibrational engineering requires strict adherence to the Laws of Polarity.
`;

describe("normalizeReportToMarkdown", () => {
  it("repairs collapsed Word tables", () => {
    const fixed = repairCollapsedTables(
      "| Feature | Prana | Chi || ------ | ------ | ------ || A | B | C |",
    );
    expect(fixed).toContain("| Feature | Prana | Chi |");
    expect(fixed).toContain("| ------ | ------ | ------ |");
    expect(fixed).toContain("| A | B | C |");
    expect(fixed.split("\n").length).toBeGreaterThanOrEqual(3);
  });

  it("structures a Technical Masterclass report into markdown", () => {
    const md = normalizeReportToMarkdown(SAMPLE_REPORT, "report");
    expect(md).toMatch(/^---/);
    expect(md).toContain('orientation: "REPORT"');
    expect(md).toContain("# Technical Masterclass Report:");
    expect(md).toContain("**Session Date:**");
    expect(md).toContain("**Subject:**");
    expect(md).toContain("**Status:**");
    expect(md).toContain("## 1. Introduction:");
    expect(md).toContain("## 2. Meta-Analytical Framework:");
    expect(md).toContain("### Operational Definitions: Prana vs. Chi");
    expect(md).toContain("### Synthesis of the Implicate Order");
    expect(md).toContain("| Feature | Prana | Chi |");
    expect(md).toContain("Wave-Body");
  });

  it("leaves Vault markdown mostly intact", () => {
    const vault = `---
titre: "DIAG"
user: "elena"
---

# Hello

### 🇫🇷 FR
Texte.
`;
    const md = normalizeReportToMarkdown(vault);
    expect(md).toContain('titre: "DIAG"');
    expect(md).toContain("### 🇫🇷 FR");
  });
});
