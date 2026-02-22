import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Users, Building2, Globe, Clock, MousePointerClick, Search, ChevronDown, ChevronUp,
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";

const COLORS = [
  "hsl(180, 70%, 50%)", "hsl(270, 50%, 55%)", "hsl(35, 80%, 55%)",
  "hsl(120, 40%, 50%)", "hsl(0, 70%, 50%)", "hsl(220, 70%, 60%)",
];

const tooltipStyle = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "12px",
  color: "hsl(var(--foreground))",
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

export default function AdminAnalytics() {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [hesitations, setHesitations] = useState<any[]>([]);
  const [moodEntries, setMoodEntries] = useState<any[]>([]);
  const [decisions, setDecisions] = useState<any[]>([]);
  const [habitCompletions, setHabitCompletions] = useState<any[]>([]);

  const [filterCompany, setFilterCompany] = useState("");
  const [filterCountry, setFilterCountry] = useState("");
  const [search, setSearch] = useState("");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [profRes, compRes, sessRes, hesRes, moodRes, decRes, habRes] = await Promise.all([
      supabase.from("profiles").select("*"),
      supabase.from("companies" as any).select("*"),
      supabase.from("user_sessions" as any).select("*").order("started_at", { ascending: false }).limit(1000),
      supabase.from("input_hesitations" as any).select("*").order("created_at", { ascending: false }).limit(1000),
      supabase.from("mood_entries" as any).select("user_id, value, sleep, stress, logged_at"),
      supabase.from("decisions" as any).select("user_id, status, priority"),
      supabase.from("habit_completions" as any).select("user_id, completed_date"),
    ]);

    setProfiles((profRes.data || []) as any);
    setCompanies((compRes.data || []) as any);
    setSessions((sessRes.data || []) as any);
    setHesitations((hesRes.data || []) as any);
    setMoodEntries((moodRes.data || []) as any);
    setDecisions((decRes.data || []) as any);
    setHabitCompletions((habRes.data || []) as any);
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

  const getUserSessions = (userId: string) => sessions.filter((s: any) => s.user_id === userId);
  const getUserHesitations = (userId: string) => hesitations.filter((h: any) => h.user_id === userId);
  const getUserMood = (userId: string) => moodEntries.filter((m: any) => m.user_id === userId);
  const getUserDecisions = (userId: string) => decisions.filter((d: any) => d.user_id === userId);
  const getUserHabitCompletions = (userId: string) => habitCompletions.filter((h: any) => h.user_id === userId);

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
    let peakHour = 0;
    let peakCount = 0;
    hourCounts.forEach((count, hour) => {
      if (count > peakCount) { peakCount = count; peakHour = hour; }
    });

    return {
      totalSessions: userSess.length,
      avgDuration,
      lastSeen: userSess[0]?.started_at,
      peakHour: `${peakHour}h`,
    };
  };

  const getHesitationStats = (userId: string) => {
    const userHes = getUserHesitations(userId);
    if (userHes.length === 0) return { avg: 0, byInput: [] };

    const byInput = new Map<string, number[]>();
    userHes.forEach((h: any) => {
      if (!byInput.has(h.input_name)) byInput.set(h.input_name, []);
      byInput.get(h.input_name)!.push(h.hesitation_ms);
    });

    const byInputArr = Array.from(byInput.entries()).map(([name, values]) => ({
      name,
      avg: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
    }));

    const totalAvg = Math.round(userHes.reduce((s: number, h: any) => s + h.hesitation_ms, 0) / userHes.length);
    return { avg: totalAvg, byInput: byInputArr };
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}min`;
    return `${(seconds / 3600).toFixed(1)}h`;
  };

  // Global stats
  const globalSessionHours = useMemo(() => {
    const hourCounts = Array(24).fill(0);
    sessions.forEach((s: any) => {
      hourCounts[new Date(s.started_at).getHours()]++;
    });
    return hourCounts.map((count, hour) => ({ hour: `${hour}h`, sessions: count }));
  }, [sessions]);

  const globalMoodTrend = useMemo(() => {
    const dayMap = new Map<string, number[]>();
    moodEntries.forEach((e: any) => {
      const day = new Date(e.logged_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
      if (!dayMap.has(day)) dayMap.set(day, []);
      dayMap.get(day)!.push(e.value);
    });
    return Array.from(dayMap.entries()).map(([day, vals]) => ({
      day,
      mood: +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1),
    }));
  }, [moodEntries]);

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
        <p className="text-neural-label mb-3 text-neural-accent/60">Administration</p>
        <h1 className="text-neural-title text-3xl text-foreground">User Analytics</h1>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Users", value: profiles.length, icon: Users },
          { label: "Companies", value: companies.length, icon: Building2 },
          { label: "Countries", value: countries.length, icon: Globe },
          { label: "Sessions", value: sessions.length, icon: Clock },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="ethereal-glass p-5">
            <s.icon size={16} strokeWidth={1.5} className="text-neural-accent mb-2" />
            <p className="text-2xl font-cinzel text-foreground">{s.value}</p>
            <p className="text-neural-label mt-1">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Global charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="ethereal-glass p-6">
          <p className="text-neural-label mb-4">Connection Hours (all users)</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={globalSessionHours}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="hour" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="sessions" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="ethereal-glass p-6">
          <p className="text-neural-label mb-4">Global Mood Trend</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={globalMoodTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }} />
                <YAxis domain={[0, 10]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="mood" stroke={COLORS[1]} strokeWidth={2} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            className="w-full bg-secondary/20 border border-border/20 rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-neural-accent/30 transition-colors"
          />
        </div>
        <select
          value={filterCompany}
          onChange={(e) => setFilterCompany(e.target.value)}
          className="bg-secondary/20 border border-border/20 rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-neural-accent/30"
        >
          <option value="">All Companies</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          value={filterCountry}
          onChange={(e) => setFilterCountry(e.target.value)}
          className="bg-secondary/20 border border-border/20 rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-neural-accent/30"
        >
          <option value="">All Countries</option>
          {countries.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* User list */}
      <div className="space-y-3">
        {filteredProfiles.length === 0 && (
          <div className="ethereal-glass p-12 text-center">
            <Users size={32} strokeWidth={1} className="mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground text-sm">No users found.</p>
          </div>
        )}

        {filteredProfiles.map((profile, i) => {
          const stats = getSessionStats(profile.id);
          const hesStats = getHesitationStats(profile.id);
          const company = profile.company_id ? companyMap.get(profile.company_id) : null;
          const isExpanded = expandedUser === profile.id;
          const userMood = getUserMood(profile.id);
          const userDec = getUserDecisions(profile.id);
          const userHab = getUserHabitCompletions(profile.id);

          return (
            <motion.div
              key={profile.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="ethereal-glass overflow-hidden"
            >
              <button
                onClick={() => setExpandedUser(isExpanded ? null : profile.id)}
                className="w-full p-5 flex items-center gap-4 text-left"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-cinzel text-sm shrink-0 ${
                  profile.is_disabled
                    ? "bg-destructive/10 border border-destructive/20 text-destructive"
                    : "bg-neural-accent/10 border border-neural-accent/20 text-neural-accent"
                }`}>
                  {(profile.display_name || "?")[0].toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground truncate">{profile.display_name || "Unnamed"}</p>
                    {profile.is_disabled && (
                      <span className="text-[8px] uppercase tracking-[0.3em] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20">Disabled</span>
                    )}
                  </div>
                  <p className="text-neural-label mt-0.5">
                    {company ? company.name : "No company"} · {profile.country || "—"}
                  </p>
                </div>

                <div className="hidden sm:flex gap-6 text-center">
                  <div>
                    <p className="text-sm font-cinzel text-foreground">{stats.totalSessions}</p>
                    <p className="text-neural-label">Sessions</p>
                  </div>
                  <div>
                    <p className="text-sm font-cinzel text-foreground">{formatDuration(stats.avgDuration)}</p>
                    <p className="text-neural-label">Avg Duration</p>
                  </div>
                  <div>
                    <p className="text-sm font-cinzel text-foreground">{stats.peakHour}</p>
                    <p className="text-neural-label">Peak Hour</p>
                  </div>
                  <div>
                    <p className="text-sm font-cinzel text-foreground">{hesStats.avg ? `${(hesStats.avg / 1000).toFixed(1)}s` : "—"}</p>
                    <p className="text-neural-label">Avg Hesitation</p>
                  </div>
                </div>

                {isExpanded ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
              </button>

              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="border-t border-border/10 p-6 space-y-6"
                >
                  {/* Session timeline */}
                  <div>
                    <p className="text-neural-label mb-3">Last Seen: {stats.lastSeen ? new Date(stats.lastSeen).toLocaleString() : "Never"}</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Mood over time for this user */}
                    <div className="ethereal-glass p-5">
                      <p className="text-neural-label mb-3">Mood Over Time</p>
                      <div className="h-40">
                        {userMood.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={userMood.map((m: any) => ({
                              day: new Date(m.logged_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
                              mood: m.value,
                              sleep: m.sleep,
                              stress: m.stress,
                            }))}>
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                              <XAxis dataKey="day" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }} />
                              <YAxis domain={[0, 10]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }} />
                              <Tooltip contentStyle={tooltipStyle} />
                              <Line type="monotone" dataKey="mood" stroke={COLORS[0]} strokeWidth={2} dot={{ r: 2 }} name="Mood" />
                              <Line type="monotone" dataKey="sleep" stroke={COLORS[5]} strokeWidth={1.5} dot={{ r: 1 }} name="Sleep" />
                              <Line type="monotone" dataKey="stress" stroke={COLORS[4]} strokeWidth={1.5} dot={{ r: 1 }} name="Stress" />
                              <Legend />
                            </LineChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No data</div>
                        )}
                      </div>
                    </div>

                    {/* Input hesitation breakdown */}
                    <div className="ethereal-glass p-5">
                      <p className="text-neural-label mb-3">Input Hesitation</p>
                      <div className="h-40">
                        {hesStats.byInput.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={hesStats.byInput.slice(0, 8)}>
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                              <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 8 }} />
                              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }} />
                              <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => `${(v / 1000).toFixed(1)}s`} />
                              <Bar dataKey="avg" fill={COLORS[2]} radius={[4, 4, 0, 0]} name="Avg ms" />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No data</div>
                        )}
                      </div>
                    </div>

                    {/* Decisions pie */}
                    <div className="ethereal-glass p-5">
                      <p className="text-neural-label mb-3">Decisions</p>
                      <div className="h-40">
                        {userDec.length > 0 ? (() => {
                          const pieData = [
                            { name: "Pending", value: userDec.filter((d: any) => d.status === "pending").length },
                            { name: "Decided", value: userDec.filter((d: any) => d.status === "decided").length },
                            { name: "Deferred", value: userDec.filter((d: any) => d.status === "deferred").length },
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
                        })() : (
                          <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No data</div>
                        )}
                      </div>
                    </div>

                    {/* Habit completions recent */}
                    <div className="ethereal-glass p-5">
                      <p className="text-neural-label mb-3">Habit Completions (recent)</p>
                      <div className="h-40">
                        {userHab.length > 0 ? (() => {
                          const dayMap = new Map<string, number>();
                          userHab.forEach((h: any) => {
                            dayMap.set(h.completed_date, (dayMap.get(h.completed_date) || 0) + 1);
                          });
                          const data = Array.from(dayMap.entries()).slice(-7).map(([d, c]) => ({
                            day: new Date(d).toLocaleDateString("fr-FR", { weekday: "short" }),
                            count: c,
                          }));
                          return (
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis dataKey="day" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }} />
                                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }} />
                                <Tooltip contentStyle={tooltipStyle} />
                                <Bar dataKey="count" fill={COLORS[3]} radius={[4, 4, 0, 0]} name="Completed" />
                              </BarChart>
                            </ResponsiveContainer>
                          );
                        })() : (
                          <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No data</div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
