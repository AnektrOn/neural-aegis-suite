import { describe, expect, it } from "vitest";
import {
  isUnderHighRes,
  isUnderMyss,
  previewCartographyFolder,
  resolveModeFromImportPath,
} from "./cartography-folder-import";

describe("cartography-folder-import", () => {
  it("analysis/Myss → analyse, high-res/Myss → clinique", () => {
    const a = "analysis/Myss/2026-05/⚖️ BALANCE/P01·ARC·note.md";
    expect(isUnderMyss(a)).toBe(true);
    expect(isUnderHighRes(a)).toBe(false);
    expect(resolveModeFromImportPath(a)).toBe("analyse");

    const c = "high-res/Myss/2026-05/⚖️ BALANCE/P01·RES·note.md";
    expect(isUnderMyss(c)).toBe(true);
    expect(isUnderHighRes(c)).toBe(true);
    expect(resolveModeFromImportPath(c)).toBe("clinique");
  });

  it("03_HIGH_RES_ANALYSIS/Myss → clinique", () => {
    const path = "03_HIGH_RES_ANALYSIS/Myss/2026-05/⚖️ BALANCE/P01·ARC·BALANCE.md";
    expect(isUnderHighRes(path)).toBe(true);
    expect(isUnderMyss(path)).toBe(true);
    expect(resolveModeFromImportPath(path)).toBe("clinique");
  });

  it("HIGH_RES_ANALYSIS/Myss also works", () => {
    const path = "HIGH_RES_ANALYSIS/Myss/2026-05/⚖️ BALANCE/P01·RES·note.md";
    expect(isUnderHighRes(path)).toBe(true);
    expect(resolveModeFromImportPath(path)).toBe("clinique");
  });

  it("explicit default mode overrides path detection", () => {
    const path = "analysis/Myss/2026-05/⚖️ BALANCE/P01·ARC·note.md";
    expect(resolveModeFromImportPath(path, { mode: "clinique" })).toBe("clinique");
    expect(resolveModeFromImportPath(path, { mode: "analyse" })).toBe("analyse");
  });

  it("auto-detects real structure: analysis + 03_HIGH_RES_ANALYSIS", () => {
    const preview = previewCartographyFolder([
      {
        path: "analysis/Myss/2026-05/⚖️ BALANCE/00-Cartographie_Integrale·BALANCE.md",
        content: "# Carto\n### ♈ Maison 1 — Test\n- **SHADOW :** s\n- **LIGHT :** l\n- **BALANCE :** b",
      },
      {
        path: "03_HIGH_RES_ANALYSIS/Myss/2026-05/⚖️ BALANCE/P01·ARC·BALANCE.md",
        content: "# P01 clinique\n## Section 1\nTexte.",
      },
      {
        path: "03_HIGH_RES_ANALYSIS/Myss/2026-05/⚖️ BALANCE/PromptNotebookLM/PROMPT-VIDEO-OVERVIEW.md",
        content: "# skipped",
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

  it("Myss folder forced as clinique via explicit mode selector", () => {
    const preview = previewCartographyFolder(
      [
        {
          path: "Myss/2026-05/⚖️ BALANCE/P01·ARC·note·BALANCE.md",
          content: "# P01 report\n## Section\nText.",
        },
        {
          path: "Myss/2026-05/🌑 SHADOW/P02·SHD·note·SHADOW.md",
          content: "# P02 report\n## Section\nText.",
        },
      ],
      { mode: "clinique" },
    );

    expect(preview.files).toHaveLength(2);
    expect(preview.files.every((f) => f.mode === "clinique")).toBe(true);
    expect(preview.bundleKeys).toContain("balance-clinique");
    expect(preview.bundleKeys).toContain("shadow-clinique");
  });

  it("any folder with pole subfolders works when mode is explicit", () => {
    const preview = previewCartographyFolder(
      [
        {
          path: "MonDossier/⚖️ BALANCE/rapport.md",
          content: "# Rapport\n## Section\nTexte.",
        },
      ],
      { mode: "clinique" },
    );

    expect(preview.files).toHaveLength(1);
    expect(preview.files[0].mode).toBe("clinique");
    expect(preview.files[0].pole).toBe("balance");
  });

  it("sanitizes markdown at import (no frontmatter in stored content)", () => {
    const preview = previewCartographyFolder([
      {
        path: "analysis/Myss/2026-05/⚖️ BALANCE/00-Cartographie_Integrale·BALANCE.md",
        content: `id: 00-Cartographie
type: INTEGRAL_CARTOGRAPHY·T3
pole: BALANCE

# Cartographie

Corps du rapport.`,
      },
    ]);

    expect(preview.files).toHaveLength(1);
    expect(preview.files[0].markdown).not.toMatch(/^id:/m);
    expect(preview.files[0].markdown).not.toMatch(/^type:/m);
    expect(preview.files[0].markdown).toContain("Corps du rapport");
  });

  it("skips NotebookLM prompt files anywhere in path", () => {
    const preview = previewCartographyFolder([
      {
        path: "analysis/Myss/2026-05/⚖️ BALANCE/00-Cartographie.md",
        content: "# OK",
      },
      {
        path: "analysis/Myss/2026-05/⚖️ BALANCE/NotebookLM/notes.md",
        content: "# skip",
      },
      {
        path: "analysis/Myss/2026-05/⚖️ BALANCE/PROMPT-VIDEO-OVERVIEW.md",
        content: "# skip",
      },
    ]);

    expect(preview.files).toHaveLength(1);
    expect(preview.files[0].markdown).toBe("# OK");
  });
});
