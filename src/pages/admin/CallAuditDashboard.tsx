import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Phone,
  Search,
  Plus,
  X,
  Save,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";

interface Profile {
  id: string;
  display_name: string | null;
}

interface AuditCall {
  id: string;
  user_id: string;
  call_date: string | null;
  leadership_score: number | null;
  emotional_baseline: number | null;
  decision_style: string | null;
  key_challenges: string | null;
  goals: string | null;
  notes: string | null;
  created_at: string;
}

export default function CallAuditDashboard() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [audits, setAudits] = useState<AuditCall[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [expandedAudit, setExpandedAudit] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [expandedUserMood, setExpandedUserMood] = useState<Record<string, any[]>>({});
  const [expandedUserHabits, setExpandedUserHabits] = useState<Record<string, any[]>>({});
  const [expandedLoading, setExpandedLoading] = useState<Record<string, boolean>>({});
  const [form, setForm] = useState({
    leadership_score: 5,
    emotional_baseline: 5,
    decision_style: "",
    key_challenges: "",
    goals: "",
    notes: "",
    call_date: new Date().toISOString().split("T")[0],
  });
  const todayIso = new Date().toISOString().split("T")[0];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [profilesRes, auditsRes] = await Promise.all([
      supabase.from("profiles").select("id, display_name"),
      supabase.from("audit_calls" as any).select("*").order("call_date", { ascending: false }),
    ]);
    if (profilesRes.data) setProfiles(profilesRes.data);
    if (auditsRes.data) setAudits(auditsRes.data as any);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !user) return;

    const { error } = await supabase.from("audit_calls" as any).insert({
      user_id: selectedUserId,
      conducted_by: user.id,
      leadership_score: form.leadership_score,
      emotional_baseline: form.emotional_baseline,
      decision_style: form.decision_style || null,
      key_challenges: form.key_challenges || null,
      goals: form.goals || null,
      notes: form.notes || null,
      call_date: form.call_date || null,
    } as any);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Audit Recorded", description: "First audit call has been logged." });
      setShowForm(false);
      setForm({
        leadership_score: 5,
        emotional_baseline: 5,
        decision_style: "",
        key_challenges: "",
        goals: "",
        notes: "",
        call_date: new Date().toISOString().split("T")[0],
      });
      loadData();
    }
  };

  const getProfileName = (id: string) => profiles.find((p) => p.id === id)?.display_name || "Unknown";

  const filteredAudits = audits.filter((a) => {
    const q = search.toLowerCase();
    return (
      getProfileName(a.user_id).toLowerCase().includes(q) ||
      (a.decision_style || "").toLowerCase().includes(q) ||
      (a.key_challenges || "").toLowerCase().includes(q)
    );
  });

  const loadExpandedData = async (userId: string) => {
    if (expandedUserMood[userId] && expandedUserHabits[userId]) return;
    setExpandedLoading((prev) => ({ ...prev, [userId]: true }));
    const [moodRes, habitRes] = await Promise.all([
      supabase
        .from("mood_entries" as any)
        .select("value, logged_at")
        .eq("user_id", userId)
        .order("logged_at", { ascending: true }),
      supabase
        .from("habit_completions" as any)
        .select("completed_date")
        .eq("user_id", userId)
        .order("completed_date", { ascending: true }),
    ]);
    setExpandedUserMood((prev) => ({ ...prev, [userId]: (moodRes.data || []) as any[] }));
    setExpandedUserHabits((prev) => ({ ...prev, [userId]: (habitRes.data || []) as any[] }));
    setExpandedLoading((prev) => ({ ...prev, [userId]: false }));
  };

  return (
    <div className="space-y-8 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <p className="text-neural-label mb-3 text-neural-accent/60">Administration</p>
          <h1 className="text-neural-title text-2xl sm:text-3xl text-foreground">Call Audit Dashboard</h1>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-neural shrink-0">
          {showForm ? <><X size={14} /> Cancel</> : <><Plus size={14} /> New Audit</>}
        </button>
      </div>

      {/* New Audit Form */}
      {showForm && (
        <motion.form
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="ethereal-glass p-8 space-y-6"
          style={{ borderColor: "hsla(270, 50%, 55%, 0.15)" }}
        >
          <p className="text-neural-label text-neural-accent/60">Record First Audit Call</p>

          {/* User selection */}
          <div>
            <label className="text-neural-label block mb-2">Select Leader</label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              required
              className="w-full bg-secondary/30 border border-border/30 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-neural-accent/40 transition-colors"
            >
              <option value="">Choose a user...</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>{p.display_name || p.id}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Leadership Score */}
            <div>
              <label className="text-neural-label block mb-2">Leadership Score ({form.leadership_score}/10)</label>
              <input
                type="range" min={1} max={10}
                value={form.leadership_score}
                onChange={(e) => setForm({ ...form, leadership_score: parseInt(e.target.value) })}
                className="w-full accent-neural-accent"
              />
            </div>

            {/* Emotional Baseline */}
            <div>
              <label className="text-neural-label block mb-2">Emotional Baseline ({form.emotional_baseline}/10)</label>
              <input
                type="range" min={1} max={10}
                value={form.emotional_baseline}
                onChange={(e) => setForm({ ...form, emotional_baseline: parseInt(e.target.value) })}
                className="w-full accent-neural-accent"
              />
            </div>
          </div>

          {/* Text fields */}
          {[
            { key: "decision_style", label: "Decision Style" },
            { key: "key_challenges", label: "Key Challenges" },
            { key: "goals", label: "Goals" },
            { key: "notes", label: "Notes" },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="text-neural-label block mb-2">{label}</label>
              <textarea
                value={(form as any)[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                rows={2}
                className="w-full bg-secondary/30 border border-border/30 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-neural-accent/40 transition-colors resize-none"
              />
            </div>
          ))}

          <div>
            <label className="text-neural-label block mb-2">Date de l&apos;appel</label>
            <input
              type="date"
              value={form.call_date}
              max={todayIso}
              onChange={(e) => setForm({ ...form, call_date: e.target.value })}
              className="w-full bg-secondary/30 border border-border/30 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-neural-accent/40 transition-colors"
            />
          </div>

          <button type="submit" className="btn-neural">
            <Save size={14} /> Save Audit
          </button>
        </motion.form>
      )}

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by leader, style, challenges..."
          className="w-full bg-secondary/20 border border-border/20 rounded-xl pl-12 pr-10 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-neural-accent/30 transition-colors"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full hover:bg-secondary/60 text-muted-foreground flex items-center justify-center"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Audit List */}
      <div className="space-y-3">
        {filteredAudits.length === 0 && (
          <div className="ethereal-glass p-12 text-center">
            <Phone size={32} strokeWidth={1} className="mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground text-sm">No audit calls recorded yet.</p>
          </div>
        )}
        {filteredAudits.map((audit, i) => (
          <motion.div
            key={audit.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="ethereal-glass p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-foreground">{getProfileName(audit.user_id)}</p>
                <p className="text-neural-label mt-1">
                  {audit.call_date
                    ? new Date(audit.call_date).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : new Date(audit.created_at).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-lg font-cinzel text-neural-accent">{audit.leadership_score}</p>
                  <p className="text-neural-label">Leadership</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-cinzel text-primary">{audit.emotional_baseline}</p>
                  <p className="text-neural-label">Emotion</p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    const next = expandedAudit === audit.user_id ? null : audit.user_id;
                    setExpandedAudit(next);
                    if (next) await loadExpandedData(next);
                  }}
                  className="w-8 h-8 rounded-lg border border-border/30 bg-secondary/20 flex items-center justify-center text-muted-foreground hover:text-foreground"
                >
                  {expandedAudit === audit.user_id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>
            </div>
            {audit.goals && (
              <p className="text-xs text-muted-foreground"><span className="text-neural-label">Goals:</span> {audit.goals}</p>
            )}
            {audit.key_challenges && (
              <p className="text-xs text-muted-foreground mt-1"><span className="text-neural-label">Challenges:</span> {audit.key_challenges}</p>
            )}
            {expandedAudit === audit.user_id && (() => {
              const userAudits = audits
                .filter((a) => a.user_id === audit.user_id)
                .slice()
                .sort((a, b) => {
                  const at = new Date(a.call_date || a.created_at).getTime();
                  const bt = new Date(b.call_date || b.created_at).getTime();
                  return at - bt;
                });
              const scoreData = userAudits.map((a) => {
                const dt = new Date(a.call_date || a.created_at);
                return {
                  date: dt.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
                  leadership: a.leadership_score,
                  emotional: a.emotional_baseline,
                };
              });

              const moodRows = expandedUserMood[audit.user_id] || [];
              const habitRows = expandedUserHabits[audit.user_id] || [];

              const getMoodAvg = (from: Date, to: Date) => {
                const vals = moodRows
                  .filter((m: any) => {
                    const t = new Date(m.logged_at);
                    return t >= from && t <= to;
                  })
                  .map((m: any) => Number(m.value));
                if (vals.length < 3) return null;
                return vals.reduce((s: number, v: number) => s + v, 0) / vals.length;
              };

              const getHabitRate = (from: Date, to: Date) => {
                const fromDay = from.toISOString().split("T")[0];
                const toDay = to.toISOString().split("T")[0];
                const days = new Set<string>();
                habitRows.forEach((h: any) => {
                  const d = String(h.completed_date).slice(0, 10);
                  if (d >= fromDay && d <= toDay) days.add(d);
                });
                return (days.size / 7) * 100;
              };

              const moodDeltas: number[] = [];
              const habitDeltas: number[] = [];
              userAudits.forEach((a) => {
                const call = new Date(a.call_date || a.created_at);
                const beforeStart = new Date(call); beforeStart.setDate(beforeStart.getDate() - 7);
                const beforeEnd = new Date(call); beforeEnd.setDate(beforeEnd.getDate() - 1);
                const afterStart = new Date(call); afterStart.setDate(afterStart.getDate() + 1);
                const afterEnd = new Date(call); afterEnd.setDate(afterEnd.getDate() + 7);

                const beforeMood = getMoodAvg(beforeStart, beforeEnd);
                const afterMood = getMoodAvg(afterStart, afterEnd);
                if (beforeMood != null && afterMood != null) moodDeltas.push(afterMood - beforeMood);

                const beforeHabit = getHabitRate(beforeStart, beforeEnd);
                const afterHabit = getHabitRate(afterStart, afterEnd);
                habitDeltas.push(afterHabit - beforeHabit);
              });

              const moodDelta =
                moodDeltas.length > 0
                  ? moodDeltas.reduce((s, v) => s + v, 0) / moodDeltas.length
                  : null;
              const habitDelta =
                habitDeltas.length > 0
                  ? habitDeltas.reduce((s, v) => s + v, 0) / habitDeltas.length
                  : null;

              return (
                <div className="mt-5 pt-5 border-t border-border/10 space-y-4">
                  <div className="h-48">
                    {scoreData.length > 1 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={scoreData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }} />
                          <YAxis domain={[0, 10]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }} />
                          <Tooltip />
                          <Line type="monotone" dataKey="leadership" stroke="hsl(var(--primary))" strokeWidth={2} name="Leadership" />
                          <Line type="monotone" dataKey="emotional" stroke="hsl(var(--neural-accent))" strokeWidth={2} name={t("admin.callAudit.chartEmotional")} />
                          <Legend />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                        {t("admin.callAudit.singleCallHint")}
                      </div>
                    )}
                  </div>

                  <div className="h-40">
                    {expandedLoading[audit.user_id] ? (
                      <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                        Chargement des deltas...
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-secondary/20 rounded-xl p-4 border border-border/20">
                          <p className="text-neural-label mb-2">Humeur post-call</p>
                          {moodDelta == null ? (
                            <p className="text-sm text-muted-foreground">{t("admin.callAudit.insufficient")}</p>
                          ) : (
                            <div className={`flex items-center gap-2 text-lg font-cinzel ${moodDelta >= 0 ? "text-primary" : "text-destructive"}`}>
                              {moodDelta >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                              <span>{moodDelta >= 0 ? "+" : ""}{moodDelta.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                        <div className="bg-secondary/20 rounded-xl p-4 border border-border/20">
                          <p className="text-neural-label mb-2">Habitudes post-call</p>
                          {habitDelta == null ? (
                            <p className="text-sm text-muted-foreground">{t("admin.callAudit.insufficient")}</p>
                          ) : (
                            <div className={`flex items-center gap-2 text-lg font-cinzel ${habitDelta >= 0 ? "text-primary" : "text-destructive"}`}>
                              {habitDelta >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                              <span>{habitDelta >= 0 ? "+" : ""}{Math.round(habitDelta)}%</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
