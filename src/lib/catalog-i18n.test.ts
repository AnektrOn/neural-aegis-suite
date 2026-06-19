import { describe, expect, it } from "vitest";
import { pickCatalogTemplateDisplayTitle } from "@/lib/catalog-i18n";
import { pickWidgetCatalogCopy } from "@/lib/toolbox-widget-i18n";

describe("catalog-i18n — STOP sanctuary anchor", () => {
  const frTitle = "S.T.O.P. Profond : L'Ancrage du Sanctuaire (Respect de Soi)";
  const frDescription =
    "Protège ton Étincelle Divine en refusant de dissiper ton énergie pour calmer l'anxiété de l'autre.";

  it("resolves EN title when title_i18n.en duplicates FR (legacy import)", () => {
    const title = pickCatalogTemplateDisplayTitle("en", {
      title: frTitle,
      title_i18n: { fr: frTitle, en: frTitle },
    });
    expect(title).toBe("Deep S.T.O.P.: Sanctuary Anchoring (Self-Respect)");
  });

  it("resolves EN title with typographic apostrophe (Obsidian / import)", () => {
    const curly = "S.T.O.P. Profond : L\u2019Ancrage du Sanctuaire (Respect de Soi)";
    const title = pickCatalogTemplateDisplayTitle("en", {
      title: curly,
      title_i18n: { fr: curly, en: curly },
    });
    expect(title).toBe("Deep S.T.O.P.: Sanctuary Anchoring (Self-Respect)");
  });

  it("resolves EN description via lookupCatalogFrToEn", () => {
    const description = pickWidgetCatalogCopy("en", { fr: frDescription, en: frDescription }, frDescription);
    expect(description).toBe(
      "Protect your Divine Spark by refusing to dissipate your energy to soothe the other's anxiety.",
    );
  });
});
