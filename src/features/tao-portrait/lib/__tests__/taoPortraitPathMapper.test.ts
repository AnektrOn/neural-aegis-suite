import { describe, expect, it } from "vitest";
import { collectMdPathsFromTreeJson, mapTaoPortraitPath } from "../taoPortraitPathMapper";

describe("mapTaoPortraitPath", () => {
  it("maps T2 synthesis at month root", () => {
    const r = mapTaoPortraitPath("2026-05/T2_Global_SyntheseWuXing.md");
    expect(r.mapping).toEqual({ pole: "transversal", partId: "T2_SYNTHESIS" });
  });

  it("maps wood pole parts with emoji folder", () => {
    expect(mapTaoPortraitPath("2026-05/🌲 BOIS/P01·DIA.md").mapping).toEqual({
      pole: "wood",
      partId: "P01_DIA",
    });
    expect(mapTaoPortraitPath("2026-05/🌲 BOIS/P05·SCL.md").mapping).toEqual({
      pole: "wood",
      partId: "P05_SCL",
    });
  });

  it("maps all five poles", () => {
    expect(mapTaoPortraitPath("x/⚔️ MÉTAL/P02·SIG.md").mapping?.pole).toBe("metal");
    expect(mapTaoPortraitPath("x/💧 EAU/P03·TIM.md").mapping?.pole).toBe("water");
    expect(mapTaoPortraitPath("x/🔥 FEU/P04·PRX.md").mapping?.pole).toBe("fire");
    expect(mapTaoPortraitPath("x/🪨 TERRE/P01·DIA.md").mapping?.pole).toBe("earth");
  });
});

describe("collectMdPathsFromTreeJson", () => {
  it("extracts md paths from tree -J sample", () => {
    const json = `[
      {"type":"directory","name":".","contents":[
        {"type":"directory","name":"2026-05","contents":[
          {"type":"file","name":"T2_Global_SyntheseWuXing.md"},
          {"type":"directory","name":"🌲 BOIS","contents":[
            {"type":"file","name":"P01·DIA.md"}
          ]}
        ]}
      ]}
    ]`;
    const paths = collectMdPathsFromTreeJson(json);
    expect(paths).toContain("2026-05/T2_Global_SyntheseWuXing.md");
    expect(paths).toContain("2026-05/🌲 BOIS/P01·DIA.md");
  });
});
