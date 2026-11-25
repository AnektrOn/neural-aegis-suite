import { useQuery } from "@tanstack/react-query";
import { fetchPersonaTrackingStats } from "@/features/persona/services/personaTrackingStats";
import { useSubscription } from "@/hooks/useSubscription";
import { useAdmin } from "@/hooks/use-admin";
import {
  FREE_ACTIVE_PULSE_CARDS,
  SOLO_ACTIVE_PULSE_CARDS,
} from "@/lib/soloPlanQuotas";
import type { Locale } from "@/i18n/translations";

export function usePersonaTrackingStats(userId: string | undefined, locale: Locale) {
  const { isActive, loading: subLoading } = useSubscription();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const pulseLimit =
    isActive || isAdmin ? SOLO_ACTIVE_PULSE_CARDS : FREE_ACTIVE_PULSE_CARDS;

  return useQuery({
    queryKey: ["persona-tracking-stats", userId, locale, pulseLimit],
    queryFn: () => fetchPersonaTrackingStats(userId!, locale, pulseLimit),
    enabled: Boolean(userId) && !subLoading && !adminLoading,
    staleTime: 60_000,
  });
}
