import { describe, expect, it } from "vitest";
import {
  isUnderHighResAnalysis,
  isUnderMyss,
  previewCartographyFolder,
  resolveModeFromImportPath,
} from "./cartography-folder-import";

describe("cartography-folder-import HIGH_RES_ANALYSIS", () => {
  it("detects HIGH_RES_ANALYSIS path as clinique", () => {
    const path = "HIGH_RES_ANALYSIS/2026-05/⚖️ BALANCE/P01·RES·note.md";
    expect(isUnderHighResAnalysis(path)).toBe(true);
    expect(isUnderMyss(path)).toBe(false);
    expect(resolveModeFromImportPath(path)).toBe("clinique");
  });

  it("imports Myss and HIGH_RES in one zip", () => {
    const preview = previewCartographyFolder([
      {
        path: "Myss/2026-05/⚖️ BALANCE/00-Cartographie_Integrale·BALANCE.md",
        content: "# Carto\n### ♈ Maison 1 — Test\n- **SHADOW :** s\n- **LIGHT :** l\n- **BALANCE :** b",
      },
      {
        path: "HIGH_RES_ANALYSIS/2026-05/⚖️ BALANCE/P01·RES·note.md",
        content: "# P01 clinique\n## Section 1\nTexte.",
      },
      {
        path: "Echols/2026-05/⚖️ BALANCE/P01·RES·Echols·note.md",
        content: "# ignored",
      },
    ]);

    expect(preview.myssLayout).toBe(true);
    expect(preview.highResLayout).toBe(true);
    expect(preview.files).toHaveLength(2);
    expect(preview.files.find((f) => f.mode === "analyse")?.pole).toBe("balance");
    expect(preview.files.find((f) => f.mode === "clinique")?.reportCode).toBe("p01");
    expect(preview.bundleKeys).toContain("balance-analyse");
    expect(preview.bundleKeys).toContain("balance-clinique");
  });

  it("classifies P01·RES·Echols as detailed clinique", () => {
    const preview = previewCartographyFolder([
      {
        path: "HIGH_RES_ANALYSIS/2026-05/🌑 SHADOW/P01·RES·Echols·note·T3.md",
        content: "# Rapport\n## I. Intro\nParagraphe.",
      },
    ]);

    expect(preview.files[0].mode).toBe("clinique");
    expect(preview.files[0].pole).toBe("shadow");
    expect(preview.files[0].sectionKey).toBe("detailed");
    expect(preview.files[0].reportCode).toBe("p01");
  });
});
