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
import { CURATED_DILEMMA_POSITIONS } from "../components/steps/Step5DecisionDilemmas";

const syncStepMock = vi.fn();
const fetchRemoteMock = vi.fn();
const finalizeMock = vi.fn();
const completeGuardianMock = vi.fn();

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "user-exec-1", email: "ceo@aegis.test" },
    loading: false,
  }),
}));

vi.mock("@/features/guardian", () => ({
  useGuardianOptional: () => ({
    completeGuardian: completeGuardianMock,
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
        <MemoryRouter initialEntries={["/onboarding"]}>
          <Routes>
            <Route path="/onboarding" element={<ExecutiveOnboardingPage />} />
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

  it("walks through all 5 steps, runs retryable 3000ms sequential Aha synthesis, and navigates to /dashboard", async () => {
    finalizeMock
      .mockRejectedValueOnce(new Error("RPC_TEMPORARY_ERROR"))
      .mockResolvedValueOnce({ success: true, clarity_score: 81 });

    renderOnboarding();

    // Wait for remote draft check & Step 1 render
    expect(
      await screen.findByRole("heading", { name: translations["execOnboarding.step1.title"].fr }),
    ).toBeInTheDocument();

    // Step 1: Role & Org scale
    fireEvent.click(screen.getByRole("button", { name: translations["execOnboarding.step1.role.founder_ceo"].fr }));
    fireEvent.click(screen.getByRole("button", { name: translations["execOnboarding.step1.org.11_50"].fr }));
    expect(syncStepMock).toHaveBeenCalledWith(
      expect.objectContaining({ role_title: "founder_ceo" }),
      "user-exec-1",
    );
    fireEvent.click(screen.getByRole("button", { name: translations["execOnboarding.continue"].fr }));

    // Step 2: Stakeholder
    expect(
      await screen.findByRole("heading", { name: translations["execOnboarding.step2.title"].fr }),
    ).toBeInTheDocument();
    const stakeholderInput = screen.getByPlaceholderText(
      translations["execOnboarding.step2.namePlaceholder"].fr,
    );
    fireEvent.change(stakeholderInput, { target: { value: "Marc" } });
    expect(syncStepMock).toHaveBeenCalledWith(
      expect.objectContaining({
        primary_stakeholders: expect.arrayContaining([
          expect.objectContaining({ name: "Marc" }),
        ]),
      }),
      "user-exec-1",
    );
    fireEvent.click(screen.getByRole("button", { name: translations["execOnboarding.continue"].fr }));

    // Step 3: Urgent Decision
    expect(
      await screen.findByRole("heading", { name: translations["execOnboarding.step3.title"].fr }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: translations["execOnboarding.step3.preset.exec_exit"].fr }),
    );
    expect(syncStepMock).toHaveBeenCalledWith(
      expect.objectContaining({
        urgent_decision_title: translations["execOnboarding.step3.preset.exec_exit"].fr,
      }),
      "user-exec-1",
    );
    fireEvent.click(screen.getByRole("button", { name: translations["execOnboarding.continue"].fr }));

    // Step 4: Somatic Friction
    expect(
      await screen.findByRole("heading", { name: translations["execOnboarding.step4.title"].fr }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: translations["execOnboarding.step4.symptom.hyper_control"].fr }),
    );
    expect(useOnboardingStore.getState().dominant_decision_friction).toBe("control");
    fireEvent.click(screen.getByRole("button", { name: translations["execOnboarding.continue"].fr }));

    // Step 5: 6 Curated Dilemmas
    expect(
      await screen.findByRole("heading", { name: translations["execOnboarding.step5.title"].fr }),
    ).toBeInTheDocument();

    for (let idx = 0; idx < CURATED_DILEMMA_POSITIONS.length; idx++) {
      const tabLabel = translations["execOnboarding.step5.progressLabel"].fr
        .replace("{current}", String(idx + 1))
        .replace("{total}", String(CURATED_DILEMMA_POSITIONS.length));
      fireEvent.click(screen.getByRole("button", { name: tabLabel }));
      const optionA = screen.getByRole("button", { name: /^A\./ });
      fireEvent.click(optionA);
    }

    const storedDilemmas = useOnboardingStore.getState().raw_dilemma_responses;
    for (const pos of CURATED_DILEMMA_POSITIONS) {
      expect(storedDilemmas[String(pos)]).toBeDefined();
    }

    // Switch to fake timers before launching Aha Synthesis
    vi.useFakeTimers();

    fireEvent.click(
      screen.getByRole("button", { name: translations["execOnboarding.finalize"].fr }),
    );

    // Flush first rejected finalizeOnboarding() call
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10);
    });

    expect(
      screen.getByRole("heading", { name: translations["execOnboarding.aha.errorTitle"].fr }),
    ).toBeInTheDocument();

    // Retry succeeds and progresses through sequential phases across 3000ms
    fireEvent.click(
      screen.getByRole("button", { name: translations["execOnboarding.aha.errorRetry"].fr }),
    );

    expect(
      screen.getByRole("heading", { name: translations["execOnboarding.aha.phase1.title"].fr }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("dashboard-screen")).not.toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(
      screen.getByRole("heading", { name: translations["execOnboarding.aha.phase2.title"].fr }),
    ).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(
      screen.getByRole("heading", { name: translations["execOnboarding.aha.phase3.title"].fr }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("dashboard-screen")).not.toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(completeGuardianMock).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("dashboard-screen")).toBeInTheDocument();
  });
});
