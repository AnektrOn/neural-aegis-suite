import { useQuery } from "@tanstack/react-query";
import { fetchPersonaTrackingStats } from "@/features/persona/services/personaTrackingStats";
import type { Locale } from "@/i18n/translations";

export function usePersonaTrackingStats(userId: string | undefined, locale: Locale) {
  return useQuery({
    queryKey: ["persona-tracking-stats", userId, locale],
    queryFn: () => fetchPersonaTrackingStats(userId!, locale),
    enabled: Boolean(userId),
    staleTime: 60_000,
  });
}
