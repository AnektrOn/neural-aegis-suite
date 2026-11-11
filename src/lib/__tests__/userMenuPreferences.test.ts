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

  it("defaults radial overflow to hubs plus persona, account, and settings", () => {
    expect(defaultUserMenuPrefs().overflow).toEqual([
      "pratiques_hub",
      "capture_hub",
      "messages_hub",
      "persona",
      "profile",
      "settings",
    ]);
    expect(defaultUserMenuPrefs().overflowBaseline).toBe(MEMBER_OVERFLOW_BASELINE);
  });

  it("rewrites saved member overflow to the baseline once", () => {
    const saved = normalizeUserMenuPrefs({
      v: 2,
      dock: ["home", "mood", "decisions", "habits"],
      overflow: ["journal", "toolbox", "pulse", "bibliotheque"],
      hidden: [],
    });
    const { prefs, migrated } = applyMemberOverflowBaseline(saved, false);
    expect(migrated).toBe(true);
    expect(prefs.overflow).toEqual([
      "pratiques_hub",
      "capture_hub",
      "messages_hub",
      "persona",
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
