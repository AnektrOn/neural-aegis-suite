import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";

export const ONBOARDING_STORAGE_KEY = "aegis_exec_onboarding:v1";
export const ONBOARDING_DONE_KEY_PREFIX = "aegis_exec_onboarding_done:v1:";

export type OnboardingStep = 1 | 2 | 3 | 4 | 5;
export type StakeholderRole = "COFOUNDER" | "LEAD_INVESTOR" | "SPOUSE" | "RIGHT_HAND";
export type TensionLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface OnboardingStakeholder {
  id: string;
  name: string;
  role: StakeholderRole;
  role_label?: string;
  tension_level: TensionLevel;
}

export interface RawDilemmaAnswer {
  questionPosition: number;
  dimension: string;
  optionPosition: number;
  intensity: 1 | 2 | 3;
  answeredAt: string;
}

export interface OnboardingProfileFields {
  role_title: string | null;
  company_stage: string | null;
  team_size: string | null;
  annual_revenue_bracket: string | null;
  governance_structure: string | null;
  primary_stakeholders: OnboardingStakeholder[];
  urgent_decision_title: string;
  urgent_decision_stakes: string;
  urgent_decision_horizon: string | null;
  dominant_decision_friction: string | null;
  raw_dilemma_responses: Record<string, RawDilemmaAnswer>;
  peak_focus_time: string | null;
  stress_symptoms: string[];
}

export interface OnboardingProfileSnapshot extends OnboardingProfileFields {
  onboarding_step_reached: OnboardingStep;
}

export interface OnboardingState extends OnboardingProfileFields {
  ownerUserId: string | null;
  currentStep: OnboardingStep;
  bindUser: (userId: string) => void;
  setStep: (step: OnboardingStep) => void;
  updateFields: (patch: Partial<OnboardingProfileFields>) => void;
  addStakeholder: () => void;
  updateStakeholder: (
    id: string,
    patch: Partial<Omit<OnboardingStakeholder, "id">>,
  ) => void;
  removeStakeholder: (id: string) => void;
  toggleStressSymptom: (symptom: string) => void;
  setDilemmaResponse: (questionKey: string, answer: RawDilemmaAnswer) => void;
  hydrateFromRemote: (
    userId: string,
    remote: Partial<OnboardingProfileFields> & { currentStep?: OnboardingStep },
  ) => void;
  getProfileSnapshot: () => OnboardingProfileSnapshot;
  resetOnboarding: () => void;
}

const MAX_STAKEHOLDERS = 3;

const SYMPTOM_TO_FRICTION: Record<string, string> = {
  hyper_control: "control",
  escalation_avoidance: "avoidance",
  cognitive_dispersion: "burnout_risk",
  emotional_overinvestment: "people_pleasing",
  insomnia_rumination: "burnout_risk",
  somatic_tension: "burnout_risk",
};

function createStakeholderId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `stk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function makeDefaultStakeholder(): OnboardingStakeholder {
  return {
    id: createStakeholderId(),
    name: "",
    role: "COFOUNDER",
    tension_level: "MEDIUM",
  };
}

function createInitialFields(): OnboardingProfileFields {
  return {
    role_title: null,
    company_stage: null,
    team_size: null,
    annual_revenue_bracket: null,
    governance_structure: null,
    primary_stakeholders: [makeDefaultStakeholder()],
    urgent_decision_title: "",
    urgent_decision_stakes: "",
    urgent_decision_horizon: null,
    dominant_decision_friction: null,
    raw_dilemma_responses: {},
    peak_focus_time: null,
    stress_symptoms: [],
  };
}

const safeLocalStorage: StateStorage = {
  getItem: (name: string): string | null => {
    try {
      return typeof window !== "undefined" ? window.localStorage.getItem(name) : null;
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(name, value);
      }
    } catch {
      // Ignore quota / incognito restrictions cleanly
    }
  },
  removeItem: (name: string): void => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(name);
      }
    } catch {
      // Ignore incognito restrictions cleanly
    }
  },
};

export function isExecutiveOnboardingDone(userId: string | null | undefined): boolean {
  if (!userId) return false;
  try {
    return (
      typeof window !== "undefined" &&
      window.localStorage.getItem(`${ONBOARDING_DONE_KEY_PREFIX}${userId}`) === "1"
    );
  } catch {
    return false;
  }
}

export function markExecutiveOnboardingDone(userId: string | null | undefined): void {
  if (!userId) return;
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(`${ONBOARDING_DONE_KEY_PREFIX}${userId}`, "1");
    }
  } catch {
    // Ignore storage quota/incognito errors
  }
}

export function clearExecutiveOnboardingDone(userId: string | null | undefined): void {
  if (!userId) return;
  try {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(`${ONBOARDING_DONE_KEY_PREFIX}${userId}`);
    }
  } catch {
    // Ignore storage errors
  }
}

function clampStep(step: number | undefined): OnboardingStep {
  if (step === 2 || step === 3 || step === 4 || step === 5) return step;
  return 1;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      ownerUserId: null,
      currentStep: 1,
      ...createInitialFields(),

      bindUser: (userId) => {
        const currentOwner = get().ownerUserId;
        if (currentOwner === userId) return;
        if (currentOwner && currentOwner !== userId) {
          set({
            ownerUserId: userId,
            currentStep: 1,
            ...createInitialFields(),
          });
          return;
        }
        set({ ownerUserId: userId });
      },

      setStep: (step) => {
        set({ currentStep: clampStep(step) });
      },

      updateFields: (patch) => {
        set((state) => ({ ...state, ...patch }));
      },

      addStakeholder: () => {
        set((state) => {
          if (state.primary_stakeholders.length >= MAX_STAKEHOLDERS) return state;
          return {
            primary_stakeholders: [...state.primary_stakeholders, makeDefaultStakeholder()],
          };
        });
      },

      updateStakeholder: (id, patch) => {
        set((state) => ({
          primary_stakeholders: state.primary_stakeholders.map((item) =>
            item.id === id ? { ...item, ...patch } : item,
          ),
        }));
      },

      removeStakeholder: (id) => {
        set((state) => {
          if (state.primary_stakeholders.length <= 1) return state;
          return {
            primary_stakeholders: state.primary_stakeholders.filter((item) => item.id !== id),
          };
        });
      },

      toggleStressSymptom: (symptom) => {
        set((state) => {
          const exists = state.stress_symptoms.includes(symptom);
          const nextSymptoms = exists
            ? state.stress_symptoms.filter((s) => s !== symptom)
            : [...state.stress_symptoms, symptom];
          const derived = nextSymptoms[0]
            ? SYMPTOM_TO_FRICTION[nextSymptoms[0]] ?? nextSymptoms[0]
            : null;
          return {
            stress_symptoms: nextSymptoms,
            dominant_decision_friction:
              nextSymptoms.length === 0
                ? null
                : state.dominant_decision_friction ?? derived,
          };
        });
      },

      setDilemmaResponse: (questionKey, answer) => {
        set((state) => ({
          raw_dilemma_responses: {
            ...state.raw_dilemma_responses,
            [questionKey]: answer,
          },
        }));
      },

      hydrateFromRemote: (userId, remote) => {
        set((state) => {
          const nextStakeholders =
            Array.isArray(remote.primary_stakeholders) && remote.primary_stakeholders.length > 0
              ? remote.primary_stakeholders.slice(0, MAX_STAKEHOLDERS)
              : state.primary_stakeholders;
          return {
            ownerUserId: userId,
            currentStep: remote.currentStep ?? state.currentStep,
            role_title: remote.role_title ?? state.role_title,
            company_stage: remote.company_stage ?? state.company_stage,
            team_size: remote.team_size ?? state.team_size,
            annual_revenue_bracket:
              remote.annual_revenue_bracket ?? state.annual_revenue_bracket,
            governance_structure: remote.governance_structure ?? state.governance_structure,
            primary_stakeholders: nextStakeholders,
            urgent_decision_title:
              remote.urgent_decision_title ?? state.urgent_decision_title,
            urgent_decision_stakes:
              remote.urgent_decision_stakes ?? state.urgent_decision_stakes,
            urgent_decision_horizon:
              remote.urgent_decision_horizon ?? state.urgent_decision_horizon,
            dominant_decision_friction:
              remote.dominant_decision_friction ?? state.dominant_decision_friction,
            raw_dilemma_responses:
              remote.raw_dilemma_responses &&
              Object.keys(remote.raw_dilemma_responses).length > 0
                ? remote.raw_dilemma_responses
                : state.raw_dilemma_responses,
            peak_focus_time: remote.peak_focus_time ?? state.peak_focus_time,
            stress_symptoms:
              Array.isArray(remote.stress_symptoms) && remote.stress_symptoms.length > 0
                ? remote.stress_symptoms
                : state.stress_symptoms,
          };
        });
      },

      getProfileSnapshot: () => {
        const s = get();
        return {
          onboarding_step_reached: s.currentStep,
          role_title: s.role_title,
          company_stage: s.company_stage,
          team_size: s.team_size,
          annual_revenue_bracket: s.annual_revenue_bracket,
          governance_structure: s.governance_structure,
          primary_stakeholders: s.primary_stakeholders,
          urgent_decision_title: s.urgent_decision_title,
          urgent_decision_stakes: s.urgent_decision_stakes,
          urgent_decision_horizon: s.urgent_decision_horizon,
          dominant_decision_friction: s.dominant_decision_friction,
          raw_dilemma_responses: s.raw_dilemma_responses,
          peak_focus_time: s.peak_focus_time,
          stress_symptoms: s.stress_symptoms,
        };
      },

      resetOnboarding: () => {
        set({
          ownerUserId: null,
          currentStep: 1,
          ...createInitialFields(),
        });
        safeLocalStorage.removeItem(ONBOARDING_STORAGE_KEY);
      },
    }),
    {
      name: ONBOARDING_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => safeLocalStorage),
      partialize: (state) => ({
        ownerUserId: state.ownerUserId,
        currentStep: state.currentStep,
        role_title: state.role_title,
        company_stage: state.company_stage,
        team_size: state.team_size,
        annual_revenue_bracket: state.annual_revenue_bracket,
        governance_structure: state.governance_structure,
        primary_stakeholders: state.primary_stakeholders,
        urgent_decision_title: state.urgent_decision_title,
        urgent_decision_stakes: state.urgent_decision_stakes,
        urgent_decision_horizon: state.urgent_decision_horizon,
        dominant_decision_friction: state.dominant_decision_friction,
        raw_dilemma_responses: state.raw_dilemma_responses,
        peak_focus_time: state.peak_focus_time,
        stress_symptoms: state.stress_symptoms,
      }),
    },
  ),
);
