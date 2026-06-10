import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  buildDecisionAnalytics,
  formatDecisionDuration,
  type DecisionRecord,
} from "@/lib/decisionAnalytics";

const QUERY_KEY = "decision-journal";

export async function fetchDecisionJournal(userId: string): Promise<DecisionRecord[]> {
  const { data, error } = await supabase
    .from("decisions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("fetchDecisionJournal:", error.message);
    throw new Error(error.message);
  }
  return (data ?? []) as DecisionRecord[];
}

export function useDecisionJournal(
  userId: string | undefined,
  statusLabels: { pending: string; decided: string; deferred: string },
  dateLocale: string,
) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [QUERY_KEY, userId],
    queryFn: () => fetchDecisionJournal(userId!),
    enabled: !!userId,
    staleTime: 30_000,
  });

  const analytics = useMemo(
    () => buildDecisionAnalytics(query.data ?? [], statusLabels, dateLocale),
    [query.data, statusLabels, dateLocale],
  );

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: [QUERY_KEY, userId] });

  const createMutation = useMutation({
    mutationFn: async (input: { name: string; priority: number; responsibility: number }) => {
      const { error } = await supabase.from("decisions").insert({
        user_id: userId!,
        name: input.name,
        priority: Math.round(input.priority),
        responsibility: Math.round(input.responsibility),
      } as never);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => void invalidate(),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (input: {
      id: string;
      status: string;
      createdAt: string;
      deferredUntil?: string;
    }) => {
      const updates: Record<string, string> = { status: input.status };
      if (input.status === "decided") {
        const now = new Date().toISOString();
        updates.decided_at = now;
        updates.time_to_decide = formatDecisionDuration(input.createdAt, now);
      }
      if (input.status === "deferred" && input.deferredUntil) {
        updates.deferred_until = new Date(input.deferredUntil).toISOString();
      }
      const { error } = await supabase.from("decisions").update(updates).eq("id", input.id);
      if (error) throw new Error(error.message);
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEY, userId] });
      const prev = queryClient.getQueryData<DecisionRecord[]>([QUERY_KEY, userId]);
      if (prev) {
        queryClient.setQueryData<DecisionRecord[]>([QUERY_KEY, userId], (old = []) =>
          old.map((d) => {
            if (d.id !== input.id) return d;
            const next = { ...d, status: input.status };
            if (input.status === "decided") {
              const now = new Date().toISOString();
              next.decided_at = now;
              next.time_to_decide = formatDecisionDuration(input.createdAt, now);
            }
            if (input.status === "deferred" && input.deferredUntil) {
              next.deferred_until = new Date(input.deferredUntil).toISOString();
            }
            return next;
          }),
        );
      }
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData([QUERY_KEY, userId], ctx.prev);
    },
    onSettled: () => void invalidate(),
  });

  return {
    decisions: query.data ?? [],
    analytics,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    createMutation,
    updateStatusMutation,
  };
}
