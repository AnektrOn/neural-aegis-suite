import { beforeEach, describe, expect, it } from "vitest";
import {
  clearExecutiveOnboardingDone,
  isExecutiveOnboardingDone,
  markExecutiveOnboardingDone,
  ONBOARDING_STORAGE_KEY,
  useOnboardingStore,
} from "../useOnboardingStore";

describe("useOnboardingStore", () => {
  beforeEach(() => {
    window.localStorage.clear();
    useOnboardingStore.getState().resetOnboarding();
  });

  it("persists step & profile fields in web localStorage and rehydrates cleanly", async () => {
    const store = useOnboardingStore.getState();
    store.bindUser("exec-user-1");
    store.updateFields({
      role_title: "founder_ceo",
      team_size: "11_50",
      urgent_decision_title: "Arbitrage levée Q3",
    });
    store.setStep(3);

    const raw = window.localStorage.getItem(ONBOARDING_STORAGE_KEY);
    expect(raw).not.toBeNull();
    expect(raw).toContain("founder_ceo");
    expect(raw).toContain("Arbitrage levée Q3");

    // Mutate in-memory state cleanly while preserving persisted snapshot to test reload rehydration
    useOnboardingStore.setState({
      role_title: null,
      team_size: null,
      currentStep: 1,
    });
    window.localStorage.setItem(ONBOARDING_STORAGE_KEY, raw!);
    await useOnboardingStore.persist.rehydrate();

    const rehydrated = useOnboardingStore.getState();
    expect(rehydrated.ownerUserId).toBe("exec-user-1");
    expect(rehydrated.currentStep).toBe(3);
    expect(rehydrated.role_title).toBe("founder_ceo");
    expect(rehydrated.team_size).toBe("11_50");
  });

  it("enforces min 1 and max 3 critical stakeholders", () => {
    const store = useOnboardingStore.getState();
    expect(store.primary_stakeholders).toHaveLength(1);

    const firstId = store.primary_stakeholders[0].id;
    store.removeStakeholder(firstId);
    expect(useOnboardingStore.getState().primary_stakeholders).toHaveLength(1);

    store.addStakeholder();
    store.addStakeholder();
    store.addStakeholder(); // Should be capped at 3
    expect(useOnboardingStore.getState().primary_stakeholders).toHaveLength(3);

    const secondId = useOnboardingStore.getState().primary_stakeholders[1].id;
    store.removeStakeholder(secondId);
    expect(useOnboardingStore.getState().primary_stakeholders).toHaveLength(2);
  });

  it("maps stress symptoms to dominant_decision_friction and clears when empty", () => {
    const store = useOnboardingStore.getState();
    store.toggleStressSymptom("saboteur");

    let state = useOnboardingStore.getState();
    expect(state.stress_symptoms).toEqual(["saboteur"]);
    expect(state.dominant_decision_friction).toBe("saboteur");

    store.toggleStressSymptom("saboteur");
    state = useOnboardingStore.getState();
    expect(state.stress_symptoms).toEqual([]);
    expect(state.dominant_decision_friction).toBeNull();
  });

  it("manages completion marker and wipes draft localStorage on resetOnboarding", () => {
    markExecutiveOnboardingDone("exec-user-99");
    expect(isExecutiveOnboardingDone("exec-user-99")).toBe(true);
    clearExecutiveOnboardingDone("exec-user-99");
    expect(isExecutiveOnboardingDone("exec-user-99")).toBe(false);

    useOnboardingStore.getState().bindUser("exec-user-99");
    useOnboardingStore.getState().updateFields({ role_title: "c_level" });
    expect(window.localStorage.getItem(ONBOARDING_STORAGE_KEY)).not.toBeNull();

    useOnboardingStore.getState().resetOnboarding();
    expect(window.localStorage.getItem(ONBOARDING_STORAGE_KEY)).toBeNull();
    expect(useOnboardingStore.getState().role_title).toBe("Business Owner");
    expect(useOnboardingStore.getState().full_name).toBe("");
  });
});
