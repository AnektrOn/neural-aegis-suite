import { supabase } from "@/integrations/supabase/client";

export type AlertSeverity = "critical" | "high" | "medium" | "low";

export type AlertType =
  | "low_mood_streak"
  | "no_log"
  | "high_shadow"
  | "pending_decisions"
  | "no_relations"
  | "score_drop"
  | string;

export interface AdminAlert {
  id: string;
  user_id: string;
  alert_type: AlertType;
  severity: AlertSeverity;
  title_fr: string;
  title_en: string;
  detail: Record<string, unknown>;
  is_resolved: boolean;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_note: string | null;
  created_at: string;
}

export interface AlertRule {
  id: string;
  rule_key: string;
  is_active: boolean;
  severity: AlertSeverity;
  threshold_value: number | null;
  threshold_days: number | null;
  description_fr: string | null;
  description_en: string | null;
}

export interface AlertFilters {
  severity?: AlertSeverity;
  userId?: string;
  companyId?: string;
  alertType?: AlertType;
  includeResolved?: boolean;
}

/** Triggers the scan-alerts edge function. Optional userId scopes the scan. */
export async function runAlertScan(
  userId?: string,
): Promise<{ scanned: number; created: number }> {
  const { data, error } = await supabase.functions.invoke("scan-alerts", {
    body: userId ? { userId } : {},
  });
  if (error) throw error;
  return (data ?? { scanned: 0, created: 0 }) as {
    scanned: number;
    created: number;
  };
}

export async function resolveAlert(
  alertId: string,
  note?: string,
): Promise<void> {
  const { data: userRes } = await supabase.auth.getUser();
  const uid = userRes.user?.id ?? null;
  const { error } = await supabase
    .from("admin_alerts" as never)
    .update({
      is_resolved: true,
      resolved_at: new Date().toISOString(),
      resolved_by: uid,
      resolution_note: note ?? null,
    } as never)
    .eq("id", alertId);
  if (error) throw error;
}

export async function getActiveAlerts(
  filters: AlertFilters = {},
): Promise<AdminAlert[]> {
  let query = supabase
    .from("admin_alerts" as never)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  if (!filters.includeResolved) query = query.eq("is_resolved", false);
  if (filters.severity) query = query.eq("severity", filters.severity);
  if (filters.alertType) query = query.eq("alert_type", filters.alertType);
  if (filters.userId) query = query.eq("user_id", filters.userId);

  const { data, error } = await query;
  if (error) throw error;
  let rows = (data ?? []) as unknown as AdminAlert[];

  if (filters.companyId) {
    const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
    if (userIds.length === 0) return [];
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, company_id")
      .in("id", userIds);
    const allowed = new Set(
      (profs ?? [])
        .filter((p) => p.company_id === filters.companyId)
        .map((p) => p.id),
    );
    rows = rows.filter((r) => allowed.has(r.user_id));
  }
  return rows;
}

export async function getAlertHistory(userId: string): Promise<AdminAlert[]> {
  const { data, error } = await supabase
    .from("admin_alerts" as never)
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as AdminAlert[];
}

export async function getAlertRules(): Promise<AlertRule[]> {
  const { data, error } = await supabase
    .from("alert_rules" as never)
    .select("*")
    .order("rule_key");
  if (error) throw error;
  return (data ?? []) as unknown as AlertRule[];
}

export async function getActiveAlertCountsByUser(
  userIds: string[],
): Promise<Map<string, { critical: number; high: number; medium: number; low: number; total: number }>> {
  const map = new Map<
    string,
    { critical: number; high: number; medium: number; low: number; total: number }
  >();
  if (userIds.length === 0) return map;
  const { data, error } = await supabase
    .from("admin_alerts" as never)
    .select("user_id, severity")
    .eq("is_resolved", false)
    .in("user_id", userIds);
  if (error) throw error;
  ((data ?? []) as unknown as { user_id: string; severity: AlertSeverity }[]).forEach(
    (r) => {
      const cur =
        map.get(r.user_id) ?? {
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          total: 0,
        };
      if (r.severity in cur) {
        // @ts-expect-error indexed
        cur[r.severity] += 1;
      }
      cur.total += 1;
      map.set(r.user_id, cur);
    },
  );
  return map;
}
