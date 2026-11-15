import { describe, expect, it } from "vitest";
import {
  applyMemberOverflowBaseline,
  defaultUserMenuPrefs,
  MEMBER_OVERFLOW_BASELINE,
  migrateLegacyRadialArray,
  normalizeUserMenuPrefs,
  parseStoredMenuPrefs,
} from "@/lib/userMenuPreferences";
import { getMenuPanel } from "@/lib/userMenuCatalog";

describe("userMenuPreferences", () => {
  it("keeps a restored journal visible after a V2 save/reload despite old exclusions", () => {
    const restored = { ...defaultUserMenuPrefs(), hidden: [] };
    const reloaded = parseStoredMenuPrefs(JSON.parse(JSON.stringify(restored)), ["/dashboard"]);
    expect(reloaded.hidden).not.toContain("journal");
  });

  it("preserves explicitly hidden V2 panels", () => {
    expect(parseStoredMenuPrefs({ ...defaultUserMenuPrefs(), hidden: ["journal"] }, ["/journal"]).hidden)
      .toEqual(["journal"]);
  });

  it("migrates old journal exclusions without hiding newly introduced Dien Chan", () => {
    const migrated = parseStoredMenuPrefs(["home"], ["/dashboard"]);
    expect(migrated.hidden).toContain("journal");
    expect(migrated.hidden).not.toContain("dien_chan");
  });

  it("defaults dock to home · mood · decisions · people", () => {
    const prefs = defaultUserMenuPrefs();
    expect(prefs.dock).toEqual(["home", "mood", "decisions", "people"]);
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
      dock: ["home", "mood", "decisions", "people"],
      overflow: ["persona"],
      hidden: ["journal"],
    });
    expect(prefs.hidden).toEqual(["journal"]);
  });

  it("defaults radial overflow without pratiques/toolbox hubs", () => {
    expect(defaultUserMenuPrefs().overflow).toEqual([
      "capture_hub",
      "portrait_hub",
      "messages_hub",
      "journal",
      "habits",
      "profile",
      "settings",
    ]);
    expect(defaultUserMenuPrefs().overflowBaseline).toBe(MEMBER_OVERFLOW_BASELINE);
  });

  it("rewrites saved member dock + overflow to the baseline once", () => {
    const saved = normalizeUserMenuPrefs({
      v: 2,
      dock: ["home", "mood", "decisions", "habits"],
      overflow: ["journal", "toolbox", "pulse", "bibliotheque"],
      hidden: [],
    });
    const { prefs, migrated } = applyMemberOverflowBaseline(saved, false);
    expect(migrated).toBe(true);
    expect(prefs.dock).toEqual(["home", "mood", "decisions", "people"]);
    expect(prefs.overflow).toEqual([
      "capture_hub",
      "portrait_hub",
      "messages_hub",
      "journal",
      "habits",
      "profile",
      "settings",
    ]);
    expect(prefs.overflowBaseline).toBe(MEMBER_OVERFLOW_BASELINE);
    expect(applyMemberOverflowBaseline(prefs, false).migrated).toBe(false);
  });

  it("does not rewrite overflow for admins", () => {
    const saved = normalizeUserMenuPrefs({
      v: 2,
      dock: ["home", "mood", "decisions", "habits"],
      overflow: ["journal", "toolbox"],
      hidden: [],
    });
    const { prefs, migrated } = applyMemberOverflowBaseline(saved, true);
    expect(migrated).toBe(false);
    expect(prefs.overflow).toEqual(["journal", "toolbox"]);
  });
});
