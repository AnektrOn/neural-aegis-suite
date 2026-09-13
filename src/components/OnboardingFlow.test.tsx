import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { LanguageProvider } from "@/i18n/LanguageContext";
import OnboardingFlow from "@/components/OnboardingFlow";

vi.mock("framer-motion", async (importOriginal) => {
  const actual = await importOriginal<typeof import("framer-motion")>();
  return {
    ...actual,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  };
});

function renderTour(onComplete = vi.fn()) {
  render(
    <LanguageProvider>
      <OnboardingFlow onComplete={onComplete} />
    </LanguageProvider>,
  );
  return onComplete;
}

describe("OnboardingFlow product tour", () => {
  it("starts on slide 1 with Skip visible", () => {
    renderTour();
    expect(screen.getByRole("heading", { name: "Votre tableau de bord" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Passer" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Retour" })).not.toBeInTheDocument();
  });

  it("walks through 4 slides then completes", () => {
    const onComplete = renderTour();
    const titles = [
      "Votre tableau de bord",
      "Votre identité intérieure",
      "Pratiques guidées",
      "Compte et installation",
    ];
    for (let i = 0; i < titles.length - 1; i++) {
      expect(screen.getByRole("heading", { name: titles[i] })).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: /Suivant/ }));
    }
    expect(screen.getByRole("heading", { name: titles[3] })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Passer" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Commencer/ }));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("skip on any slide completes the tour", () => {
    const onComplete = renderTour();
    fireEvent.click(screen.getByRole("button", { name: /Suivant/ }));
    fireEvent.click(screen.getByRole("button", { name: "Passer" }));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
