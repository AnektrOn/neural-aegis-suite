import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Users, Building2, Globe, Clock, MousePointerClick, Search, ChevronDown, ChevronUp,
  Brain, Target, ListChecks, Utensils, Moon, Flame, UserCheck,
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, Legend, RadialBarChart, RadialBar,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";

const COLORS = [
  "hsl(180, 70%, 50%)", "hsl(270, 50%, 55%)", "hsl(35, 80%, 55%)",
  "hsl(120, 40%, 50%)", "hsl(0, 70%, 50%)", "hsl(220, 70%, 60%)",
];

const tooltipStyle = {
  background: "hsl(var(--card))", border: "1px solid hsl(var(--border))",
  borderRadius: "12px", color: "hsl(var(--foreground))",
};

interface UserProfile {
  id: string;
  display_name: string | null;
  company_id: string | null;
  country: string | null;
  is_disabled: boolean;
  created_at: string;
}

interface Company {
  id: string;
  name: string;
  country: string | null;
}

type ViewMode = "global" | "entreprise" | "utilisateur";

export default function AdminAnalytics() {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [hesitations, setHesitations] = useState<any[]>([]);
  const [moodEntries, setMoodEntries] = useState<any[]>([]);
  const [decisions, setDecisions] = useState<any[]>([]);
  const [habitCompletions, setHabitCompletions] = useState<any[]>([]);
  const [assignedHabits, setAssignedHabits] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);

  const [viewMode, setViewMode] = useState<ViewMode>("global");
  const [filterCompany, setFilterCompany] = useState("");
  const [filterCountry, setFilterCountry] = useState("");
  const [search, setSearch] = useState("");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const [profRes, compRes, sessRes, hesRes, moodRes, decRes, habRes, assignRes, contactRes] = await Promise.all([
      supabase.from("profiles").select("*"),
      supabase.from("companies" as any).select("*"),
      supabase.from("user_sessions" as any).select("*").order("started_at", { ascending: false }).limit(1000),
      supabase.from("input_hesitations" as any).select("*").order("created_at", { ascending: false }).limit(1000),
      supabase.from("mood_entries" as any).select("user_id, value, sleep, stress, meals_count, logged_at"),
      supabase.from("decisions" as any).select("user_id, status, priority, created_at"),
      supabase.from("habit_completions" as any).select("user_id, completed_date, assigned_habit_id"),
      supabase.from("assigned_habits" as any).select("id, user_id, is_active"),
      supabase.from("people_contacts" as any).select("user_id, quality"),
    ]);

    setProfiles((profRes.data || []) as any);
    setCompanies((compRes.data || []) as any);
    setSessions((sessRes.data || []) as any);
    setHesitations((hesRes.data || []) as any);
    setMoodEntries((moodRes.data || []) as any);
    setDecisions((decRes.data || []) as any);
    setHabitCompletions((habRes.data || []) as any);
    setAssignedHabits((assignRes.data || []) as any);
    setContacts((contactRes.data || []) as any);
    setLoading(false);
  };

  const companyMap = useMemo(() => {
    const map = new Map<string, Company>();
    companies.forEach((c) => map.set(c.id, c));
    return map;
  }, [companies]);

  const countries = useMemo(() => {
    const set = new Set<string>();
    profiles.forEach((p) => { if (p.country) set.add(p.country); });
    companies.forEach((c) => { if (c.country) set.add(c.country); });
    return Array.from(set).sort();
  }, [profiles, companies]);

  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
      if (search && !(p.display_name || "").toLowerCase().includes(search.toLowerCase())) return false;
      if (filterCompany && p.company_id !== filterCompany) return false;
      if (filterCountry) {
        const userCountry = p.country || companyMap.get(p.company_id || "")?.country;
        if (userCountry !== filterCountry) return false;
      }
      return true;
    });
  }, [profiles, search, filterCompany, filterCountry, companyMap]);

  const filteredUserIds = useMemo(() => new Set(filteredProfiles.map((p) => p.id)), [filteredProfiles]);

  // Filtered data based on selected users
  const fMood = useMemo(() => moodEntries.filter((m: any) => filteredUserIds.has(m.user_id)), [moodEntries, filteredUserIds]);
  const fDecisions = useMemo(() => decisions.filter((d: any) => filteredUserIds.has(d.user_id)), [decisions, filteredUserIds]);
  const fHabitComp = useMemo(() => habitCompletions.filter((h: any) => filteredUserIds.has(h.user_id)), [habitCompletions, filteredUserIds]);
  const fSessions = useMemo(() => sessions.filter((s: any) => filteredUserIds.has(s.user_id)), [sessions, filteredUserIds]);
  const fContacts = useMemo(() => contacts.filter((c: any) => filteredUserIds.has(c.user_id)), [contacts, filteredUserIds]);
  const fAssigned = useMemo(() => assignedHabits.filter((a: any) => filteredUserIds.has(a.user_id)), [assignedHabits, filteredUserIds]);

  // ===== GLOBAL AGGREGATED CHARTS =====
  const globalMoodTrend = useMemo(() => {
    const dayMap = new Map<string, { mood: number[]; sleep: number[]; stress: number[]; meals: number[] }>();
    fMood.forEach((e: any) => {
      const day = new Date(e.logged_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
      if (!dayMap.has(day)) dayMap.set(day, { mood: [], sleep: [], stress: [], meals: [] });
      const d = dayMap.get(day)!;
      d.mood.push(e.value);
      if (e.sleep != null) d.sleep.push(Number(e.sleep));
      if (e.stress != null) d.stress.push(Number(e.stress));
      if (e.meals_count != null) d.meals.push(e.meals_count);
    });
    return Array.from(dayMap.entries()).map(([day, v]) => {
      const avg = (arr: number[]) => arr.length ? +(arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1) : null;
      return { day, humeur: avg(v.mood), sommeil: avg(v.sleep), stress: avg(v.stress), repas: avg(v.meals) };
    });
  }, [fMood]);

  const globalSessionHours = useMemo(() => {
    const hourCounts = Array(24).fill(0);
    fSessions.forEach((s: any) => { hourCounts[new Date(s.started_at).getHours()]++; });
    return hourCounts.map((count, hour) => ({ heure: `${hour}h`, sessions: count }));
  }, [fSessions]);

  const globalDecisionPie = useMemo(() => {
    return [
      { name: "En attente", value: fDecisions.filter((d: any) => d.status === "pending").length },
      { name: "Décidée", value: fDecisions.filter((d: any) => d.status === "decided").length },
      { name: "Reportée", value: fDecisions.filter((d: any) => d.status === "deferred").length },
    ].filter((d) => d.value > 0);
  }, [fDecisions]);

  const globalHabitChart = useMemo(() => {
    const last7 = new Map<string, number>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      last7.set(d.toISOString().split("T")[0], 0);
    }
    fHabitComp.forEach((c: any) => { if (last7.has(c.completed_date)) last7.set(c.completed_date, (last7.get(c.completed_date) || 0) + 1); });
    return Array.from(last7.entries()).map(([date, count]) => ({
      jour: new Date(date).toLocaleDateString("fr-FR", { weekday: "short" }),
      complétées: count,
    }));
  }, [fHabitComp]);

  const globalAvgMood = useMemo(() => fMood.length ? +(fMood.reduce((s, m: any) => s + m.value, 0) / fMood.length).toFixed(1) : 0, [fMood]);
  const globalAvgSleep = useMemo(() => {
    const sleepVals = fMood.filter((m: any) => m.sleep != null);
    return sleepVals.length ? +(sleepVals.reduce((s, m: any) => s + Number(m.sleep), 0) / sleepVals.length).toFixed(1) : 0;
  }, [fMood]);
  const globalAvgStress = useMemo(() => {
    const stressVals = fMood.filter((m: any) => m.stress != null);
    return stressVals.length ? +(stressVals.reduce((s, m: any) => s + Number(m.stress), 0) / stressVals.length).toFixed(1) : 0;
  }, [fMood]);

  const totalSessionTime = useMemo(() => {
    return fSessions.reduce((total, s: any) => {
      if (s.ended_at) return total + (new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()) / 1000;
      return total + (new Date(s.last_heartbeat).getTime() - new Date(s.started_at).getTime()) / 1000;
    }, 0);
  }, [fSessions]);

  // ===== PER COMPANY STATS =====
  const companyStats = useMemo(() => {
    return companies.map((company) => {
      const compUsers = profiles.filter((p) => p.company_id === company.id);
      const userIds = new Set(compUsers.map((u) => u.id));
      const cMood = moodEntries.filter((m: any) => userIds.has(m.user_id));
      const cDec = decisions.filter((d: any) => userIds.has(d.user_id));
      const cHab = habitCompletions.filter((h: any) => userIds.has(h.user_id));
      const cSess = sessions.filter((s: any) => userIds.has(s.user_id));
      const cContacts = contacts.filter((c: any) => userIds.has(c.user_id));

      const avgMood = cMood.length ? +(cMood.reduce((s, m: any) => s + m.value, 0) / cMood.length).toFixed(1) : 0;
      const avgQuality = cContacts.length ? +(cContacts.reduce((s, c: any) => s + c.quality, 0) / cContacts.length).toFixed(1) : 0;

      return {
        ...company,
        userCount: compUsers.length,
        avgMood,
        totalDecisions: cDec.length,
        decidedRate: cDec.length ? Math.round(cDec.filter((d: any) => d.status === "decided").length / cDec.length * 100) : 0,
        totalHabitCompletions: cHab.length,
        totalSessions: cSess.length,
        avgRelationQuality: avgQuality,
      };
    });
  }, [companies, profiles, moodEntries, decisions, habitCompletions, sessions, contacts]);

  // ===== PER USER helpers =====
  const getUserSessions = (userId: string) => sessions.filter((s: any) => s.user_id === userId);
  const getUserMood = (userId: string) => moodEntries.filter((m: any) => m.user_id === userId);
  const getUserDecisions = (userId: string) => decisions.filter((d: any) => d.user_id === userId);
  const getUserHabitCompletions = (userId: string) => habitCompletions.filter((h: any) => h.user_id === userId);
  const getUserContacts = (userId: string) => contacts.filter((c: any) => c.user_id === userId);
  const getUserHesitations = (userId: string) => hesitations.filter((h: any) => h.user_id === userId);

  const getSessionStats = (userId: string) => {
    const userSess = getUserSessions(userId);
    if (userSess.length === 0) return { totalSessions: 0, avgDuration: 0, lastSeen: null, peakHour: "-" };
    const durations = userSess.map((s: any) => {
      if (s.ended_at) return (new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()) / 1000;
      return (new Date(s.last_heartbeat).getTime() - new Date(s.started_at).getTime()) / 1000;
    });
    const avgDuration = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
    const hours = userSess.map((s: any) => new Date(s.started_at).getHours());
    const hourCounts = new Map<number, number>();
    hours.forEach((h) => hourCounts.set(h, (hourCounts.get(h) || 0) + 1));
    let peakHour = 0, peakCount = 0;
    hourCounts.forEach((count, hour) => { if (count > peakCount) { peakCount = count; peakHour = hour; } });
    return { totalSessions: userSess.length, avgDuration, lastSeen: userSess[0]?.started_at, peakHour: `${peakHour}h` };
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}min`;
    return `${(seconds / 3600).toFixed(1)}h`;
  };

  if (loading) {
    return <div className="flex items-center justify-center p-20"><div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-8 max-w-7xl">
      <div>
        <p className="text-neural-label mb-3 text-neural-accent/60">Administration</p>
        <h1 className="text-neural-title text-3xl text-foreground">Analytiques</h1>
      </div>

      {/* View mode tabs */}
      <div className="flex gap-2">
        {([
          { mode: "global" as ViewMode, label: "Vue Globale" },
          { mode: "entreprise" as ViewMode, label: "Par Entreprise" },
          { mode: "utilisateur" as ViewMode, label: "Par Utilisateur" },
        ]).map(({ mode, label }) => (
          <button key={mode} onClick={() => setViewMode(mode)}
            className={`text-[9px] uppercase tracking-[0.3em] px-4 py-2 rounded-full border transition-all ${
              viewMode === mode ? "text-neural-accent border-neural-accent/30 bg-neural-accent/5" : "text-muted-foreground border-border hover:border-muted-foreground/30"
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {viewMode === "utilisateur" && (
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un utilisateur..."
              className="w-full bg-secondary/20 border border-border/20 rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-neural-accent/30 transition-colors" />
          </div>
        )}
        <select value={filterCompany} onChange={(e) => setFilterCompany(e.target.value)}
          className="bg-secondary/20 border border-border/20 rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-neural-accent/30">
          <option value="">Toutes les entreprises</option>
          {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={filterCountry} onChange={(e) => setFilterCountry(e.target.value)}
          className="bg-secondary/20 border border-border/20 rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-neural-accent/30">
          <option value="">Tous les pays</option>
          {countries.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* ======= GLOBAL VIEW ======= */}
      {(viewMode === "global") && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-3">
            {[
              { label: "Utilisateurs", value: filteredProfiles.length, icon: Users },
              { label: "Entreprises", value: companies.length, icon: Building2 },
              { label: "Humeur moy.", value: globalAvgMood, icon: Brain },
              { label: "Sommeil moy.", value: `${globalAvgSleep}h`, icon: Moon },
              { label: "Stress moy.", value: globalAvgStress, icon: Flame },
              { label: "Sessions", value: fSessions.length, icon: Clock },
              { label: "Temps total", value: formatDuration(totalSessionTime), icon: Clock },
              { label: "Contacts", value: fContacts.length, icon: UserCheck },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="ethereal-glass p-4">
                <s.icon size={14} strokeWidth={1.5} className="text-neural-accent mb-2" />
                <p className="text-lg font-cinzel text-foreground">{s.value}</p>
                <p className="text-neural-label mt-1 text-[10px]">{s.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Mood + Sleep + Stress trend */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="ethereal-glass p-6">
            <p className="text-neural-label mb-4">Tendance Humeur / Sommeil / Stress</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={globalMoodTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }} />
                  <YAxis domain={[0, 10]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="humeur" stroke={COLORS[0]} strokeWidth={2} dot={{ r: 2 }} name="Humeur" />
                  <Line type="monotone" dataKey="sommeil" stroke={COLORS[5]} strokeWidth={1.5} dot={{ r: 1 }} name="Sommeil" />
                  <Line type="monotone" dataKey="stress" stroke={COLORS[4]} strokeWidth={1.5} dot={{ r: 1 }} name="Stress" />
                  <Legend />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sessions par heure */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="ethereal-glass p-6">
              <p className="text-neural-label mb-4">Heures de connexion</p>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={globalSessionHours}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="heure" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="sessions" fill={COLORS[0]} radius={[4, 4, 0, 0]} name="Sessions" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Decisions pie */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="ethereal-glass p-6">
              <p className="text-neural-label mb-4">Décisions ({fDecisions.length} total)</p>
              <div className="h-48">
                {globalDecisionPie.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={globalDecisionPie} cx="50%" cy="50%" outerRadius={65} dataKey="value" nameKey="name" label={({ name, value }) => `${name}: ${value}`} labelLine={false} fontSize={9}>
                        {globalDecisionPie.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Aucune donnée</div>
                )}
              </div>
            </motion.div>

            {/* Habits chart */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="ethereal-glass p-6">
              <p className="text-neural-label mb-4">Complétion habitudes (7j)</p>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={globalHabitChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="jour" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="complétées" fill={COLORS[3]} radius={[4, 4, 0, 0]} name="Complétées" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>

          {/* Repas par jour */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="ethereal-glass p-6">
            <p className="text-neural-label mb-4">Repas par jour (moyenne)</p>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={globalMoodTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="repas" fill={COLORS[2]} radius={[4, 4, 0, 0]} name="Repas" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </>
      )}

      {/* ======= COMPANY VIEW ======= */}
      {viewMode === "entreprise" && (
        <div className="space-y-4">
          {companyStats.length === 0 && (
            <div className="ethereal-glass p-12 text-center">
              <Building2 size={32} strokeWidth={1} className="mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-muted-foreground text-sm">Aucune entreprise.</p>
            </div>
          )}
          {companyStats.filter((c) => !filterCompany || c.id === filterCompany).map((company, i) => (
            <motion.div key={company.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="ethereal-glass p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-neural-accent/10 border border-neural-accent/20 flex items-center justify-center">
                  <Building2 size={20} className="text-neural-accent" />
                </div>
                <div className="flex-1">
                  <p className="text-lg font-cinzel text-foreground">{company.name}</p>
                  <p className="text-neural-label">{company.country || "—"} · {company.userCount} utilisateur{company.userCount > 1 ? "s" : ""}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { label: "Utilisateurs", value: company.userCount },
                  { label: "Humeur moy.", value: company.avgMood },
                  { label: "Décisions", value: company.totalDecisions },
                  { label: "Taux décision", value: `${company.decidedRate}%` },
                  { label: "Habitudes complétées", value: company.totalHabitCompletions },
                  { label: "Qualité relations", value: `${company.avgRelationQuality}/10` },
                ].map((stat) => (
                  <div key={stat.label} className="bg-secondary/20 rounded-xl p-3">
                    <p className="text-lg font-cinzel text-foreground">{stat.value}</p>
                    <p className="text-neural-label text-[10px] mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ======= USER VIEW ======= */}
      {viewMode === "utilisateur" && (
        <div className="space-y-3">
          {filteredProfiles.length === 0 && (
            <div className="ethereal-glass p-12 text-center">
              <Users size={32} strokeWidth={1} className="mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-muted-foreground text-sm">Aucun utilisateur trouvé.</p>
            </div>
          )}

          {filteredProfiles.map((profile, i) => {
            const stats = getSessionStats(profile.id);
            const company = profile.company_id ? companyMap.get(profile.company_id) : null;
            const isExpanded = expandedUser === profile.id;
            const userMood = getUserMood(profile.id);
            const userDec = getUserDecisions(profile.id);
            const userHab = getUserHabitCompletions(profile.id);
            const userContacts = getUserContacts(profile.id);
            const userHes = getUserHesitations(profile.id);

            const avgMood = userMood.length ? +(userMood.reduce((s, m: any) => s + m.value, 0) / userMood.length).toFixed(1) : 0;

            return (
              <motion.div key={profile.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }} className="ethereal-glass overflow-hidden">
                <button onClick={() => setExpandedUser(isExpanded ? null : profile.id)} className="w-full p-5 flex items-center gap-4 text-left">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-cinzel text-sm shrink-0 ${
                    profile.is_disabled ? "bg-destructive/10 border border-destructive/20 text-destructive" : "bg-neural-accent/10 border border-neural-accent/20 text-neural-accent"
                  }`}>
                    {(profile.display_name || "?")[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground truncate">{profile.display_name || "Sans nom"}</p>
                      {profile.is_disabled && <span className="text-[8px] uppercase tracking-[0.3em] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20">Désactivé</span>}
                    </div>
                    <p className="text-neural-label mt-0.5">{company ? company.name : "Aucune entreprise"} · {profile.country || "—"}</p>
                  </div>
                  <div className="hidden sm:flex gap-6 text-center">
                    <div><p className="text-sm font-cinzel text-foreground">{avgMood}</p><p className="text-neural-label">Humeur</p></div>
                    <div><p className="text-sm font-cinzel text-foreground">{stats.totalSessions}</p><p className="text-neural-label">Sessions</p></div>
                    <div><p className="text-sm font-cinzel text-foreground">{formatDuration(stats.avgDuration)}</p><p className="text-neural-label">Durée moy.</p></div>
                    <div><p className="text-sm font-cinzel text-foreground">{userDec.length}</p><p className="text-neural-label">Décisions</p></div>
                    <div><p className="text-sm font-cinzel text-foreground">{userHab.length}</p><p className="text-neural-label">Habitudes</p></div>
                    <div><p className="text-sm font-cinzel text-foreground">{userContacts.length}</p><p className="text-neural-label">Contacts</p></div>
                  </div>
                  {isExpanded ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
                </button>

                {isExpanded && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="border-t border-border/10 p-6 space-y-6">
                    <p className="text-neural-label">Dernière connexion : {stats.lastSeen ? new Date(stats.lastSeen).toLocaleString("fr-FR") : "Jamais"} · Heure de pointe : {stats.peakHour}</p>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Mood + Sleep + Stress */}
                      <div className="ethereal-glass p-5">
                        <p className="text-neural-label mb-3">Humeur / Sommeil / Stress</p>
                        <div className="h-40">
                          {userMood.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={userMood.map((m: any) => ({
                                day: new Date(m.logged_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
                                humeur: m.value, sommeil: m.sleep ? Number(m.sleep) : null, stress: m.stress ? Number(m.stress) : null,
                              }))}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis dataKey="day" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }} />
                                <YAxis domain={[0, 10]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }} />
                                <Tooltip contentStyle={tooltipStyle} />
                                <Line type="monotone" dataKey="humeur" stroke={COLORS[0]} strokeWidth={2} dot={{ r: 2 }} name="Humeur" />
                                <Line type="monotone" dataKey="sommeil" stroke={COLORS[5]} strokeWidth={1.5} dot={{ r: 1 }} name="Sommeil" />
                                <Line type="monotone" dataKey="stress" stroke={COLORS[4]} strokeWidth={1.5} dot={{ r: 1 }} name="Stress" />
                                <Legend />
                              </LineChart>
                            </ResponsiveContainer>
                          ) : <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Aucune donnée</div>}
                        </div>
                      </div>

                      {/* Hesitation */}
                      <div className="ethereal-glass p-5">
                        <p className="text-neural-label mb-3">Temps d'hésitation</p>
                        <div className="h-40">
                          {userHes.length > 0 ? (() => {
                            const byInput = new Map<string, number[]>();
                            userHes.forEach((h: any) => { if (!byInput.has(h.input_name)) byInput.set(h.input_name, []); byInput.get(h.input_name)!.push(h.hesitation_ms); });
                            const data = Array.from(byInput.entries()).map(([name, values]) => ({ name, moy: Math.round(values.reduce((a, b) => a + b, 0) / values.length) }));
                            return (
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.slice(0, 8)}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                  <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 8 }} />
                                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }} />
                                  <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => `${(v / 1000).toFixed(1)}s`} />
                                  <Bar dataKey="moy" fill={COLORS[2]} radius={[4, 4, 0, 0]} name="Moy. ms" />
                                </BarChart>
                              </ResponsiveContainer>
                            );
                          })() : <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Aucune donnée</div>}
                        </div>
                      </div>

                      {/* Decisions pie */}
                      <div className="ethereal-glass p-5">
                        <p className="text-neural-label mb-3">Décisions</p>
                        <div className="h-40">
                          {userDec.length > 0 ? (() => {
                            const pieData = [
                              { name: "En attente", value: userDec.filter((d: any) => d.status === "pending").length },
                              { name: "Décidée", value: userDec.filter((d: any) => d.status === "decided").length },
                              { name: "Reportée", value: userDec.filter((d: any) => d.status === "deferred").length },
                            ].filter((d) => d.value > 0);
                            return (
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={55} dataKey="value" nameKey="name" label fontSize={10}>
                                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                                  </Pie>
                                  <Tooltip />
                                </PieChart>
                              </ResponsiveContainer>
                            );
                          })() : <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Aucune donnée</div>}
                        </div>
                      </div>

                      {/* Habit completions */}
                      <div className="ethereal-glass p-5">
                        <p className="text-neural-label mb-3">Complétion habitudes</p>
                        <div className="h-40">
                          {userHab.length > 0 ? (() => {
                            const dayMap = new Map<string, number>();
                            userHab.forEach((h: any) => { dayMap.set(h.completed_date, (dayMap.get(h.completed_date) || 0) + 1); });
                            const data = Array.from(dayMap.entries()).slice(-7).map(([d, c]) => ({
                              jour: new Date(d).toLocaleDateString("fr-FR", { weekday: "short" }), count: c,
                            }));
                            return (
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                  <XAxis dataKey="jour" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }} />
                                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }} />
                                  <Tooltip contentStyle={tooltipStyle} />
                                  <Bar dataKey="count" fill={COLORS[3]} radius={[4, 4, 0, 0]} name="Complétées" />
                                </BarChart>
                              </ResponsiveContainer>
                            );
                          })() : <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Aucune donnée</div>}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
