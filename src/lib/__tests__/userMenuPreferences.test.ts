import { describe, expect, it } from "vitest";
import {
  defaultUserMenuPrefs,
  migrateLegacyRadialArray,
  normalizeUserMenuPrefs,
} from "@/lib/userMenuPreferences";
import { getMenuPanel } from "@/lib/userMenuCatalog";

describe("userMenuPreferences", () => {
  it("defaults dock to daily panels with home on /dashboard", () => {
    const prefs = defaultUserMenuPrefs();
    expect(prefs.dock).toHaveLength(4);
    expect(getMenuPanel(prefs.dock[0]).to).toBe("/dashboard");
  });

  it("migrates legacy radial array and drops meditation", () => {
    const prefs = migrateLegacyRadialArray([
      "persona",
      "meditation",
      "home",
      "mood",
    ]);
    expect(prefs.v).toBe(2);
    expect(prefs.dock[0]).toBe("home");
    expect(getMenuPanel("home").to).toBe("/dashboard");
    expect(prefs.overflow).toContain("persona");
    expect(prefs.overflow).not.toContain("meditation" as never);
  });

  it("normalizes v2 payload", () => {
    const prefs = normalizeUserMenuPrefs({
      v: 2,
      dock: ["home", "mood", "decisions", "habits"],
      overflow: ["persona"],
      hidden: ["journal"],
    });
    expect(prefs.hidden).toEqual(["journal"]);
  });
});
