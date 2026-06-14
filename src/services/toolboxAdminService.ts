import { supabase } from "@/integrations/supabase/client";
import { pickLocalizedText } from "@/lib/content-i18n";
import { logProgramEvent } from "@/services/programBuilderService";

export type ToolboxTrackingBucket =
  | "completed"
  | "ignored"
  | "missed"
  | "reused"
  | "dropped"
  | "routine"
  | "pending";

export type ToolboxCompletionStatus = "none" | "completed" | "ignored" | "abandoned";

export interface ToolboxAdminAssignment {
  id: string;
  user_id: string;
  user_name?: string;
  content_type: string;
  title: string;
  title_i18n?: unknown;
  description?: string | null;
  description_i18n?: unknown;
  duration: string | null;
  assigned_at: string;
  external_url: string | null;
  widget_config: Record<string, unknown> | null;
  user_delivery_status: string;
  template_id?: string | null;
}

export interface ToolboxCompletionRow {
  assignment_id: string;
  status: string;
  completed_at: string | null;
  elapsed_sec: number | null;
  completion_count?: number | null;
}

export interface ToolboxTrackingRow extends ToolboxAdminAssignment {
  completion: ToolboxCompletionRow | null;
  habitLinkActive: boolean;
  habitCompletionCount: number;
  trackingBucket: ToolboxTrackingBucket;
  canResend: boolean;
  completionStatus: ToolboxCompletionStatus;
  daysSinceAssigned: number;
  daysSinceLastAction: number | null;
  lastActionAt: string | null;
  progressPercent: number;
}

const MISSED_AFTER_DAYS = 7;

const BUCKET_PROGRESS: Record<ToolboxTrackingBucket, number> = {
  completed: 100,
  reused: 100,
  routine: 70,
  ignored: 20,
  dropped: 35,
  missed: 0,
  pending: 10,
};

function daysBetween(fromIso: string, toMs = Date.now()): number {
  return Math.max(0, Math.floor((toMs - new Date(fromIso).getTime()) / 86400000));
}

export function deriveToolboxTrackingBucket(input: {
  user_delivery_status: string;
  assigned_at: string;
  completion: ToolboxCompletionRow | null;
  habitLinkActive: boolean;
  habitCompletionCount: number;
}): ToolboxTrackingBucket {
  const { completion, habitLinkActive, habitCompletionCount, user_delivery_status, assigned_at } = input;

  if (completion?.status === "completed") {
    if (habitLinkActive && habitCompletionCount >= 2) return "reused";
    if ((completion.completion_count ?? 1) >= 2) return "reused";
    return "completed";
  }
  if (completion?.status === "ignored") return "ignored";
  if (completion?.status === "abandoned") return "dropped";
  if (habitLinkActive) return "routine";

  const days = daysBetween(assigned_at);
  const isPublished = user_delivery_status === "active" || user_delivery_status === "assigned";
  if (!completion && isPublished && days >= MISSED_AFTER_DAYS) return "missed";

  return "pending";
}

export function buildToolboxTrackingRow(
  assignment: ToolboxAdminAssignment,
  completion: ToolboxCompletionRow | null,
  habitLinkActive: boolean,
  habitCompletionCount: number,
  userName?: string,
): ToolboxTrackingRow {
  const trackingBucket = deriveToolboxTrackingBucket({
    user_delivery_status: assignment.user_delivery_status,
    assigned_at: assignment.assigned_at,
    completion,
    habitLinkActive,
    habitCompletionCount,
  });

  const completionStatus: ToolboxCompletionStatus = completion
    ? (completion.status as ToolboxCompletionStatus)
    : "none";

  const lastActionAt = completion?.completed_at ?? null;
  const daysSinceAssigned = daysBetween(assignment.assigned_at);
  const daysSinceLastAction = lastActionAt ? daysBetween(lastActionAt) : null;

  let progressPercent = BUCKET_PROGRESS[trackingBucket];
  if (trackingBucket === "routine" && habitCompletionCount > 0) {
    progressPercent = Math.min(95, 50 + habitCompletionCount * 8);
  }
  if (trackingBucket === "pending" && daysSinceAssigned > 0) {
    progressPercent = Math.min(25, 5 + daysSinceAssigned * 2);
  }

  const row: ToolboxTrackingRow = {
    ...assignment,
    user_name: userName,
    completion,
    habitLinkActive,
    habitCompletionCount,
    trackingBucket,
    completionStatus,
    daysSinceAssigned,
    daysSinceLastAction,
    lastActionAt,
    progressPercent,
    canResend: false,
  };
  row.canResend = canResendToolboxRow(row);
  return row;
}

export function canResendToolboxRow(row: ToolboxTrackingRow): boolean {
  return (
    row.trackingBucket === "missed" ||
    row.trackingBucket === "ignored" ||
    row.trackingBucket === "dropped" ||
    row.trackingBucket === "pending"
  );
}

export async function notifyUserToolboxAssignment(userId: string, title: string) {
  try {
    const { error } = await supabase.functions.invoke("send-email-notification", {
      body: {
        type: "new_assignment",
        user_id: userId,
        data: { title, message: title },
      },
    });
    if (error) console.error("[toolboxAdmin] notify failed:", error.message);
  } catch (err) {
    console.error("[toolboxAdmin] notify unexpected:", err);
  }
}

export async function publishWaitingAssignment(params: {
  assignmentId: string;
  actorId: string;
  title: string;
  userId: string;
}) {
  const { assignmentId, actorId, title, userId } = params;
  const { error } = await supabase
    .from("toolbox_assignments" as never)
    .update({ user_delivery_status: "active" } as never)
    .eq("id", assignmentId)
    .eq("user_delivery_status", "waiting");

  if (error) throw error;

  await logProgramEvent({
    actor_id: actorId,
    user_id: userId,
    entity_type: "toolbox_assignment",
    entity_id: assignmentId,
    event_type: "published",
    metadata: { title },
  });

  await notifyUserToolboxAssignment(userId, title);
}

export async function publishWaitingAssignments(params: {
  assignmentIds: string[];
  actorId: string;
  assignments: Pick<ToolboxAdminAssignment, "id" | "user_id" | "title" | "title_i18n">[];
}) {
  const byId = new Map(params.assignments.map((a) => [a.id, a]));
  let published = 0;
  for (const id of params.assignmentIds) {
    const row = byId.get(id);
    if (!row) continue;
    const title = pickLocalizedText("fr", row.title_i18n, row.title);
    await publishWaitingAssignment({
      assignmentId: id,
      actorId: params.actorId,
      title,
      userId: row.user_id,
    });
    published += 1;
  }
  return published;
}

export async function resendToolboxAssignment(params: {
  assignmentId: string;
  actorId: string;
  userId: string;
  title: string;
}) {
  const { assignmentId, actorId, userId, title } = params;

  await supabase.from("toolbox_completions" as never).delete().eq("assignment_id", assignmentId);

  const { error } = await supabase
    .from("toolbox_assignments" as never)
    .update({ user_delivery_status: "active" } as never)
    .eq("id", assignmentId);

  if (error) throw error;

  await logProgramEvent({
    actor_id: actorId,
    user_id: userId,
    entity_type: "toolbox_assignment",
    entity_id: assignmentId,
    event_type: "resent",
    metadata: { title },
  });

  await notifyUserToolboxAssignment(userId, title);
}

export async function loadToolboxAdminProfiles() {
  const { data, error } = await supabase.from("profiles").select("id, display_name").order("display_name");
  if (error) throw error;
  return (data || []) as Array<{ id: string; display_name: string | null }>;
}

export async function loadWaitingAssignments(): Promise<ToolboxAdminAssignment[]> {
  const [assignRes, profiles] = await Promise.all([
    supabase
      .from("toolbox_assignments" as never)
      .select("*")
      .eq("user_delivery_status", "waiting")
      .order("assigned_at", { ascending: false }),
    loadToolboxAdminProfiles(),
  ]);

  if (assignRes.error) throw assignRes.error;

  return ((assignRes.data || []) as ToolboxAdminAssignment[]).map((a) => ({
    ...a,
    user_name: profiles.find((p) => p.id === a.user_id)?.display_name || undefined,
  }));
}

export async function loadActiveAssignmentsByUser(): Promise<ToolboxAdminAssignment[]> {
  const [assignRes, profiles] = await Promise.all([
    supabase
      .from("toolbox_assignments" as never)
      .select("*")
      .in("user_delivery_status", ["active", "assigned"])
      .order("assigned_at", { ascending: false }),
    loadToolboxAdminProfiles(),
  ]);

  if (assignRes.error) throw assignRes.error;

  return ((assignRes.data || []) as ToolboxAdminAssignment[]).map((a) => ({
    ...a,
    user_name: profiles.find((p) => p.id === a.user_id)?.display_name || undefined,
  }));
}

export async function loadToolboxTrackingRows(): Promise<ToolboxTrackingRow[]> {
  const [assignRes, completionsRes, habitsRes, habitCompletionsRes, profiles] = await Promise.all([
    supabase
      .from("toolbox_assignments" as never)
      .select("*")
      .neq("user_delivery_status", "inactive")
      .order("assigned_at", { ascending: false }),
    supabase.from("toolbox_completions" as never).select("*"),
    supabase
      .from("assigned_habits" as never)
      .select("id, user_id, toolbox_assignment_id, is_active"),
    supabase.from("habit_completions" as never).select("assigned_habit_id"),
    loadToolboxAdminProfiles(),
  ]);

  if (assignRes.error) throw assignRes.error;
  if (completionsRes.error) throw completionsRes.error;
  if (habitsRes.error) throw habitsRes.error;
  if (habitCompletionsRes.error) throw habitCompletionsRes.error;

  const completionByAssignment = new Map(
    ((completionsRes.data || []) as ToolboxCompletionRow[]).map((c) => [c.assignment_id, c]),
  );

  const habitByToolbox = new Map<string, { id: string; is_active: boolean }>();
  for (const h of (habitsRes.data || []) as Array<{
    id: string;
    toolbox_assignment_id: string | null;
    is_active: boolean;
  }>) {
    if (h.toolbox_assignment_id) {
      habitByToolbox.set(h.toolbox_assignment_id, { id: h.id, is_active: h.is_active });
    }
  }

  const habitCompletionCounts = new Map<string, number>();
  for (const hc of (habitCompletionsRes.data || []) as Array<{ assigned_habit_id: string }>) {
    habitCompletionCounts.set(
      hc.assigned_habit_id,
      (habitCompletionCounts.get(hc.assigned_habit_id) ?? 0) + 1,
    );
  }

  return ((assignRes.data || []) as ToolboxAdminAssignment[])
    .filter((a) => a.user_delivery_status !== "waiting")
    .map((a) => {
      const completion = completionByAssignment.get(a.id) ?? null;
      const habit = habitByToolbox.get(a.id);
      const habitLinkActive = Boolean(habit?.is_active);
      const habitCompletionCount = habit ? habitCompletionCounts.get(habit.id) ?? 0 : 0;
      return buildToolboxTrackingRow(
        a,
        completion,
        habitLinkActive,
        habitCompletionCount,
        profiles.find((p) => p.id === a.user_id)?.display_name || undefined,
      );
    });
}
