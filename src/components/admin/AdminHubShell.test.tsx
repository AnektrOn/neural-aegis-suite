import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import AdminHubShell from "./AdminHubShell";

const roles = vi.hoisted(() => ({
  isSuperAdmin: true,
  isCompanyAdmin: false,
  loading: true,
}));

vi.mock("@/hooks/use-admin", () => ({ usePlatformRoles: () => roles }));
vi.mock("@/i18n/LanguageContext", () => ({
  useLanguage: () => ({ t: (key: string) => key }),
}));

function shell(pathname = "/admin/deep-dive") {
  return (
    <MemoryRouter initialEntries={["/admin/deep-dive?tab=report"]}>
      <AdminHubShell pathname={pathname} panels={{ report: null }} />
    </MemoryRouter>
  );
}

describe("AdminHubShell render lifecycle", () => {
  beforeEach(() => {
    roles.loading = true;
  });
  afterEach(cleanup);

  it("keeps hook order stable when admin roles finish loading", () => {
    const view = render(shell());
    roles.loading = false;
    expect(() => view.rerender(shell())).not.toThrow();
    roles.loading = true;
    expect(() => view.rerender(shell())).not.toThrow();
  });

  it("keeps hook order stable when an unavailable hub becomes available", () => {
    roles.loading = false;
    const view = render(shell("/admin/unknown"));
    expect(() => view.rerender(shell())).not.toThrow();
    expect(() => view.rerender(shell("/admin/unknown"))).not.toThrow();
  });
});