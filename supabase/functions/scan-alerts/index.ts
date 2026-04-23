import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RuleRow {
  rule_key: string;
  is_active: boolean;
  severity: string;
  threshold_value: number | null;
  threshold_days: number | null;
}

interface ProfileRow {
  id: string;
  is_disabled: boolean;
}

interface AlertInsert {
  user_id: string;
  alert_type: string;
  severity: string;
  title_fr: string;
  title_en: string;
  detail: Record<string, unknown>;
}

const TITLES: Record<string, { fr: string; en: string }> = {
  low_mood_streak: { fr: "Humeur en chute prolongée", en: "Sustained low mood" },
  no_log: { fr: "Aucun log récent", en: "No recent logs" },
  high_shadow: { fr: "Forte intensité d'ombre", en: "High shadow intensity" },
  pending_decisions: { fr: "Décisions en attente", en: "Pending decisions" },
  no_relations: { fr: "Aucune relation loggée", en: "No relations logged" },
  score_drop: { fr: "Chute du score AEGIS", en: "AEGIS score drop" },
};

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const sb = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  let targetUserId: string | null = null;
  try {
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      if (typeof body?.userId === "string") targetUserId = body.userId;
    }
  } catch {
    // ignore
  }

  const now = new Date();
  const since24h = new Date(now.getTime() - 24 * 3600 * 1000).toISOString();

  // Load active rules
  const { data: rulesData, error: rulesErr } = await sb
    .from("alert_rules")
    .select("rule_key, is_active, severity, threshold_value, threshold_days")
    .eq("is_active", true);
  if (rulesErr) {
    return new Response(JSON.stringify({ error: rulesErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const rules = new Map<string, RuleRow>();
  ((rulesData || []) as RuleRow[]).forEach((r) => rules.set(r.rule_key, r));

  // Load profiles
  let profQuery = sb.from("profiles").select("id, is_disabled");
  if (targetUserId) profQuery = profQuery.eq("id", targetUserId);
  const { data: profilesData, error: profErr } = await profQuery;
  if (profErr) {
    return new Response(JSON.stringify({ error: profErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const profiles = ((profilesData || []) as ProfileRow[]).filter(
    (p) => !p.is_disabled,
  );
  const userIds = profiles.map((p) => p.id);

  if (userIds.length === 0) {
    return new Response(JSON.stringify({ scanned: 0, created: 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const since30d = new Date(now.getTime() - 30 * 86400000).toISOString();

  // Bulk-fetch signals
  const [moodsRes, sessionsRes, decisionsRes, relationsRes, scoresRes, recentAlertsRes] =
    await Promise.all([
      sb
        .from("mood_entries")
        .select("user_id, value, logged_at")
        .in("user_id", userIds)
        .gte("logged_at", since30d),
      sb
        .from("user_sessions")
        .select("user_id, started_at")
        .in("user_id", userIds)
        .gte("started_at", since30d),
      sb
        .from("decisions")
        .select("user_id, status, created_at")
        .in("user_id", userIds),
      sb
        .from("relation_quality_history")
        .select("user_id, recorded_at")
        .in("user_id", userIds)
        .gte("recorded_at", since30d),
      sb
        .from("aegis_health_scores")
        .select("user_id, overall_score, score_date")
        .in("user_id", userIds)
        .gte("score_date", dayKey(new Date(now.getTime() - 10 * 86400000))),
      sb
        .from("admin_alerts")
        .select("user_id, alert_type, created_at, is_resolved")
        .in("user_id", userIds)
        .gte("created_at", since24h),
    ]);

  const moods = (moodsRes.data || []) as Array<{
    user_id: string;
    value: number;
    logged_at: string;
  }>;
  const sessions = (sessionsRes.data || []) as Array<{
    user_id: string;
    started_at: string;
  }>;
  const decisions = (decisionsRes.data || []) as Array<{
    user_id: string;
    status: string;
    created_at: string;
  }>;
  const relations = (relationsRes.data || []) as Array<{
    user_id: string;
    recorded_at: string;
  }>;
  const scores = (scoresRes.data || []) as Array<{
    user_id: string;
    overall_score: number;
    score_date: string;
  }>;
  const recentAlerts = (recentAlertsRes.data || []) as Array<{
    user_id: string;
    alert_type: string;
    created_at: string;
  }>;

  const recentAlertSet = new Set(
    recentAlerts.map((a) => `${a.user_id}::${a.alert_type}`),
  );

  const toInsert: AlertInsert[] = [];

  function pushAlert(
    userId: string,
    type: string,
    rule: RuleRow,
    detail: Record<string, unknown>,
  ) {
    const key = `${userId}::${type}`;
    if (recentAlertSet.has(key)) return;
    recentAlertSet.add(key);
    const t = TITLES[type] || { fr: type, en: type };
    toInsert.push({
      user_id: userId,
      alert_type: type,
      severity: rule.severity,
      title_fr: t.fr,
      title_en: t.en,
      detail,
    });
  }

  for (const p of profiles) {
    const uid = p.id;

    // 1) low_mood_streak
    const r1 = rules.get("low_mood_streak");
    if (r1) {
      const days = r1.threshold_days ?? 3;
      const threshold = Number(r1.threshold_value ?? 4);
      const byDay = new Map<string, number[]>();
      moods
        .filter((m) => m.user_id === uid)
        .forEach((m) => {
          const k = dayKey(new Date(m.logged_at));
          if (!byDay.has(k)) byDay.set(k, []);
          byDay.get(k)!.push(m.value);
        });
      let streak = 0;
      let avgs: number[] = [];
      for (let i = 0; i < days; i++) {
        const k = dayKey(new Date(now.getTime() - i * 86400000));
        const arr = byDay.get(k);
        if (!arr || arr.length === 0) {
          streak = 0;
          break;
        }
        const avg = arr.reduce((s, v) => s + v, 0) / arr.length;
        if (avg < threshold) {
          streak++;
          avgs.push(Math.round(avg * 10) / 10);
        } else {
          streak = 0;
          break;
        }
      }
      if (streak >= days) {
        pushAlert(uid, "low_mood_streak", r1, {
          days: streak,
          threshold,
          recent_avgs: avgs,
        });
      }
    }

    // 2) no_log
    const r2 = rules.get("no_log");
    if (r2) {
      const days = r2.threshold_days ?? 5;
      const cutoff = now.getTime() - days * 86400000;
      const hasMood = moods.some(
        (m) => m.user_id === uid && new Date(m.logged_at).getTime() >= cutoff,
      );
      const hasSession = sessions.some(
        (s) =>
          s.user_id === uid && new Date(s.started_at).getTime() >= cutoff,
      );
      const hasRelation = relations.some(
        (rr) =>
          rr.user_id === uid && new Date(rr.recorded_at).getTime() >= cutoff,
      );
      if (!hasMood && !hasSession && !hasRelation) {
        pushAlert(uid, "no_log", r2, { days });
      }
    }

    // 4) pending_decisions
    const r4 = rules.get("pending_decisions");
    if (r4) {
      const days = r4.threshold_days ?? 7;
      const cutoff = now.getTime() - days * 86400000;
      const stale = decisions.filter(
        (d) =>
          d.user_id === uid &&
          d.status === "pending" &&
          new Date(d.created_at).getTime() < cutoff,
      );
      if (stale.length > 0) {
        pushAlert(uid, "pending_decisions", r4, {
          count: stale.length,
          days,
        });
      }
    }

    // 5) no_relations
    const r5 = rules.get("no_relations");
    if (r5) {
      const days = r5.threshold_days ?? 14;
      const cutoff = now.getTime() - days * 86400000;
      const hasAny = relations.some(
        (rr) =>
          rr.user_id === uid && new Date(rr.recorded_at).getTime() >= cutoff,
      );
      if (!hasAny) {
        pushAlert(uid, "no_relations", r5, { days });
      }
    }

    // 6) score_drop
    const r6 = rules.get("score_drop");
    if (r6) {
      const drop = Number(r6.threshold_value ?? 20);
      const days = r6.threshold_days ?? 3;
      const userScores = scores
        .filter((s) => s.user_id === uid)
        .sort((a, b) => a.score_date.localeCompare(b.score_date));
      if (userScores.length >= 2) {
        const last = userScores[userScores.length - 1];
        const lastDate = new Date(last.score_date).getTime();
        const baseline = userScores
          .filter(
            (s) =>
              new Date(s.score_date).getTime() <=
              lastDate - days * 86400000 + 86400000,
          )
          .pop();
        if (baseline) {
          const delta = baseline.overall_score - last.overall_score;
          if (delta >= drop) {
            pushAlert(uid, "score_drop", r6, {
              from: baseline.overall_score,
              to: last.overall_score,
              delta: Math.round(delta * 10) / 10,
              days,
            });
          }
        }
      }
    }
    // high_shadow rule: skipped here unless shadow signal source is wired
  }

  let created = 0;
  if (toInsert.length > 0) {
    const { error: insErr, count } = await sb
      .from("admin_alerts")
      .insert(toInsert, { count: "exact" });
    if (insErr) {
      return new Response(JSON.stringify({ error: insErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    created = count ?? toInsert.length;
  }

  return new Response(
    JSON.stringify({ scanned: profiles.length, created }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
