import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { MemberTopDockBar } from "../MemberTopDockBar";
import { LanguageProvider } from "@/i18n/LanguageContext";

function renderTopDock(props: { onLogout?: () => void; online?: boolean } = {}) {
  return render(
    <MemoryRouter>
      <LanguageProvider>
        <MemberTopDockBar {...props} />
      </LanguageProvider>
    </MemoryRouter>,
  );
}

function expandDock(
  utils: ReturnType<typeof renderTopDock>,
) {
  fireEvent.click(utils.getByLabelText(/ouvrir les actions|open quick actions/i));
}

describe("MemberTopDockBar", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = "";
  });

  it("starts collapsed as a single point", () => {
    const { getByLabelText, queryByTitle } = renderTopDock();
    expect(getByLabelText(/ouvrir les actions|open quick actions/i)).toBeTruthy();
    expect(queryByTitle(/déconnecter/i)).toBeNull();
  });

  it("expands on click and shows welcome, theme, language, and logout", () => {
    const utils = renderTopDock();
    expandDock(utils);
    expect(utils.getByTitle(/bienvenue|welcome/i)).toBeTruthy();
    expect(utils.getByLabelText(/thème/i)).toBeTruthy();
    expect(utils.getByTitle(/english|français/i)).toBeTruthy();
    expect(utils.getByTitle(/déconnecter/i)).toBeTruthy();
  });

  it("calls onLogout callback when logout button is clicked", () => {
    const onLogout = vi.fn();
    const utils = renderTopDock({ onLogout });
    expandDock(utils);
    fireEvent.click(utils.getByTitle(/déconnecter/i));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it("toggles language between fr and en on click", () => {
    const utils = renderTopDock();
    expandDock(utils);
    expect(utils.getByText("fr")).toBeTruthy();
    fireEvent.click(utils.getByTitle(/switch to english/i));
    expect(utils.getByText("en")).toBeTruthy();
  });

  it("toggles theme between dark and light mode on click", () => {
    const utils = renderTopDock();
    expandDock(utils);
    fireEvent.click(utils.getByLabelText(/thème/i));
    expect(
      document.documentElement.classList.contains("light") ||
        document.documentElement.classList.contains("dark"),
    ).toBe(true);
  });
});
