import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  FREE_DAILY_GLOBAL_PULSE,
  FREE_DAILY_GLOBAL_TOOLBOX,
} from "@/lib/soloPlanQuotas";

export type FreemiumDailyBudget = {
  isPaid: boolean;
  pulseUsed: number;
  pulseLimit: number;
  pulseRemaining: number | null;
  toolboxUsed: number;
  toolboxLimit: number;
  toolboxRemaining: number | null;
};

const emptyBudget: FreemiumDailyBudget = {
  isPaid: false,
  pulseUsed: 0,
  pulseLimit: FREE_DAILY_GLOBAL_PULSE,
  pulseRemaining: FREE_DAILY_GLOBAL_PULSE,
  toolboxUsed: 0,
  toolboxLimit: FREE_DAILY_GLOBAL_TOOLBOX,
  toolboxRemaining: FREE_DAILY_GLOBAL_TOOLBOX,
};

function mapRow(data: Record<string, unknown> | null): FreemiumDailyBudget | null {
  if (!data || data.ok !== true) return null;
  const isPaid = Boolean(data.is_paid);
  return {
    isPaid,
    pulseUsed: Number(data.pulse_global_used ?? 0),
    pulseLimit: Number(data.pulse_global_limit ?? FREE_DAILY_GLOBAL_PULSE),
    pulseRemaining: isPaid
      ? null
      : Number(data.pulse_global_remaining ?? FREE_DAILY_GLOBAL_PULSE),
    toolboxUsed: Number(data.toolbox_global_used ?? 0),
    toolboxLimit: Number(data.toolbox_global_limit ?? FREE_DAILY_GLOBAL_TOOLBOX),
    toolboxRemaining: isPaid
      ? null
      : Number(data.toolbox_global_remaining ?? FREE_DAILY_GLOBAL_TOOLBOX),
  };
}

export function useFreemiumDailyBudget() {
  const { user } = useAuth();
  const [budget, setBudget] = useState<FreemiumDailyBudget>(emptyBudget);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setBudget(emptyBudget);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_freemium_daily_budget" as never);
      if (error) {
        console.error("get_freemium_daily_budget:", error.message);
        return;
      }
      const mapped = mapRow(data as Record<string, unknown> | null);
      if (mapped) setBudget(mapped);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { budget, loading, refresh };
}

export async function startToolboxGlobalSession(assignmentId: string): Promise<{
  ok: boolean;
  error?: string;
}> {
  const { data, error } = await supabase.rpc("record_toolbox_global_session_start" as never, {
    p_assignment_id: assignmentId,
  } as never);
  if (error) {
    return { ok: false, error: error.message };
  }
  const row = data as { ok?: boolean; error?: string } | null;
  if (!row?.ok) {
    return { ok: false, error: row?.error ?? "unknown" };
  }
  return { ok: true };
}

export function isFreemiumQuotaError(error?: string | null): boolean {
  return error === "freemium_quota_exceeded";
}