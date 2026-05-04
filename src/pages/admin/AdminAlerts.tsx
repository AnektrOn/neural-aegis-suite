import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Brain,
  WifiOff,
  Flame,
  Package,
  Clock,
  BookOpen,
  RefreshCw,
  MessageSquare,
  User,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { AlertSignal, AdminProfile } from "@/lib/admin-types";
import { getDayKey } from "@/lib/admin-helpers";
import { useLanguage } from "@/i18n/LanguageContext";
import type { TranslationKey } from "@/i18n/translations";

type TFn = (key: TranslationKey, params?: Record<string, string | number>) => string;

type SeverityFilter = "all" | "high" | "medium" | "low";

function utcDayKeyFromOffset(daysAgo: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  d.setUTCHours(12, 0, 0, 0);
  return getDayKey(d.toISOString());
}

function formatRelativeSince(iso: string, tr: TFn): string {
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return "—";
  const diffMs = Date.now() - ts;
  const days = Math.floor(diffMs / (86400 * 1000));
  if (days <= 0) return tr("admin.alerts.relative.today");
  if (days === 1) return tr("admin.alerts.relative.sinceYesterday");
  return tr("admin.alerts.relative.sinceDays", { n: days });
}

function daysSince(iso: string | null): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.floor((Date.now() - t) / (86400 * 1000));
}

function sortAlerts(a: AlertSignal, b: AlertSignal): number {
  const rank = (s: AlertSignal["severity"]) =>
    s === "high" ? 0 : s === "medium" ? 1 : 2;
  const dr = rank(a.severity) - rank(b.severity);
  if (dr !== 0) return dr;
  return new Date(b.since).getTime() - new Date(a.since).getTime();
}

function computeAlerts(
  profiles: AdminProfile[],
  moodRows: { user_id: string; value: number; logged_at: string }[],
  sessionRows: { user_id: string; started_at: string }[],
  habitRows: { user_id: string; completed_date: string }[],
  journalLast14: { user_id: string; created_at: string }[],
  journalEverUserIds: Set<string>,
  decisionRows: { user_id: string; status: string; created_at: string }[],
  toolboxRows: { user_id: string; assignment_id: string; status: string; completed_at: string }[],
  assignmentTitleById: Map<string, string>,
  companyNameById: Map<string, string>,
  now: Date,
  tr: TFn
): AlertSignal[] {
  const sevenAgo = new Date(now);
  sevenAgo.setUTCDate(sevenAgo.getUTCDate() - 7);
  const fourteenAgo = new Date(now);
  fourteenAgo.setUTCDate(fourteenAgo.getUTCDate() - 14);
  const tenDaysAgo = new Date(now);
  tenDaysAgo.setUTCDate(tenDaysAgo.getUTCDate() - 10);

  const lastSessionByUser = new Map<string, string>();
  sessionRows.forEach((s) => {
    const cur = lastSessionByUser.get(s.user_id);
    if (!cur || new Date(s.started_at) > new Date(cur)) {
      lastSessionByUser.set(s.user_id, s.started_at);
    }
  });

  const moodByUser = new Map<string, typeof moodRows>();
  moodRows.forEach((m) => {
    if (!moodByUser.has(m.user_id)) moodByUser.set(m.user_id, []);
    moodByUser.get(m.user_id)!.push(m);
  });
  moodByUser.forEach((arr) => arr.sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime()));

  const habitByUser = new Map<string, Set<string>>();
  habitRows.forEach((h) => {
    const day = h.completed_date.length >= 10 ? h.completed_date.slice(0, 10) : getDayKey(h.completed_date);
    if (!day) return;
    if (!habitByUser.has(h.user_id)) habitByUser.set(h.user_id, new Set());
    habitByUser.get(h.user_id)!.add(day);
  });

  const journal14ByUser = new Map<string, typeof journalLast14>();
  journalLast14.forEach((j) => {
    if (!journal14ByUser.has(j.user_id)) journal14ByUser.set(j.user_id, []);
    journal14ByUser.get(j.user_id)!.push(j);
  });

  const decisionsByUser = new Map<string, typeof decisionRows>();
  decisionRows.forEach((d) => {
    if (!decisionsByUser.has(d.user_id)) decisionsByUser.set(d.user_id, []);
    decisionsByUser.get(d.user_id)!.push(d);
  });

  const toolboxByUser = new Map<string, typeof toolboxRows>();
  toolboxRows.forEach((t) => {
    if (!toolboxByUser.has(t.user_id)) toolboxByUser.set(t.user_id, []);
    toolboxByUser.get(t.user_id)!.push(t);
  });

  const alerts: AlertSignal[] = [];

  for (const p of profiles) {
    if (p.is_disabled) continue;

    const userName = p.display_name?.trim() || tr("users.noName");
    const companyName = p.company_id ? companyNameById.get(p.company_id) ?? null : null;

    const moods = moodByUser.get(p.id) || [];
    const inLast7 = moods.filter((m) => new Date(m.logged_at) >= sevenAgo);
    const inPrev7 = moods.filter((m) => {
      const t = new Date(m.logged_at).getTime();
      return t >= fourteenAgo.getTime() && t < sevenAgo.getTime();
    });

    if (inLast7.length >= 3) {
      const last3 = inLast7.slice(0, 3);
      const avgLast3 = last3.reduce((s, x) => s + x.value, 0) / 3;
      if (avgLast3 < 6) {
        const prevAvg =
          inPrev7.length > 0
            ? Math.round((inPrev7.reduce((s, x) => s + x.value, 0) / inPrev7.length) * 10) / 10
            : null;
        const yStr = prevAvg != null ? String(prevAvg) : "—";
        const severity: AlertSignal["severity"] = avgLast3 < 4 ? "high" : "medium";
        const rounded = Math.round(avgLast3 * 10) / 10;
        alerts.push({
          userId: p.id,
          userName,
          companyName,
          type: "mood_drop",
          severity,
          detail: tr("admin.alerts.detail.moodDrop", { current: rounded, prev: yStr }),
          since: last3[0]!.logged_at,
        });
      }
    }

    const lastS = lastSessionByUser.get(p.id);
    const idleMs = lastS != null ? now.getTime() - new Date(lastS).getTime() : null;
    const over4d = idleMs != null && idleMs > 4 * 86400000;
    const over7d = idleMs != null && idleMs > 7 * 86400000;
    const noLogin = lastS == null || over4d;

    if (noLogin) {
      let severity: AlertSignal["severity"];
      let detail: string;
      let sinceIso: string;
      if (lastS == null) {
        severity = "high";
        detail = tr("admin.alerts.detail.neverLoggedIn");
        sinceIso = p.created_at;
      } else {
        const daysIdle = daysSince(lastS);
        severity = over7d ? "high" : "medium";
        detail = tr("admin.alerts.detail.lastLoginDays", { n: daysIdle == null ? 0 : daysIdle });
        sinceIso = lastS;
      }
      alerts.push({
        userId: p.id,
        userName,
        companyName,
        type: "no_login",
        severity,
        detail,
        since: sinceIso,
      });
    }

    const habitDays = habitByUser.get(p.id) || new Set();
    const last3Keys = [utcDayKeyFromOffset(0), utcDayKeyFromOffset(1), utcDayKeyFromOffset(2)];
    const gapLast3 = last3Keys.every((k) => !habitDays.has(k));
    if (gapLast3) {
      let streak = 0;
      for (let i = 3; i <= 13; i++) {
        const k = utcDayKeyFromOffset(i);
        if (habitDays.has(k)) streak++;
        else break;
      }
      if (streak >= 5) {
        alerts.push({
          userId: p.id,
          userName,
          companyName,
          type: "habit_streak_broken",
          severity: "medium",
          detail: tr("admin.alerts.detail.habitStreakBroken", { streak }),
          since: new Date(now.getTime() - 3 * 86400000).toISOString(),
        });
      }
    }

    const tb = toolboxByUser.get(p.id) || [];
    const abandonedByAssign = new Map<string, typeof tb>();
    tb.filter((x) => x.status === "abandoned").forEach((x) => {
      if (!abandonedByAssign.has(x.assignment_id)) abandonedByAssign.set(x.assignment_id, []);
      abandonedByAssign.get(x.assignment_id)!.push(x);
    });
    abandonedByAssign.forEach((rows, assignmentId) => {
      if (rows.length >= 2) {
        rows.sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime());
        const title = assignmentTitleById.get(assignmentId) || tr("admin.timeline.toolDefault");
        alerts.push({
          userId: p.id,
          userName,
          companyName,
          type: "tool_abandoned_twice",
          severity: "medium",
          detail: tr("admin.alerts.detail.toolAbandonedTwice", { title }),
          since: rows[0]!.completed_at,
        });
      }
    });

    const userDecisions = decisionsByUser.get(p.id) || [];
    const stalePending = userDecisions.filter(
      (d) => d.status === "pending" && new Date(d.created_at) < tenDaysAgo
    );
    if (stalePending.length >= 1) {
      stalePending.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      alerts.push({
        userId: p.id,
        userName,
        companyName,
        type: "decision_stale",
        severity: "low",
        detail: tr("admin.alerts.detail.decisionStale", { n: stalePending.length }),
        since: stalePending[0]!.created_at,
      });
    }

    const hadJournalEver = journalEverUserIds.has(p.id);
    const journals14 = journal14ByUser.get(p.id) || [];
    if (hadJournalEver && journals14.length === 0) {
      alerts.push({
        userId: p.id,
        userName,
        companyName,
        type: "no_journal",
        severity: "low",
        detail: tr("admin.alerts.detail.noJournal"),
        since: fourteenAgo.toISOString(),
      });
    }
  }

  alerts.sort(sortAlerts);
  return alerts;
}

const ALERT_ICONS = {
  mood_drop: Brain,
  no_login: WifiOff,
  habit_streak_broken: Flame,
  tool_abandoned_twice: Package,
  decision_stale: Clock,
  no_journal: BookOpen,
} as const;

export default function AdminAlerts() {
  useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<AlertSignal[]>([]);
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [profileCompanyMap, setProfileCompanyMap] = useState<Map<string, string | null>>(new Map());
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");
  const [companyFilter, setCompanyFilter] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const now = new Date();
    const iso14 = new Date(now);
    iso14.setUTCDate(iso14.getUTCDate() - 14);
    const iso45 = new Date(now);
    iso45.setUTCDate(iso45.getUTCDate() - 45);
    const iso365 = new Date(now);
    iso365.setUTCDate(iso365.getUTCDate() - 365);

    try {
      const [
        profRes,
        moodRes,
        sessRes,
        habRes,
        je14Res,
        jeEverRes,
        decRes,
        tbRes,
        compRes,
        tbAssignRes,
      ] = await Promise.all([
        supabase.from("profiles").select("id, display_name, company_id, country, is_disabled, created_at, timezone"),
        supabase
          .from("mood_entries" as never)
          .select("user_id, value, logged_at")
          .gte("logged_at", iso14.toISOString()),
        supabase
          .from("user_sessions" as never)
          .select("user_id, started_at")
          .gte("started_at", iso365.toISOString()),
        supabase
          .from("habit_completions" as never)
          .select("user_id, completed_date")
          .gte("completed_date", iso14.toISOString().slice(0, 10)),
        supabase
          .from("journal_entries")
          .select("user_id, created_at")
          .gte("created_at", iso14.toISOString()),
        supabase.from("journal_entries").select("user_id").limit(8000),
        supabase
          .from("decisions" as never)
          .select("user_id, status, created_at")
          .gte("created_at", iso45.toISOString()),
        supabase
          .from("toolbox_completions" as never)
          .select("user_id, assignment_id, status, completed_at")
          .gte("completed_at", iso14.toISOString()),
        supabase.from("companies" as never).select("id, name"),
        supabase.from("toolbox_assignments" as never).select("id, title"),
      ]);

      const errs = [
        profRes.error,
        moodRes.error,
        sessRes.error,
        habRes.error,
        je14Res.error,
        jeEverRes.error,
        decRes.error,
        tbRes.error,
        compRes.error,
        tbAssignRes.error,
      ].filter(Boolean);
      if (errs.length) {
        console.error(errs);
        toast.error(t("admin.alerts.loadError"));
        setLoading(false);
        return;
      }

      const profiles = (profRes.data || []) as AdminProfile[];
      const companyRows = (compRes.data || []) as { id: string; name: string }[];
      const companyNameById = new Map(companyRows.map((c) => [c.id, c.name]));

      const journalEverSet = new Set<string>();
      ((jeEverRes.data || []) as { user_id: string }[]).forEach((r) => journalEverSet.add(r.user_id));

      const assignmentTitleById = new Map<string, string>();
      ((tbAssignRes.data || []) as { id: string; title: string }[]).forEach((a) =>
        assignmentTitleById.set(a.id, a.title || "?")
      );

      const computed = computeAlerts(
        profiles,
        (moodRes.data || []) as { user_id: string; value: number; logged_at: string }[],
        (sessRes.data || []) as { user_id: string; started_at: string }[],
        (habRes.data || []) as { user_id: string; completed_date: string }[],
        (je14Res.data || []) as { user_id: string; created_at: string }[],
        journalEverSet,
        (decRes.data || []) as { user_id: string; status: string; created_at: string }[],
        (tbRes.data || []) as { user_id: string; assignment_id: string; status: string; completed_at: string }[],
        assignmentTitleById,
        companyNameById,
        now,
        t
      );

      const pcMap = new Map<string, string | null>();
      profiles.forEach((pr) => pcMap.set(pr.id, pr.company_id));

      setCompanies(companyRows);
      setProfileCompanyMap(pcMap);
      setAlerts(computed);
    } catch (e) {
      console.error(e);
      toast.error(t("admin.alerts.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      if (severityFilter !== "all" && a.severity !== severityFilter) return false;
      if (companyFilter) {
        const cid = profileCompanyMap.get(a.userId);
        if (cid !== companyFilter) return false;
      }
      return true;
    });
  }, [alerts, severityFilter, companyFilter, profileCompanyMap]);

  const kpi = useMemo(() => {
    const base = alerts.filter((a) => {
      if (companyFilter) {
        const cid = profileCompanyMap.get(a.userId);
        if (cid !== companyFilter) return false;
      }
      return true;
    });
    return {
      high: base.filter((x) => x.severity === "high").length,
      medium: base.filter((x) => x.severity === "medium").length,
      low: base.filter((x) => x.severity === "low").length,
    };
  }, [alerts, companyFilter, profileCompanyMap]);

  const grouped = useMemo(() => {
    const high = filteredAlerts.filter((a) => a.severity === "high");
    const medium = filteredAlerts.filter((a) => a.severity === "medium");
    const low = filteredAlerts.filter((a) => a.severity === "low");
    return { high, medium, low };
  }, [filteredAlerts]);

  const openMessages = (userId: string) => {
    navigate("/admin/messages", { state: { adminComposeUserId: userId } });
  };

  const openAnalytics = (userId: string) => {
    navigate("/admin/analytics", { state: { adminAnalyticsUserId: userId } });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const severityStyles = {
    high: {
      dot: "bg-destructive",
      card: "border-destructive/20 bg-destructive/10",
      text: "text-destructive",
    },
    medium: {
      dot: "bg-neural-warm",
      card: "border-neural-warm/20 bg-neural-warm/10",
      text: "text-neural-warm",
    },
    low: {
      dot: "bg-muted-foreground",
      card: "border-border/30 bg-secondary/20",
      text: "text-muted-foreground",
    },
  } as const;

  const renderSection = (title: string, items: AlertSignal[], sev: keyof typeof severityStyles) => {
    if (items.length === 0) return null;
    const st = severityStyles[sev];
    return (
      <div className="space-y-3">
        <p className={`text-neural-label text-xs uppercase tracking-[0.2em] ${st.text}`}>{title}</p>
        <div className="space-y-2">
          {items.map((a, i) => {
            const Icon = ALERT_ICONS[a.type];
            return (
              <motion.div
                key={`${a.userId}-${a.type}-${a.since}-${i}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className={`ethereal-glass p-4 flex flex-col sm:flex-row sm:items-center gap-4 border ${st.card}`}
              >
                <div className="flex items-start gap-3 shrink-0">
                  <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${st.dot}`} />
                  <div
                    className={`w-10 h-10 rounded-xl border flex items-center justify-center ${st.card} ${st.text}`}
                  >
                    <Icon size={18} strokeWidth={1.5} className={a.type === "habit_streak_broken" ? "opacity-50" : ""} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <span className="text-sm font-medium text-foreground">{a.userName}</span>
                    {a.companyName && (
                      <span className="text-xs text-muted-foreground">· {a.companyName}</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{a.detail}</p>
                  <p className="text-[11px] text-neural-label text-neural-accent/50 mt-1">
                    {formatRelativeSince(a.since, t)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => openMessages(a.userId)}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs border border-border/30 bg-secondary/20 text-foreground hover:border-primary/30 transition-colors"
                  >
                    <MessageSquare size={14} />
                    {t("admin.alerts.sendMessage")}
                  </button>
                  <button type="button" onClick={() => openAnalytics(a.userId)} className="btn-neural text-xs py-2 px-3">
                    <User size={14} />
                    {t("admin.alerts.viewProfile")}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <p className="text-neural-label mb-3 text-neural-accent/60">{t("users.administration")}</p>
          <h1 className="text-neural-title text-2xl sm:text-3xl text-foreground">{t("admin.alerts.pageTitle")}</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-xl">
            {t("admin.alerts.pageSubtitle")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => load()}
          disabled={loading}
          className="inline-flex items-center gap-2 self-start px-4 py-2 rounded-xl text-xs uppercase tracking-wider border border-border/30 bg-secondary/20 text-foreground hover:border-primary/30 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          {t("admin.alerts.refresh")}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="ethereal-glass px-4 py-2 border border-destructive/20 bg-destructive/10">
          <span className="text-neural-label text-[10px] text-destructive/80">{t("admin.alerts.sevLabelHigh")}</span>
          <p className="font-cinzel text-xl text-destructive tabular-nums">{kpi.high}</p>
        </div>
        <div className="ethereal-glass px-4 py-2 border border-neural-warm/20 bg-neural-warm/10">
          <span className="text-neural-label text-[10px] text-neural-warm/90">{t("admin.alerts.sevLabelMedium")}</span>
          <p className="font-cinzel text-xl text-neural-warm tabular-nums">{kpi.medium}</p>
        </div>
        <div className="ethereal-glass px-4 py-2 border border-border/30 bg-secondary/20">
          <span className="text-neural-label text-[10px] text-muted-foreground">{t("admin.alerts.sevLabelLow")}</span>
          <p className="font-cinzel text-xl text-muted-foreground tabular-nums">{kpi.low}</p>
        </div>
      </div>

      <div className="ethereal-glass p-4 flex flex-wrap gap-3">
        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: "all" as const, label: t("admin.alerts.filterAll") },
              { id: "high" as const, label: t("admin.alerts.filterHigh") },
              { id: "medium" as const, label: t("admin.alerts.filterMedium") },
              { id: "low" as const, label: t("admin.alerts.filterLow") },
            ] as const
          ).map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setSeverityFilter(id)}
              className={`text-[10px] uppercase tracking-[0.2em] px-3 py-2 rounded-full border transition-all ${
                severityFilter === id
                  ? "text-neural-accent border-neural-accent/30 bg-neural-accent/5"
                  : "text-muted-foreground border-border hover:border-muted-foreground/30"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <select
          value={companyFilter}
          onChange={(e) => setCompanyFilter(e.target.value)}
          className="bg-secondary/20 border border-border/20 rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/30 min-w-[200px]"
        >
          <option value="">{t("admin.alerts.allCompanies")}</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {filteredAlerts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="ethereal-glass p-16 text-center border border-primary/15"
        >
          <CheckCircle2 className="mx-auto mb-4 text-primary" size={40} strokeWidth={1.25} />
          <p className="text-neural-title text-lg text-foreground">{t("admin.alerts.emptyState")}</p>
        </motion.div>
      ) : (
        <div className="space-y-10">
          {renderSection(t("admin.alerts.sevLabelHigh"), grouped.high, "high")}
          {renderSection(t("admin.alerts.sevLabelMedium"), grouped.medium, "medium")}
          {renderSection(t("admin.alerts.sevLabelLow"), grouped.low, "low")}
        </div>
      )}
    </div>
  );
}
