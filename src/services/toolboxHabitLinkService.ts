import { supabase } from "@/integrations/supabase/client";

export interface ToolboxHabitLink {
  assigned_habit_id: string;
  toolbox_assignment_id: string;
  is_active: boolean;
}

type RpcResult = { ok: boolean; error?: string };

export async function fetchToolboxHabitLinks(userId: string): Promise<ToolboxHabitLink[]> {
  try {
    const { data, error } = await supabase
      .from("assigned_habits" as never)
      .select("id, toolbox_assignment_id, is_active")
      .eq("user_id", userId)
      .not("toolbox_assignment_id", "is", null);
    if (error) {
      console.error("fetchToolboxHabitLinks:", error.message);
      return [];
    }
    return ((data as { id: string; toolbox_assignment_id: string; is_active: boolean }[]) ?? [])
      .filter((row) => row.toolbox_assignment_id)
      .map((row) => ({
        assigned_habit_id: row.id,
        toolbox_assignment_id: row.toolbox_assignment_id,
        is_active: row.is_active,
      }));
  } catch (err) {
    console.error("fetchToolboxHabitLinks:", err);
    return [];
  }
}

export async function addToolboxToHabits(toolboxAssignmentId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.rpc("add_toolbox_assignment_to_habits" as never, {
      p_toolbox_assignment_id: toolboxAssignmentId,
    } as never);
    if (error) {
      console.error("addToolboxToHabits:", error.message);
      return { ok: false, error: error.message };
    }
    const res = data as RpcResult;
    if (!res?.ok) return { ok: false, error: res?.error ?? "unknown" };
    return { ok: true };
  } catch (err) {
    console.error("addToolboxToHabits:", err);
    return { ok: false, error: err instanceof Error ? err.message : "unknown" };
  }
}

export async function removeToolboxFromHabits(toolboxAssignmentId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.rpc("remove_toolbox_assignment_from_habits" as never, {
      p_toolbox_assignment_id: toolboxAssignmentId,
    } as never);
    if (error) {
      console.error("removeToolboxFromHabits:", error.message);
      return { ok: false, error: error.message };
    }
    const res = data as RpcResult;
    if (!res?.ok) return { ok: false, error: res?.error ?? "unknown" };
    return { ok: true };
  } catch (err) {
    console.error("removeToolboxFromHabits:", err);
    return { ok: false, error: err instanceof Error ? err.message : "unknown" };
  }
}
