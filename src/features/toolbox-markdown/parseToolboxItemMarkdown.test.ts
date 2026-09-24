import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseToolboxItemMarkdown, pickToolboxItemCopy } from "./parseToolboxItemMarkdown";

const fixture = readFileSync(
  resolve(process.cwd(), "src/features/toolbox-markdown/fixtures/stop-protocol-premeditated-silence.md"),
  "utf8",
);

describe("parseToolboxItemMarkdown", () => {
  it("extrait le frontmatter et les sections Instructions / Steps (template IA)", () => {
    const item = parseToolboxItemMarkdown(fixture, { source: "fixture.md" });

    expect(item.external_key).toBe("toolbox_regulation_desamorcer_intellectualisation");
    expect(item.content_type).toBe("stop_protocol");
    expect(item.is_active).toBe(true);
    expect(item.duration).toBe("2 MIN");
    expect(item.category).toBe("regulation");
    expect(item.priority).toBe("P1");
    expect(item.archetype_targets).toEqual(["sage", "sovereign"]);
    expect(item.shadow_targets).toEqual(["victim"]);
    expect(item.title.fr).toBe("Le Silence Prémédité");
    expect(item.distribution.mode).toBe("individual");
    expect(item.distribution.user_id).toBe("a6060c76-1ecc-4df8-abd0-5e49a1b46316");
    expect(item.config.duration_sec).toBe(120);

    expect(item.instructionsFr).toContain("POURQUOI");
    expect(item.instructionsEn).toContain("WHY");
    expect(item.stepsFr).toHaveLength(4);
    expect(item.stepsFr[0]).toContain("Arrêt de Transmission");
    expect(item.stepsEn[3]).toContain("Somatic Integration");
  });

  it("pickToolboxItemCopy respecte la locale", () => {
    const item = parseToolboxItemMarkdown(fixture);
    const fr = pickToolboxItemCopy(item, "fr");
    const en = pickToolboxItemCopy(item, "en");
    expect(fr.title).toBe("Le Silence Prémédité");
    expect(en.title).toBe("Premeditated Silence");
    expect(fr.steps[0]).toContain("Transmission");
    expect(en.steps[0]).toContain("Transmission Halt");
  });
});
