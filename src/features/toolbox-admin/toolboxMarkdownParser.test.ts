import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  parseToolboxMarkdownBatch,
  splitToolboxMarkdownFile,
} from "./toolboxMarkdownParser";

const batchTemplate = readFileSync(
  resolve(process.cwd(), "content/toolbox/_templates/toolbox-batch-template.md"),
  "utf8",
);

describe("toolboxMarkdownParser batch", () => {
  it("splits batch template into 10 items", () => {
    const chunks = splitToolboxMarkdownFile(batchTemplate, "batch-01.md");
    expect(chunks).toHaveLength(10);
  });

  it("parses all 10 items from one batch file", () => {
    const result = parseToolboxMarkdownBatch([
      { name: "batch-01.md", content: batchTemplate },
    ]);
    expect(result.total).toBe(10);
    expect(result.valid).toBe(10);
    expect(result.errors).toHaveLength(0);
    expect(result.payload.toolbox_items).toHaveLength(10);
    expect(result.importIssues).toEqual([]);
  });

  it("parses Petter Gryding individual batch without import blockers", () => {
    const petter = readFileSync(
      resolve(process.cwd(), "src/features/toolbox-admin/fixtures/petter-gryding-batch.md"),
      "utf8",
    );
    const result = parseToolboxMarkdownBatch([
      { name: "petter-gryding.md", content: petter },
    ]);
    expect(result.total).toBe(5);
    expect(result.valid).toBe(5);
    expect(result.errors).toEqual([]);
    expect(result.importIssues).toEqual([]);
    expect(result.items.every((i) => i.distribution.mode === "individual")).toBe(true);
    expect(result.items.every((i) => i.distribution.user_id)).toBeTruthy();
  });
});
