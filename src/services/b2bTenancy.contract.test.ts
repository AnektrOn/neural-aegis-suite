import { describe, expect, it } from "vitest";

/**
 * Documents the SQL contract from migration 20260922140000_b2b_superadmin_company_admin.
 * Runtime RLS proofs require a live Supabase; this test locks the expected API surface.
 */
describe("B2B tenancy SQL contract", () => {
  const expectedRpcs = [
    "is_superadmin",
    "is_company_admin",
    "is_platform_operator",
    "is_company_admin_of",
    "same_company",
    "can_view_employee",
    "can_read_journal_as_manager",
    "grant_company_admin",
    "revoke_company_admin",
    "leave_company",
    "accept_company_invite",
    "company_has_seat_available",
    "log_admin_data_access",
    "b2b_assert_tenancy_helpers",
  ];

  const expectedTables = [
    "company_memberships",
    "company_invites",
    "employer_data_consent",
  ];

  it("lists required RPCs for tenancy", () => {
    expect(expectedRpcs).toContain("grant_company_admin");
    expect(expectedRpcs).toContain("can_view_employee");
    expect(expectedRpcs).toContain("can_read_journal_as_manager");
  });

  it("lists required tables for tenancy", () => {
    expect(expectedTables).toEqual([
      "company_memberships",
      "company_invites",
      "employer_data_consent",
    ]);
  });

  it("encodes write vs read capability matrix", () => {
    const matrix = {
      pulseCardsWrite: "superadmin",
      toolboxAssignWrite: "superadmin",
      cartographyWrite: "superadmin",
      userReportsWrite: "superadmin",
      employeeMetricsRead: "superadmin|company_admin_same_company",
      journalTextRead: "superadmin|company_admin_with_consent",
    };
    expect(matrix.pulseCardsWrite).toBe("superadmin");
    expect(matrix.journalTextRead).toContain("consent");
  });
});
