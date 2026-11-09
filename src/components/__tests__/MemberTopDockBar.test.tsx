import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { MemberTopDockBar } from "../MemberTopDockBar";
import { LanguageProvider } from "@/i18n/LanguageContext";

function renderTopDock(props: { onLogout?: () => void; online?: boolean } = {}) {
  return render(
    <LanguageProvider>
      <MemberTopDockBar {...props} />
    </LanguageProvider>,
  );
}

describe("MemberTopDockBar", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = "";
  });

  it("renders all 3 actions: theme toggle, language toggle, and logout button", () => {
    const { getByLabelText, getByTitle } = renderTopDock();
    // Theme
    expect(getByLabelText(/thème/i)).toBeTruthy();
    // Language
    expect(getByTitle(/english|français/i)).toBeTruthy();
    // Logout
    expect(getByTitle(/déconnecter/i)).toBeTruthy();
  });

  it("calls onLogout callback when logout button is clicked", () => {
    const onLogout = vi.fn();
    const { getByTitle } = renderTopDock({ onLogout });
    const logoutBtn = getByTitle(/déconnecter/i);
    fireEvent.click(logoutBtn);
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it("toggles language between fr and en on click", () => {
    const { getByTitle, getByText } = renderTopDock();
    // Initially fr
    expect(getByText("fr")).toBeTruthy();

    // Click to switch
    const langBtn = getByTitle(/switch to english/i);
    fireEvent.click(langBtn);

    expect(getByText("en")).toBeTruthy();
  });

  it("toggles theme between dark and light mode on click", () => {
    const { getByLabelText } = renderTopDock();
    const themeBtn = getByLabelText(/thème/i);

    // Click theme button
    fireEvent.click(themeBtn);
    expect(document.documentElement.classList.contains("light") || document.documentElement.classList.contains("dark")).toBe(true);
  });
});
