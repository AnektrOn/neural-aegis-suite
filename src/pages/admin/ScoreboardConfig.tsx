import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Trophy, Save, Check, X } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import type { TranslationKey } from "@/i18n/translations";

const CRITERIA_TYPE_VALUES = [
  "mood_above",
  "habits_completed",
  "journal_written",
  "sleep_above",
  "stress_below",
  "decision_made",
  "toolbox_completed",
  "relation_updated",
] as const;

const CRITERIA_TYPE_LABEL_KEY: Record<(typeof CRITERIA_TYPE_VALUES)[number], TranslationKey> = {
  mood_above: "admin.scoreboard.criteria.mood_above",
  habits_completed: "admin.scoreboard.criteria.habits_completed",
  journal_written: "admin.scoreboard.criteria.journal_written",
  sleep_above: "admin.scoreboard.criteria.sleep_above",
  stress_below: "admin.scoreboard.criteria.stress_below",
  decision_made: "admin.scoreboard.criteria.decision_made",
  toolbox_completed: "admin.scoreboard.criteria.toolbox_completed",
  relation_updated: "admin.scoreboard.criteria.relation_updated",
};

interface Criteria {
  id?: string;
  criteria_type: string;
  criteria_label: string;
  target_value: number;
  points: number;
  is_active: boolean;
}

interface UserProfile {
  id: string;
  display_name: string | null;
}

export default function ScoreboardConfig() {
  const COLORS = [
    "hsl(180, 70%, 50%)",
    "hsl(270, 50%, 55%)",
    "hsl(35, 80%, 55%)",
    "hsl(120, 40%, 50%)",
    "hsl(0, 70%, 50%)",
    "hsl(220, 70%, 60%)",
  ];
  const { user } = useAuth();
  const { t, locale } = useLanguage();
  const dateLocaleTag = locale === "fr" ? "fr-FR" : "en-US";
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [criteria, setCriteria] = useState<Criteria[]>([]);
  const [scoreHistory, setScoreHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const removedIds = useRef<string[]>([]);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (selectedUser) loadCriteria(selectedUser);
  }, [selectedUser]);

  useEffect(() => {
    if (!selectedUser) return;
    const loadScoreHistory = async () => {
      const { data } = await supabase
        .from("daily_scoreboards" as any)
        .select("score_date, total_score, max_score, breakdown")
        .eq("user_id", selectedUser)
        .order("score_date", { ascending: false })
        .limit(14);
      setScoreHistory((data as any[]) || []);
    };
    loadScoreHistory();
  }, [selectedUser]);

  const loadUsers = async () => {
    const { data } = await supabase.from("profiles").select("id, display_name");
    if (data) {
      setUsers(data as any);
      if (data.length > 0) setSelectedUser((data[0] as any).id);
    }
    setLoading(false);
  };

  const loadCriteria = async (userId: string) => {
    const { data } = await supabase
      .from("scoreboard_criteria" as any)
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    removedIds.current = [];
    setCriteria((data as any[]) || []);
  };

  const addCriteria = () => {
    setCriteria(prev => [...prev, {
      criteria_type: "mood_above",
      criteria_label: t("admin.scoreboard.defaultNewLabel"),
      target_value: 7,
      points: 2,
      is_active: true,
    }]);
  };

  const removeCriteria = (index: number) => {
    const item = criteria[index];
    if (item.id) {
      removedIds.current.push(item.id);
    }
    setCriteria(prev => prev.filter((_, i) => i !== index));
  };

  const updateCriteria = (index: number, field: keyof Criteria, value: any) => {
    setCriteria(prev => prev.map((c, i) => i === index ? { ...c, [field]: value } : c));
  };

  const saveCriteria = async () => {
    if (!user || !selectedUser) return;
    setSaving(true);
    const existing = criteria.filter((c) => c.id);
    const news = criteria.filter((c) => !c.id);

    const ops: Promise<any>[] = [
      ...(removedIds.current.length > 0
        ? [(supabase.from("scoreboard_criteria" as any).delete().in("id", removedIds.current) as any).then(() => {})]
        : []),
      ...existing.map((c) =>
        (supabase
          .from("scoreboard_criteria" as any)
          .update({
            criteria_type: c.criteria_type,
            criteria_label: c.criteria_label,
            target_value: c.target_value,
            points: c.points,
            is_active: c.is_active,
          } as any)
          .eq("id", c.id as string) as any).then(() => {})
      ),
      ...(news.length > 0
        ? [
            (supabase.from("scoreboard_criteria" as any).insert(
              news.map((c) => ({
                user_id: selectedUser,
                criteria_type: c.criteria_type,
                criteria_label: c.criteria_label,
                target_value: c.target_value,
                points: c.points,
                is_active: c.is_active,
                created_by: user.id,
              })) as any
            ) as any).then(() => {}),
          ]
        : []),
    ];

    const results = await Promise.all(ops);
    const firstErr = results.find((r: any) => r?.error)?.error;
    if (firstErr) {
      toast({ title: t("toast.error"), description: firstErr.message, variant: "destructive" });
      setSaving(false);
      return;
    }
    removedIds.current = [];

    toast({
      title: t("admin.scoreboard.saveToastTitle"),
      description: t("admin.scoreboard.saveToastDesc", { n: criteria.length }),
    });
    setSaving(false);
    loadCriteria(selectedUser);
  };

  const totalPoints = criteria.filter(c => c.is_active).reduce((s, c) => s + c.points, 0);
  const maxPreview = criteria.filter((c) => c.is_active).reduce((s, c) => s + c.points, 0);
  const activeCount = criteria.filter((c) => c.is_active).length;

  if (loading) return <div className="flex items-center justify-center p-20"><div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <p className="text-neural-label mb-3 text-neural-accent/60">{t("users.administration")}</p>
        <h1 className="text-neural-title text-2xl sm:text-3xl text-foreground flex items-center gap-3">
          <Trophy size={24} className="text-primary" />
          {t("admin.scoreboard.pageTitle")}
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          {t("admin.scoreboard.pageSubtitle")}
        </p>
      </div>

      {/* User selector */}
      <div className="ethereal-glass p-6">
        <label className="text-neural-label block mb-2">{t("admin.scoreboard.selectUser")}</label>
        <select
          value={selectedUser}
          onChange={e => setSelectedUser(e.target.value)}
          className="w-full bg-secondary/20 border border-border/20 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary/30 transition-colors"
        >
          {users.map(u => (
            <option key={u.id} value={u.id}>{u.display_name || u.id.slice(0, 8)}</option>
          ))}
        </select>
      </div>

      {/* Criteria list */}
      <div className="space-y-3">
        {criteria.map((c, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="ethereal-glass p-5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-3">
                <label className="text-neural-label block mb-1">{t("admin.scoreboard.typeLabel")}</label>
                <select
                  value={c.criteria_type}
                  onChange={e => updateCriteria(i, "criteria_type", e.target.value)}
                  className="w-full bg-secondary/20 border border-border/20 rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none"
                >
                  {CRITERIA_TYPE_VALUES.map((ct) => (
                    <option key={ct} value={ct}>{t(CRITERIA_TYPE_LABEL_KEY[ct])}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-3">
                <label className="text-neural-label block mb-1">{t("admin.scoreboard.labelField")}</label>
                <input
                  value={c.criteria_label}
                  onChange={e => updateCriteria(i, "criteria_label", e.target.value)}
                  className="w-full bg-secondary/20 border border-border/20 rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-neural-label block mb-1">{t("admin.scoreboard.threshold")}</label>
                <input
                  type="number"
                  value={c.target_value}
                  onChange={e => updateCriteria(i, "target_value", Number(e.target.value))}
                  className="w-full bg-secondary/20 border border-border/20 rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-neural-label block mb-1">{t("admin.scoreboard.points")}</label>
                <input
                  type="number"
                  value={c.points}
                  onChange={e => updateCriteria(i, "points", Number(e.target.value))}
                  className="w-full bg-secondary/20 border border-border/20 rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none"
                />
              </div>
              <div className="sm:col-span-1 flex items-center justify-center">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={c.is_active}
                    onChange={e => updateCriteria(i, "is_active", e.target.checked)}
                    className="accent-primary"
                  />
                  <span className="text-[9px] text-muted-foreground">{t("admin.scoreboard.active")}</span>
                </label>
              </div>
              <div className="sm:col-span-1 flex justify-end">
                <button onClick={() => removeCriteria(i)} className="p-2 text-destructive/60 hover:text-destructive transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="ethereal-glass p-5">
        <p className="text-neural-label mb-2">{t("admin.scoreboard.previewMax")}</p>
        <p className="text-sm text-foreground">
          {t("admin.scoreboard.previewIfAllMet")}{" "}
          <span className="font-cinzel text-primary">{maxPreview} pts</span>{" "}
          <span className="text-muted-foreground">{t("admin.scoreboard.activeCriteria", { n: activeCount })}</span>
        </p>
        <div className="mt-3 h-2 rounded-full bg-secondary/20 overflow-hidden flex">
          {criteria.filter((c) => c.is_active && c.points > 0).map((c, idx) => (
            <div
              key={`${c.id || idx}-${c.criteria_label}`}
              className="h-full"
              style={{
                width: `${maxPreview > 0 ? (c.points / maxPreview) * 100 : 0}%`,
                background: COLORS[idx % COLORS.length],
              }}
              title={`${c.criteria_label}: ${c.points} pts`}
            />
          ))}
        </div>
      </div>

      <div className="ethereal-glass p-6">
        <p className="text-neural-label mb-4">{t("admin.scoreboard.historyTitle")}</p>
        {scoreHistory.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("admin.scoreboard.noHistory")}</p>
        ) : (
          <div className="space-y-5">
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={scoreHistory
                    .slice()
                    .reverse()
                    .map((s: any) => ({
                      date: new Date(s.score_date).toLocaleDateString(dateLocaleTag, {
                        day: "2-digit",
                        month: "2-digit",
                      }),
                      total: s.total_score,
                      max: s.max_score,
                      pct: s.max_score ? Math.round((s.total_score / s.max_score) * 100) : 0,
                    }))}
                >
                  <defs>
                    <linearGradient id="scorePctFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }} />
                  <Tooltip
                    formatter={(value: any, _name: any, payload: any) => {
                      const p = payload?.payload;
                      return `${p?.total}/${p?.max} pts (${value}%)`;
                    }}
                    labelFormatter={(label: any) => String(label)}
                  />
                  <Area type="monotone" dataKey="pct" stroke="hsl(var(--primary))" fill="url(#scorePctFill)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {(() => {
              const latest = scoreHistory[0] as any;
              const breakdown = Array.isArray(latest?.breakdown) ? latest.breakdown : [];
              return (
                <div>
                  <p className="text-neural-label mb-2">
                    {t("admin.scoreboard.lastDay")}{" "}
                    {latest?.score_date
                      ? new Date(latest.score_date).toLocaleDateString(dateLocaleTag)
                      : "—"}
                  </p>
                  <div className="space-y-1.5">
                    {breakdown.length === 0 ? (
                      <p className="text-xs text-muted-foreground">{t("admin.scoreboard.noBreakdown")}</p>
                    ) : (
                      breakdown.map((b: any, idx: number) => (
                        <div key={`${b.criteria_id || idx}`} className="flex items-center justify-between text-xs bg-secondary/20 rounded-lg px-3 py-2">
                          <div className="flex items-center gap-2">
                            {b.met ? <Check size={12} className="text-primary" /> : <X size={12} className="text-destructive" />}
                            <span className="text-foreground">{b.label}</span>
                          </div>
                          <span className="text-muted-foreground">
                            {b.earned}/{b.max} pts
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <button onClick={addCriteria} className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors">
          <Plus size={14} /> {t("common.addCriterion")}
        </button>
        <div className="flex items-center gap-4">
          <span className="text-neural-label">{t("admin.scoreboard.scoreMaxLabel")} <strong className="text-foreground">{totalPoints} pts</strong></span>
          <button onClick={saveCriteria} disabled={saving} className="btn-neural">
            <Save size={14} />
            {saving ? t("general.saving") : t("general.save")}
          </button>
        </div>
      </div>
    </div>
  );
}
