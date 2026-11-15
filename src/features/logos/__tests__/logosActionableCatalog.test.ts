import { describe, expect, it } from "vitest";

// Mirrors filter in logosActionableCatalog (unit guard for LOGOS open rules)
function isLogosOpenableAssignment(row: {
  content_type: string;
  external_url: string | null;
  user_delivery_status?: string | null;
}): boolean {
  const status = row.user_delivery_status ?? "active";
  if (status === "waiting" || status === "inactive") return false;
  if (row.content_type === "external_link") return false;
  return true;
}

describe("LOGOS toolbox open rules", () => {
  it("blocks external links and waiting", () => {
    expect(
      isLogosOpenableAssignment({
        content_type: "external_link",
        external_url: "https://example.com",
        user_delivery_status: "active",
      }),
    ).toBe(false);
    expect(
      isLogosOpenableAssignment({
        content_type: "course",
        external_url: null,
        user_delivery_status: "waiting",
      }),
    ).toBe(false);
  });

  it("allows active interactive assignments", () => {
    expect(
      isLogosOpenableAssignment({
        content_type: "breathing_widget",
        external_url: null,
        user_delivery_status: "active",
      }),
    ).toBe(true);
  });
});
