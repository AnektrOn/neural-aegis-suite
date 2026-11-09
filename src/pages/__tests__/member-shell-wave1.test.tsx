import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("@/i18n/LanguageContext", () => ({
  useLanguage: () => ({ t: (k: string) => k, locale: "fr" }),
}));
vi.mock("@/hooks/useUserMenuPrefs", () => ({
  useUserMenuPrefs: () => ({ prefs: { hidden: [] } }),
}));

describe("Member shell v2 — wave 1 pages", () => {
  it.each([
    ["CaptureHub", () => import("../CaptureHub")],
    ["MoodTracker", () => import("../MoodTracker")],
    ["DecisionLog", () => import("../DecisionLog")],
    ["Journal", () => import("../Journal")],
    ["HabitTracker", () => import("../HabitTracker")],
  ])("%s loads without throwing at import time", async (_name, load) => {
    const mod = await load();
    expect(mod.default).toBeTruthy();
  });

  it("CaptureHub renders inside the member page scaffold", async () => {
    const { default: CaptureHub } = await import("../CaptureHub");
    const { container } = render(
      <MemoryRouter>
        <CaptureHub />
      </MemoryRouter>,
    );
    expect(container.querySelector("[data-member-page]")).toBeTruthy();
  });
});
