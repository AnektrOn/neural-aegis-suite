import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import {
  isExecutiveOnboardingDone,
  useOnboardingStore,
} from "@/store/useOnboardingStore";
import { finalizeOnboarding } from "@/services/onboardingService";

/**
 * Automatically flushes & finalizes a pre-login `/start` draft into Supabase
 * as soon as the user completes authentication.
 */
export default function ExecutiveOnboardingAutoSync() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const syncedUsersRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const userId = user?.id;
    if (!userId) return;
    if (syncedUsersRef.current.has(userId)) return;
    if (isExecutiveOnboardingDone(userId)) return;

    const state = useOnboardingStore.getState();
    const hasCompletedPreLoginDraft =
      Object.keys(state.raw_dilemma_responses).length >= 3 &&
      state.primary_stakeholders.some((s) => s.name.trim().length > 0);

    if (!hasCompletedPreLoginDraft) return;

    syncedUsersRef.current.add(userId);
    void finalizeOnboarding(userId)
      .then(async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["dashboard-mobile"] }),
          queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] }),
          queryClient.invalidateQueries({ queryKey: ["dashboard-digest"] }),
          queryClient.invalidateQueries({ queryKey: ["dashboard-people"] }),
          queryClient.invalidateQueries({ queryKey: ["decision-journal"] }),
          queryClient.invalidateQueries({ queryKey: ["bio-executive-hero"] }),
          queryClient.invalidateQueries({ queryKey: ["aegis-health"] }),
          queryClient.invalidateQueries({ queryKey: ["persona-tracking-stats"] }),
        ]);
      })
      .catch(() => {
        syncedUsersRef.current.delete(userId);
      });
  }, [queryClient, user?.id]);

  return null;
}
