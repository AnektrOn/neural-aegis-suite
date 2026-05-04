import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Filter,
  Plus,
  Trash2,
  Send,
  Eye,
  Download,
  X,
} from "lucide-react";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import type { TranslationKey } from "@/i18n/translations";
import type {
  AdminProfile,
  AdminMoodEntry,
  AdminHabitCompletion,
  AdminSession,
  AdminToolboxCompletion,
  AdminDailyScoreboard,
} from "@/lib/admin-types";
import { avgOrNull, getDayKey } from "@/lib/admin-helpers";

type MetricKey =
  | "avg_mood_14d"
  | "habit_rate_14d"
  | "days_since_login"
  | "session_count_14d"
  | "score_avg_14d"
  | "company_id"
  | "country"
  | "is_disabled"
  | "tool_abandoned_14d";

type NumericOperator = ">=" | "<=" | "=";
type EnumOperator = "=" | "!=";

interface FilterRow {
  id: string;
  metric: MetricKey;
  operator: NumericOperator | EnumOperator;
  value: string;
}

interface UserMetrics extends AdminProfile {
  email?: string | null;
  avg_mood_14d: number | null;
  habit_rate_14d: number;
  days_since_login: number;
  session_count_14d: number;
  score_avg_14d: number | null;
  tool_abandoned_14d: number;
}

const METRIC_META: Record<
  MetricKey,
  { kind: "numeric" | "string" | "enum"; step?: number; labelKey: TranslationKey }
> = {
  avg_mood_14d: { kind: "numeric", step: 0.1, labelKey: "admin.segmentation.metric.avg_mood_14d" },
  habit_rate_14d: { kind: "numeric", step: 1, labelKey: "admin.segmentation.metric.habit_rate_14d" },
  days_since_login: { kind: "numeric", step: 1, labelKey: "admin.segmentation.metric.days_since_login" },
  session_count_14d: { kind: "numeric", step: 1, labelKey: "admin.segmentation.metric.session_count_14d" },
  score_avg_14d: { kind: "numeric", step: 1, labelKey: "admin.segmentation.metric.score_avg_14d" },
  company_id: { kind: "enum", labelKey: "admin.segmentation.metric.company_id" },
  country: { kind: "string", labelKey: "admin.segmentation.metric.country" },
  is_disabled: { kind: "enum", labelKey: "admin.segmentation.metric.is_disabled" },
  tool_abandoned_14d: { kind: "numeric", step: 1, labelKey: "admin.segmentation.metric.tool_abandoned_14d" },
};

const COLORS = ["#22c55e", "#14b8a6", "#f59e0b", "#ef4444"];

function defaultFilter(): FilterRow {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    metric: "avg_mood_14d",
    operator: ">=",
    value: "",
  };
}

export default function AdminSegmentation() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<(AdminProfile & { email?: string | null })[]>([]);
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([]);
  const [moodEntries, setMoodEntries] = useState<Array<Pick<AdminMoodEntry, "user_id" | "value" | "logged_at">>>([]);
  const [habitCompletions, setHabitCompletions] = useState<Array<Pick<AdminHabitCompletion, "user_id" | "completed_date">>>([]);
  const [userSessions, setUserSessions] = useState<Array<Pick<AdminSession, "user_id" | "started_at">>>([]);
  const [toolboxCompletions, setToolboxCompletions] = useState<Array<Pick<AdminToolboxCompletion, "user_id" | "status" | "completed_at">>>([]);
  const [dailyScoreboards, setDailyScoreboards] = useState<Array<Pick<AdminDailyScoreboard, "user_id" | "total_score" | "max_score" | "score_date">>>([]);

  const [filters, setFilters] = useState<FilterRow[]>([defaultFilter()]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [singleRecipient, setSingleRecipient] = useState<string | null>(null);
  const [singleSubject, setSingleSubject] = useState("");
  const [singleBody, setSingleBody] = useState("");
  const [singleSending, setSingleSending] = useState(false);

  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkSubject, setBulkSubject] = useState("");
  const [bulkBody, setBulkBody] = useState("");
  const [bulkSending, setBulkSending] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ sent: 0, total: 0 });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const since = new Date();
      since.setDate(since.getDate() - 14);
      const sinceIso = since.toISOString();
      const sinceDay = sinceIso.slice(0, 10);

      const [pRes, cRes, moodRes, habRes, sessRes, tbRes, scoreRes] = await Promise.all([
        supabase.from("profiles").select("*"),
        supabase.from("companies" as never).select("id, name"),
        supabase
          .from("mood_entries" as never)
          .select("user_id, value, logged_at")
          .gte("logged_at", sinceIso),
        supabase
          .from("habit_completions" as never)
          .select("user_id, completed_date")
          .gte("completed_date", sinceDay),
        supabase
          .from("user_sessions" as never)
          .select("user_id, started_at")
          .gte("started_at", sinceIso),
        supabase
          .from("toolbox_completions" as never)
          .select("user_id, status, completed_at")
          .gte("completed_at", sinceIso),
        supabase
          .from("daily_scoreboards" as never)
          .select("user_id, total_score, max_score, score_date")
          .gte("score_date", sinceDay),
      ]);

      const err = [pRes.error, cRes.error, moodRes.error, habRes.error, sessRes.error, tbRes.error, scoreRes.error].find(Boolean);
      if (err) {
        toast({ title: t("toast.error"), description: (err as any).message, variant: "destructive" });
        setLoading(false);
        return;
      }

      setProfiles(((pRes.data || []) as any) || []);
      setCompanies(((cRes.data || []) as any) || []);
      setMoodEntries(((moodRes.data || []) as any) || []);
      setHabitCompletions(((habRes.data || []) as any) || []);
      setUserSessions(((sessRes.data || []) as any) || []);
      setToolboxCompletions(((tbRes.data || []) as any) || []);
      setDailyScoreboards(((scoreRes.data || []) as any) || []);
      setLoading(false);
    };
    load();
  }, [toast, t]);

  const userMetrics = useMemo(() => {
    const moodMap = new Map<string, number[]>();
    const habitDayMap = new Map<string, Set<string>>();
    const sessionMap = new Map<string, string[]>();
    const scoreMap = new Map<string, number[]>();
    const abandonedMap = new Map<string, number>();

    moodEntries.forEach((m) => {
      if (!moodMap.has(m.user_id)) moodMap.set(m.user_id, []);
      moodMap.get(m.user_id)!.push(m.value);
    });
    habitCompletions.forEach((h) => {
      const day = h.completed_date.length >= 10 ? h.completed_date.slice(0, 10) : getDayKey(h.completed_date);
      if (!habitDayMap.has(h.user_id)) habitDayMap.set(h.user_id, new Set());
      if (day) habitDayMap.get(h.user_id)!.add(day);
    });
    userSessions.forEach((s) => {
      if (!sessionMap.has(s.user_id)) sessionMap.set(s.user_id, []);
      sessionMap.get(s.user_id)!.push(s.started_at);
    });
    dailyScoreboards.forEach((s) => {
      if (!scoreMap.has(s.user_id)) scoreMap.set(s.user_id, []);
      const pct = s.max_score > 0 ? Math.round((s.total_score / s.max_score) * 100) : 0;
      scoreMap.get(s.user_id)!.push(pct);
    });
    toolboxCompletions.forEach((t) => {
      if (t.status !== "abandoned") return;
      abandonedMap.set(t.user_id, (abandonedMap.get(t.user_id) || 0) + 1);
    });

    return profiles.map((p) => {
      const moods = moodMap.get(p.id) || [];
      const habitDays = habitDayMap.get(p.id) || new Set<string>();
      const sessions = sessionMap.get(p.id) || [];
      const scores = scoreMap.get(p.id) || [];
      const sortedSessions = sessions.slice().sort(
        (a, b) => new Date(b).getTime() - new Date(a).getTime()
      );
      const lastSession = sortedSessions[0];
      const daysSinceLogin = lastSession
        ? Math.floor((Date.now() - new Date(lastSession).getTime()) / 86400000)
        : 999;

      return {
        ...(p as AdminProfile),
        email: (p as any).email || null,
        avg_mood_14d: avgOrNull(moods),
        habit_rate_14d: Math.round((habitDays.size / 14) * 100),
        days_since_login: daysSinceLogin,
        session_count_14d: sessions.length,
        score_avg_14d: scores.length ? avgOrNull(scores) : null,
        tool_abandoned_14d: abandonedMap.get(p.id) || 0,
      } as UserMetrics;
    });
  }, [profiles, moodEntries, habitCompletions, userSessions, dailyScoreboards, toolboxCompletions]);

  const companyNameById = useMemo(
    () => new Map(companies.map((c) => [c.id, c.name])),
    [companies]
  );

  const filteredUsers = useMemo(() => {
    const active = filters.filter((f) => String(f.value).trim() !== "");
    if (active.length === 0) return userMetrics;

    return userMetrics.filter((u) =>
      active.every((f) => {
        const metric = METRIC_META[f.metric];
        if (!metric) return true;
        const raw = (u as any)[f.metric];

        if (metric.kind === "numeric") {
          const n = Number(f.value);
          if (Number.isNaN(n) || raw == null) return false;
          if (f.operator === ">=") return raw >= n;
          if (f.operator === "<=") return raw <= n;
          return raw === n;
        }

        if (f.metric === "is_disabled") {
          const target = f.value === "true";
          return f.operator === "=" ? u.is_disabled === target : u.is_disabled !== target;
        }

        const left = String(raw || "").toLowerCase().trim();
        const right = String(f.value || "").toLowerCase().trim();
        return f.operator === "=" ? left === right : left !== right;
      })
    );
  }, [filters, userMetrics]);

  useEffect(() => {
    const ids = new Set(filteredUsers.map((u) => u.id));
    setSelectedIds((prev) => prev.filter((id) => ids.has(id)));
  }, [filteredUsers]);

  const filteredSet = useMemo(() => new Set(filteredUsers.map((u) => u.id)), [filteredUsers]);
  const allSelected = filteredUsers.length > 0 && filteredUsers.every((u) => selectedIds.includes(u.id));

  const scatterBase = useMemo(() => {
    const scores = userMetrics
      .map((u) => u.score_avg_14d)
      .filter((v): v is number => v != null)
      .sort((a, b) => a - b);
    const q1 = scores[Math.floor(scores.length * 0.25)] ?? 25;
    const q2 = scores[Math.floor(scores.length * 0.5)] ?? 50;
    const q3 = scores[Math.floor(scores.length * 0.75)] ?? 75;

    return userMetrics
      .filter((u) => u.avg_mood_14d != null && u.habit_rate_14d != null)
      .map((u) => {
        const score = u.score_avg_14d ?? 0;
        const color =
          score >= q3 ? COLORS[0] : score >= q2 ? COLORS[1] : score >= q1 ? COLORS[2] : COLORS[3];
        return {
          id: u.id,
          name: u.display_name || "Sans nom",
          company: u.company_id ? companyNameById.get(u.company_id) || "—" : "—",
          x: u.avg_mood_14d as number,
          y: u.habit_rate_14d,
          score,
          sessionSize: Math.min(12, Math.max(4, 4 + u.session_count_14d / 2)),
          color,
          matched: filteredSet.has(u.id),
        };
      });
  }, [userMetrics, filteredSet, companyNameById]);

  const excludedScatterCount = userMetrics.length - scatterBase.length;

  const addFilter = () => {
    setFilters((prev) => (prev.length >= 6 ? prev : [...prev, defaultFilter()]));
  };
  const removeFilter = (id: string) => {
    setFilters((prev) => prev.filter((f) => f.id !== id));
  };
  const updateFilter = (id: string, patch: Partial<FilterRow>) => {
    setFilters((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  };

  const openSingleMessage = (userId: string) => {
    setSingleRecipient(userId);
    setSingleSubject("");
    setSingleBody("");
  };

  const sendSingleMessage = async () => {
    if (!user || !singleRecipient || !singleSubject.trim() || !singleBody.trim()) return;
    setSingleSending(true);
    const { error } = await supabase.from("admin_messages" as never).insert({
      sender_id: user.id,
      recipient_id: singleRecipient,
      subject: singleSubject.trim(),
      body: singleBody.trim(),
    } as never);
    if (!error) {
      await supabase.from("notifications").insert({
        user_id: singleRecipient,
        title: "Message de l'admin",
        message: singleSubject.trim(),
        type: "message",
        link: "/profile",
      } as never);
      toast({ title: t("admin.segmentation.toastMessageSent"), description: t("admin.segmentation.toastMessageSentDesc") });
      setSingleRecipient(null);
    } else {
      toast({ title: t("toast.error"), description: error.message, variant: "destructive" });
    }
    setSingleSending(false);
  };

  const sendBulkMessage = async () => {
    if (!user || selectedIds.length === 0 || !bulkSubject.trim() || !bulkBody.trim()) return;
    setBulkSending(true);
    setBulkProgress({ sent: 0, total: selectedIds.length });
    let sent = 0;

    for (const recipient of selectedIds) {
      const { error } = await supabase.from("admin_messages" as never).insert({
        sender_id: user.id,
        recipient_id: recipient,
        subject: bulkSubject.trim(),
        body: bulkBody.trim(),
      } as never);
      if (!error) {
        await supabase.from("notifications").insert({
          user_id: recipient,
          title: "Message de l'admin",
          message: bulkSubject.trim(),
          type: "message",
          link: "/profile",
        } as never);
        sent += 1;
        setBulkProgress({ sent, total: selectedIds.length });
      }
    }

    setBulkSending(false);
    setBulkOpen(false);
    setBulkSubject("");
    setBulkBody("");
    toast({
      title: t("admin.segmentation.toastBulkDone"),
      description: t("admin.segmentation.toastBulkDoneDesc", { sent, total: selectedIds.length }),
    });
  };

  const exportCsv = () => {
    const rows = filteredUsers.filter((u) => selectedIds.includes(u.id));
    if (rows.length === 0) return;
    const head = [
      "name",
      "email",
      "company",
      "avg_mood_14d",
      "habit_rate_14d",
      "days_since_login",
      "score_avg_14d",
    ];
    const csv = [
      head.join(","),
      ...rows.map((u) =>
        [
          `"${(u.display_name || "").split('"').join('""')}"`,
          `"${(u.email || "").split('"').join('""')}"`,
          `"${(u.company_id ? companyNameById.get(u.company_id) || "" : "").split('"').join('""')}"`,
          u.avg_mood_14d ?? "",
          u.habit_rate_14d,
          u.days_since_login,
          u.score_avg_14d ?? "",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "segmentation-export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl">
      <div>
        <p className="text-neural-label mb-3 text-neural-accent/60">{t("users.administration")}</p>
        <h1 className="text-neural-title text-3xl text-foreground">{t("admin.segmentation.title")}</h1>
        <p className="text-sm text-muted-foreground mt-2">
          {t("admin.segmentation.subtitle")}
        </p>
      </div>

      <div className="ethereal-glass p-5 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-neural-label">{t("admin.segmentation.filterBuilder")}</p>
          <button
            type="button"
            onClick={addFilter}
            disabled={filters.length >= 6}
            className="inline-flex items-center gap-2 text-xs text-primary disabled:opacity-40"
          >
            <Plus size={12} />
            {t("admin.segmentation.addFilter")}
          </button>
        </div>

        <div className="space-y-2">
          {filters.map((f) => {
            const cfg = METRIC_META[f.metric];
            const operators = cfg.kind === "numeric" ? ([">=", "<=", "="] as const) : (["=", "!="] as const);
            return (
              <div key={f.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end">
                <div className="md:col-span-4">
                  <label className="text-neural-label block mb-1">{t("admin.segmentation.metric")}</label>
                  <select
                    value={f.metric}
                    onChange={(e) => {
                      const metric = e.target.value as MetricKey;
                      const kind = METRIC_META[metric]?.kind || "numeric";
                      updateFilter(f.id, {
                        metric,
                        operator: kind === "numeric" ? ">=" : "=",
                        value: "",
                      });
                    }}
                    className="w-full bg-secondary/20 border border-border/20 rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none"
                  >
                    {(Object.keys(METRIC_META) as MetricKey[]).map((m) => (
                      <option key={m} value={m}>
                        {t(METRIC_META[m].labelKey)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="text-neural-label block mb-1">{t("admin.segmentation.operator")}</label>
                  <select
                    value={f.operator}
                    onChange={(e) => updateFilter(f.id, { operator: e.target.value as any })}
                    className="w-full bg-secondary/20 border border-border/20 rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none"
                  >
                    {operators.map((op) => (
                      <option key={op} value={op}>
                        {op}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-5">
                  <label className="text-neural-label block mb-1">{t("admin.segmentation.value")}</label>
                  {f.metric === "company_id" ? (
                    <select
                      value={f.value}
                      onChange={(e) => updateFilter(f.id, { value: e.target.value })}
                      className="w-full bg-secondary/20 border border-border/20 rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none"
                    >
                      <option value="">{t("admin.segmentation.selectPlaceholder")}</option>
                      {companies.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  ) : f.metric === "is_disabled" ? (
                    <select
                      value={f.value}
                      onChange={(e) => updateFilter(f.id, { value: e.target.value })}
                      className="w-full bg-secondary/20 border border-border/20 rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none"
                    >
                      <option value="">{t("admin.segmentation.selectPlaceholder")}</option>
                      <option value="false">{t("admin.segmentation.accountActive")}</option>
                      <option value="true">{t("admin.segmentation.accountDisabled")}</option>
                    </select>
                  ) : f.metric === "country" ? (
                    <input
                      value={f.value}
                      onChange={(e) => updateFilter(f.id, { value: e.target.value })}
                      className="w-full bg-secondary/20 border border-border/20 rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none"
                    />
                  ) : (
                    <input
                      type="number"
                      step={METRIC_META[f.metric].step ?? 1}
                      value={f.value}
                      onChange={(e) => updateFilter(f.id, { value: e.target.value })}
                      className="w-full bg-secondary/20 border border-border/20 rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none"
                    />
                  )}
                </div>
                <div className="md:col-span-1">
                  <button
                    type="button"
                    onClick={() => removeFilter(f.id)}
                    className="w-full p-2 text-destructive/70 hover:text-destructive"
                    disabled={filters.length === 1}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-sm text-foreground">
          {t("admin.segmentation.usersMatch", { n: filteredUsers.length })}
        </p>
      </div>

      <div className="ethereal-glass p-5">
        <p className="text-neural-label mb-3 flex items-center gap-2">
          <Filter size={13} />
          {t("admin.segmentation.scatterTitle")}
        </p>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                type="number"
                dataKey="x"
                domain={[0, 10]}
                name={t("admin.segmentation.axisMood")}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }}
              />
              <YAxis
                type="number"
                dataKey="y"
                domain={[0, 100]}
                name={t("admin.segmentation.axisHabits")}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }}
              />
              <ZAxis type="number" dataKey="sessionSize" range={[4, 12]} />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const p = payload[0]?.payload as any;
                  return (
                    <div className="bg-card border border-border rounded-xl p-3 text-xs">
                      <p className="text-foreground font-medium">{p.name}</p>
                      <p className="text-muted-foreground">{p.company}</p>
                      <p className="text-muted-foreground mt-1">
                        {t("admin.segmentation.tooltipMood")} {p.x?.toFixed?.(1) ?? p.x}/10
                      </p>
                      <p className="text-muted-foreground">
                        {t("admin.segmentation.tooltipHabits")} {p.y}%
                      </p>
                      <p className="text-muted-foreground">{t("admin.segmentation.tooltipScore")} {p.score ?? "—"}%</p>
                    </div>
                  );
                }}
              />
              <Scatter
                data={scatterBase}
                shape={(props: any) => {
                  const p = props.payload;
                  return (
                    <circle
                      cx={props.cx}
                      cy={props.cy}
                      r={p.sessionSize}
                      fill={p.color}
                      fillOpacity={p.matched ? 0.95 : 0.2}
                      stroke={p.matched ? "hsl(var(--foreground))" : "none"}
                      strokeWidth={p.matched ? 0.5 : 0}
                    />
                  );
                }}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {t("admin.segmentation.excludedScatter", { n: excludedScatterCount })}
        </p>
      </div>

      <div className="ethereal-glass p-4 overflow-auto">
        <table className="w-full min-w-[920px] text-sm">
          <thead>
            <tr className="text-left border-b border-border/20">
              <th className="py-2 pr-2">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) =>
                    setSelectedIds(e.target.checked ? filteredUsers.map((u) => u.id) : [])
                  }
                  aria-label={t("admin.segmentation.selectAllAria")}
                />
              </th>
              <th className="py-2 pr-3 text-neural-label">{t("admin.segmentation.colName")}</th>
              <th className="py-2 pr-3 text-neural-label">{t("admin.segmentation.colCompany")}</th>
              <th className="py-2 pr-3 text-neural-label">{t("admin.segmentation.colAvgMood")}</th>
              <th className="py-2 pr-3 text-neural-label">{t("admin.segmentation.colHabitRate")}</th>
              <th className="py-2 pr-3 text-neural-label">{t("admin.segmentation.colLastLogin")}</th>
              <th className="py-2 pr-3 text-neural-label">{t("admin.segmentation.colScore")}</th>
              <th className="py-2 text-neural-label">{t("admin.segmentation.colActions")}</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => (
              <tr key={u.id} className="border-b border-border/10">
                <td className="py-2 pr-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(u.id)}
                    onChange={(e) =>
                      setSelectedIds((prev) =>
                        e.target.checked ? [...prev, u.id] : prev.filter((id) => id !== u.id)
                      )
                    }
                  />
                </td>
                <td className="py-2 pr-3 text-foreground">{u.display_name || t("users.noName")}</td>
                <td className="py-2 pr-3 text-muted-foreground">
                  {u.company_id ? companyNameById.get(u.company_id) || "—" : "—"}
                </td>
                <td className="py-2 pr-3">{u.avg_mood_14d != null ? `${u.avg_mood_14d}/10` : "—"}</td>
                <td className="py-2 pr-3">{u.habit_rate_14d}%</td>
                <td className="py-2 pr-3">
                  {u.days_since_login === 999 ? t("admin.segmentation.neverLogin") : t("admin.segmentation.daysAgoShort", { n: u.days_since_login })}
                </td>
                <td className="py-2 pr-3">{u.score_avg_14d != null ? `${u.score_avg_14d}%` : "—"}</td>
                <td className="py-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => openSingleMessage(u.id)}
                      className="px-2 py-1 text-xs rounded-lg border border-border/30 bg-secondary/20 hover:border-primary/30 inline-flex items-center gap-1"
                    >
                      <Send size={12} />
                      {t("admin.segmentation.message")}
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate("/admin/user-timeline", { state: { userId: u.id } })}
                      className="btn-neural text-xs px-2 py-1"
                    >
                      <Eye size={12} />
                      {t("admin.segmentation.view")}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedIds.length >= 1 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[min(96vw,860px)] z-40 ethereal-glass p-3 border border-primary/20">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm text-foreground">
              {t("admin.segmentation.selectedCount", { n: selectedIds.length })}
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setBulkOpen(true)} className="btn-neural text-xs">
                <Send size={12} />
                {t("admin.segmentation.bulkSend")}
              </button>
              <button
                type="button"
                onClick={exportCsv}
                className="px-3 py-2 text-xs rounded-xl border border-border/30 bg-secondary/20 hover:border-primary/30 inline-flex items-center gap-1"
              >
                <Download size={12} />
                {t("admin.segmentation.exportCsv")}
              </button>
            </div>
          </div>
        </div>
      )}

      {singleRecipient && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg ethereal-glass p-6 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-neural-title text-lg">{t("admin.segmentation.sendMessageTitle")}</p>
              <button onClick={() => setSingleRecipient(null)} className="text-muted-foreground hover:text-foreground">
                <X size={14} />
              </button>
            </div>
            <input
              value={singleSubject}
              onChange={(e) => setSingleSubject(e.target.value)}
              placeholder={t("admin.segmentation.subjectPlaceholder")}
              className="w-full bg-secondary/20 border border-border/20 rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none"
            />
            <textarea
              value={singleBody}
              onChange={(e) => setSingleBody(e.target.value)}
              rows={5}
              placeholder={t("admin.segmentation.bodyPlaceholder")}
              className="w-full bg-secondary/20 border border-border/20 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none resize-none"
            />
            <button onClick={sendSingleMessage} disabled={singleSending} className="btn-neural">
              <Send size={14} />
              {singleSending ? t("admin.segmentation.sending") : t("admin.segmentation.send")}
            </button>
          </div>
        </div>
      )}

      {bulkOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-xl ethereal-glass p-6 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-neural-title text-lg">{t("admin.segmentation.bulkTitle")}</p>
              <button onClick={() => setBulkOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X size={14} />
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("admin.segmentation.recipients")} {selectedIds.length}
              {bulkSending && ` · ${t("admin.segmentation.sentProgress", { sent: bulkProgress.sent, total: bulkProgress.total })}`}
            </p>
            <input
              value={bulkSubject}
              onChange={(e) => setBulkSubject(e.target.value)}
              placeholder={t("admin.segmentation.subjectPlaceholder")}
              className="w-full bg-secondary/20 border border-border/20 rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none"
            />
            <textarea
              value={bulkBody}
              onChange={(e) => setBulkBody(e.target.value)}
              rows={6}
              placeholder={t("admin.segmentation.bodyPlaceholder")}
              className="w-full bg-secondary/20 border border-border/20 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none resize-none"
            />
            <button onClick={sendBulkMessage} disabled={bulkSending} className="btn-neural">
              <Send size={14} />
              {bulkSending ? t("admin.segmentation.sentProgress", { sent: bulkProgress.sent, total: bulkProgress.total }) : t("admin.segmentation.send")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
