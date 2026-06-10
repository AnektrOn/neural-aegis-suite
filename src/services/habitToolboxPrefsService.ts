import { supabase } from "@/integrations/supabase/client";

export async function setHabitDurationOverride(
  assignmentId: string,
  durationMin: number | null,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.rpc("set_habit_duration_override" as never, {
      p_assignment_id: assignmentId,
      p_duration_min: durationMin,
    } as never);

    if (error) {
      console.error("[habitToolboxPrefs] set_habit_duration_override:", error.message);
      return { ok: false, error: error.message };
    }

    const result = data as { ok?: boolean; error?: string } | null;
    if (!result?.ok) {
      return { ok: false, error: result?.error ?? "unknown_error" };
    }

    return { ok: true };
  } catch (err) {
    console.error("[habitToolboxPrefs] critical error:", err);
    return { ok: false, error: "unexpected_error" };
  }
}
