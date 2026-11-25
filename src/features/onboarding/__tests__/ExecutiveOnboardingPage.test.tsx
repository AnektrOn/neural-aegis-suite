import { act, fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider, saveLocalePreference } from "@/i18n/LanguageContext";
import { translations } from "@/i18n/translations";
import {
  markExecutiveOnboardingDone,
  useOnboardingStore,
} from "@/store/useOnboardingStore";
import ExecutiveOnboardingPage from "../pages/ExecutiveOnboardingPage";
import { CURATED_DILEMMA_KEYS } from "../components/steps/Step5DecisionDilemmas";

const syncStepMock = vi.fn();
const fetchRemoteMock = vi.fn();
const finalizeMock = vi.fn();
let mockAuthUser: { id: string; email: string } | null = {
  id: "user-exec-1",
  email: "ceo@aegis.test",
};

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: mockAuthUser,
    loading: false,
  }),
}));

vi.mock("@capacitor/core", () => ({
  Capacitor: {
    isNativePlatform: () => false,
  },
}));

vi.mock("@capacitor/app", () => ({
  App: {
    addListener: vi.fn().mockResolvedValue({ remove: vi.fn() }),
  },
}));

vi.mock("@/services/onboardingService", () => ({
  syncStepToSupabase: (...args: unknown[]) => syncStepMock(...args),
  fetchExecutiveOnboardingRemote: (...args: unknown[]) => fetchRemoteMock(...args),
  finalizeOnboarding: (...args: unknown[]) => finalizeMock(...args),
}));

function renderOnboarding() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <MemoryRouter initialEntries={["/start"]}>
          <Routes>
            <Route path="/start" element={<ExecutiveOnboardingPage />} />
            <Route
              path="/auth"
              element={<div data-testid="auth-screen">Auth Screen</div>}
            />
            <Route
              path="/dashboard"
              element={<div data-testid="dashboard-screen">Dashboard Cockpit</div>}
            />
          </Routes>
        </MemoryRouter>
      </LanguageProvider>
    </QueryClientProvider>,
  );
}

describe("ExecutiveOnboardingPage", () => {
  beforeEach(() => {
    mockAuthUser = { id: "user-exec-1", email: "ceo@aegis.test" };
    window.localStorage.clear();
    saveLocalePreference("fr");
    useOnboardingStore.getState().resetOnboarding();
    vi.clearAllMocks();

    window.scrollTo = vi.fn();
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();

    fetchRemoteMock.mockResolvedValue({
      onboardingCompleted: false,
      profile: null,
    });
    finalizeMock.mockResolvedValue({
      success: true,
      clarity_score: 76,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("redirects immediately to /dashboard when executive onboarding is already marked done locally", async () => {
    markExecutiveOnboardingDone("user-exec-1");

    renderOnboarding();

    expect(await screen.findByTestId("dashboard-screen")).toBeInTheDocument();
    expect(fetchRemoteMock).not.toHaveBeenCalled();
  });

  it("redirects to /dashboard when remote profile indicates onboardingCompleted", async () => {
    fetchRemoteMock.mockResolvedValueOnce({
      onboardingCompleted: true,
      profile: null,
    });

    renderOnboarding();

    expect(await screen.findByTestId("dashboard-screen")).toBeInTheDocument();
  });

  it("walks through all 5 steps, runs 3000ms synthesis with retry, displays Sovereignty Score preview, and enters /dashboard", async () => {
    finalizeMock
      .mockRejectedValueOnce(new Error("RPC_TEMPORARY_ERROR"))
      .mockResolvedValueOnce({ success: true, clarity_score: 81 });

    renderOnboarding();

    // Step 1: Identité & Posture
    expect(
      await screen.findByRole("heading", { name: translations["execOnboarding.step1.title"].fr }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Leader/ }));
    fireEvent.change(
      screen.getByPlaceholderText(translations["execOnboarding.step1.fullNamePlaceholder"].fr),
      { target: { value: "Camille Laurent" } },
    );
    fireEvent.change(
      screen.getByLabelText(translations["execOnboarding.step1.birthDateLabel"].fr),
      { target: { value: "1990-05-14" } },
    );
    fireEvent.click(screen.getByRole("button", { name: /Paris, France/ }));

    expect(syncStepMock).toHaveBeenCalledWith(
      expect.objectContaining({ occupation: "Leader" }),
      "user-exec-1",
    );
    fireEvent.click(screen.getByRole("button", { name: translations["execOnboarding.continue"].fr }));

    // Step 2: Tension Humaine
    expect(
      await screen.findByRole("heading", { name: translations["execOnboarding.step2.title"].fr }),
    ).toBeInTheDocument();
    fireEvent.change(
      screen.getByPlaceholderText(translations["execOnboarding.step2.namePlaceholder"].fr),
      { target: { value: "Thomas" } },
    );
    fireEvent.click(
      screen.getByRole("button", { name: translations["execOnboarding.step2.dynamic.trust_loss"].fr }),
    );
    fireEvent.click(screen.getByRole("button", { name: translations["execOnboarding.continue"].fr }));

    // Step 3: Épine dans le Pied
    expect(
      await screen.findByRole("heading", { name: translations["execOnboarding.step3.title"].fr }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: translations["execOnboarding.step3.cost.integrity"].fr }),
    );
    fireEvent.click(screen.getByRole("button", { name: translations["execOnboarding.continue"].fr }));

    // Step 4: Cartographie des 4 Ombres
    expect(
      await screen.findByRole("heading", { name: translations["execOnboarding.step4.title"].fr }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /L'esquive de perfection/ }));
    expect(useOnboardingStore.getState().dominant_decision_friction).toBe("saboteur");
    fireEvent.click(screen.getByRole("button", { name: translations["execOnboarding.continue"].fr }));

    // Step 5: 3 Questions Miroir Viscérales
    expect(
      await screen.findByRole("heading", { name: translations["execOnboarding.step5.title"].fr }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: translations["execOnboarding.step5.q1.opt1"].fr }));
    fireEvent.click(screen.getByRole("button", { name: translations["execOnboarding.step5.q2.opt2"].fr }));
    fireEvent.click(screen.getByRole("button", { name: translations["execOnboarding.step5.q3.opt3"].fr }));

    const storedDilemmas = useOnboardingStore.getState().raw_dilemma_responses;
    for (const key of CURATED_DILEMMA_KEYS) {
      expect(storedDilemmas[key]).toBeDefined();
    }

    vi.useFakeTimers();

    fireEvent.click(
      screen.getByRole("button", { name: translations["execOnboarding.finalize"].fr }),
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10);
    });

    expect(
      screen.getByRole("heading", { name: translations["execOnboarding.aha.errorTitle"].fr }),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: translations["execOnboarding.aha.errorRetry"].fr }),
    );

    expect(
      screen.getByRole("heading", { name: translations["execOnboarding.aha.phase1.title"].fr }),
    ).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(750);
    });
    expect(
      screen.getByRole("heading", { name: translations["execOnboarding.aha.phase2.title"].fr }),
    ).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(750);
    });
    expect(
      screen.getByRole("heading", { name: translations["execOnboarding.aha.phase3.title"].fr }),
    ).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(750);
    });
    expect(
      screen.getByRole("heading", { name: translations["execOnboarding.aha.phase4.title"].fr }),
    ).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(750);
      await Promise.resolve();
      await Promise.resolve();
    });

    // Shows Sovereignty Score & Cockpit preview BEFORE entering /dashboard
    expect(screen.getByText("81")).toBeInTheDocument();
    expect(screen.getByText("Thomas · N+1 / Direction")).toBeInTheDocument();
    expect(screen.queryByTestId("dashboard-screen")).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: translations["execOnboarding.preview.enterDashboard"].fr }),
    );
    expect(screen.getByTestId("dashboard-screen")).toBeInTheDocument();
  });

  it("supports pre-login flow (no user), shows local Sovereignty Score preview, and routes to /auth", async () => {
    mockAuthUser = null;

    renderOnboarding();

    expect(
      await screen.findByRole("heading", { name: translations["execOnboarding.step1.title"].fr }),
    ).toBeInTheDocument();

    fireEvent.change(
      screen.getByPlaceholderText(translations["execOnboarding.step1.fullNamePlaceholder"].fr),
      { target: { value: "Marc" } },
    );
    fireEvent.change(
      screen.getByPlaceholderText(translations["execOnboarding.step1.emailPlaceholder"].fr),
      { target: { value: "marc@aegis.test" } },
    );
    fireEvent.change(
      screen.getByLabelText(translations["execOnboarding.step1.birthDateLabel"].fr),
      { target: { value: "1988-02-10" } },
    );
    fireEvent.click(screen.getByRole("button", { name: /Paris, France/ }));
    fireEvent.click(screen.getByRole("button", { name: translations["execOnboarding.continue"].fr }));

    fireEvent.change(
      screen.getByPlaceholderText(translations["execOnboarding.step2.namePlaceholder"].fr),
      { target: { value: "Julie" } },
    );
    fireEvent.click(screen.getByRole("button", { name: translations["execOnboarding.continue"].fr }));
    fireEvent.click(screen.getByRole("button", { name: translations["execOnboarding.continue"].fr }));

    fireEvent.click(screen.getByRole("button", { name: /L'esquive de perfection/ }));
    fireEvent.click(screen.getByRole("button", { name: translations["execOnboarding.continue"].fr }));

    fireEvent.click(screen.getByRole("button", { name: translations["execOnboarding.step5.q1.opt3"].fr }));
    fireEvent.click(screen.getByRole("button", { name: translations["execOnboarding.step5.q2.opt3"].fr }));
    fireEvent.click(screen.getByRole("button", { name: translations["execOnboarding.step5.q3.opt3"].fr }));

    vi.useFakeTimers();
    fireEvent.click(
      screen.getByRole("button", { name: translations["execOnboarding.finalize"].fr }),
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3100);
      await Promise.resolve();
    });

    expect(finalizeMock).not.toHaveBeenCalled();
    expect(screen.getByText("88")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: translations["execOnboarding.preview.createAccountCta"].fr }),
    );
    expect(screen.getByTestId("auth-screen")).toBeInTheDocument();
  });
});
