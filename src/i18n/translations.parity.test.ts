import { describe, expect, it } from "vitest";
import { translations, type TranslationKey } from "./translations";

describe("translations EN/FR parity", () => {
  it("every key has non-empty fr and en", () => {
    const missing: string[] = [];
    for (const [key, val] of Object.entries(translations)) {
      if (!val.fr?.trim() || !val.en?.trim()) {
        missing.push(key);
      }
    }
    expect(missing, missing.join(", ")).toEqual([]);
  });

  it("people.tf period keys exist for neural map", () => {
    const periods: TranslationKey[] = [
      "people.tf.1d",
      "people.tf.3d",
      "people.tf.7d",
      "people.tf.14d",
      "people.tf.1m",
      "people.tf.3m",
      "people.tf.6m",
      "people.tf.1y",
      "people.tf.all",
    ];
    for (const key of periods) {
      expect(translations[key]?.fr).toBeTruthy();
      expect(translations[key]?.en).toBeTruthy();
    }
  });
});
