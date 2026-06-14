import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useMoodHistory(userId: string | undefined, dayNames: string[]) {
  return useQuery({
    queryKey: ["mood-history", userId, dayNames.join(",")],
    queryFn: async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      const { data, error } = await supabase
        .from("mood_entries" as any)
        .select("value, logged_at")
        .eq("user_id", userId!)
        .gte("logged_at", sevenDaysAgo.toISOString())
        .order("logged_at", { ascending: true });
      if (error) throw error;

      const byDay = new Map<string, number>();
      (data || []).forEach((entry: { value: number; logged_at: string }) => {
        const d = new Date(entry.logged_at);
        byDay.set(dayNames[d.getDay()], entry.value);
      });

      const result: { day: string; value: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const day = dayNames[d.getDay()];
        result.push({ day, value: byDay.get(day) || 0 });
      }
      return result;
    },
    enabled: Boolean(userId) && dayNames.length === 7,
    staleTime: 30_000,
  });
}
