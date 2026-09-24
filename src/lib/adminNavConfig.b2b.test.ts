import { describe, expect, it } from "vitest";
import {
  COMPANY_ADMIN_ALLOWED_PATHS,
  COMPANY_ADMIN_ALLOWED_TABS,
  filterNavForRole,
  isCompanyAdminPathAllowed,
  ADMIN_NAV_SECTIONS,
} from "@/lib/adminNavConfig";

describe("B2B company admin nav isolation", () => {
  it("allows core company-admin paths", () => {
    expect(isCompanyAdminPathAllowed("/admin")).toBe(true);
    expect(isCompanyAdminPathAllowed("/admin/users")).toBe(true);
    expect(isCompanyAdminPathAllowed("/admin/insights")).toBe(true);
    expect(isCompanyAdminPathAllowed("/admin/pulse")).toBe(true);
    expect(isCompanyAdminPathAllowed("/admin/toolbox")).toBe(true);
  });

  it("blocks superadmin-only paths", () => {
    expect(isCompanyAdminPathAllowed("/admin/companies")).toBe(false);
    expect(isCompanyAdminPathAllowed("/admin/affiliates")).toBe(false);
    expect(isCompanyAdminPathAllowed("/admin/mobile-releases")).toBe(false);
    expect(isCompanyAdminPathAllowed("/admin/cartography")).toBe(false);
    expect(isCompanyAdminPathAllowed("/admin/newsletter")).toBe(false);
  });

  it("filters hub tabs to tracking/stats only", () => {
    const filtered = filterNavForRole(ADMIN_NAV_SECTIONS, {
      isSuperAdmin: false,
      isCompanyAdmin: true,
    });
    const paths = filtered.flatMap((s) => s.items.map((i) => i.to));
    expect(paths).toContain("/admin/users");
    expect(paths).not.toContain("/admin/companies");
    expect(paths).not.toContain("/admin/affiliates");

    const pulse = filtered
      .flatMap((s) => s.items)
      .find((i) => i.kind === "hub" && i.to === "/admin/pulse");
    expect(pulse?.kind).toBe("hub");
    if (pulse?.kind === "hub") {
      expect(pulse.tabs.map((t) => t.id)).toEqual(["stats"]);
      expect(COMPANY_ADMIN_ALLOWED_TABS["/admin/pulse"]?.has("manage")).toBe(false);
    }

    const toolbox = filtered
      .flatMap((s) => s.items)
      .find((i) => i.kind === "hub" && i.to === "/admin/toolbox");
    if (toolbox?.kind === "hub") {
      expect(toolbox.tabs.every((t) => ["tracking", "userView"].includes(t.id))).toBe(true);
      expect(toolbox.tabs.some((t) => t.id === "import")).toBe(false);
    }
  });

  it("keeps full nav for superadmin", () => {
    const filtered = filterNavForRole(ADMIN_NAV_SECTIONS, {
      isSuperAdmin: true,
      isCompanyAdmin: false,
    });
    expect(filtered).toEqual(ADMIN_NAV_SECTIONS);
    expect(COMPANY_ADMIN_ALLOWED_PATHS.has("/admin/users")).toBe(true);
  });
});
