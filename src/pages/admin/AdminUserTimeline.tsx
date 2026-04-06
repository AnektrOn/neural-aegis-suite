import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Award,
  BookOpen,
  Brain,
  CheckCircle2,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  Clock3,
  Flame,
  Loader2,
  Phone,
  Target,
  User,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import type { AdminProfile } from "@/lib/admin-types";
import { avgOrNull, formatDurationSec, getDayKey } from "@/lib/admin-helpers";

interface TimelineEvent {
  id: string;
  timestamp: string;
  type:
    | "mood"
    | "decision_created"
    | "decision_resolved"
    | "habit"
    | "journal"
    | "session_start"
    | "tool_completed"
    | "tool_abandoned"
    | "audit_call"
    | "badge";
  title: string;
  subtitle?: string;
  value?: number;
  metadata?: Record<string, string | number>;
}

type RangeDays = 7 | 14 | 30 | 90;
type LocationState = { userId?: string } | null;

type DisplayTimelineItem =
  | { kind: "event"; event: TimelineEvent }
  | { kind: "session_group"; page: string; events: TimelineEvent[] };

const EVENT_COLORS: Record<TimelineEvent["type"], string> = {
  mood: "hsl(176 70% 48%)",
  decision_created: "hsl(35 80% 55%)",
  decision_resolved: "hsl(120 40% 50%)",
  habit: "hsl(270 50% 55%)",
  journal: "hsl(220 70% 60%)",
  session_start: "hsl(220 10% 45%)",
  tool_completed: "hsl(120 40% 50%)",
  tool_abandoned: "hsl(0 70% 50%)",
  audit_call: "hsl(35 80% 55%)",
  badge: "hsl(50 80% 55%)",
};

const EVENT_ICONS = {
  mood: Brain,
  decision_created: Target,
  decision_resolved: CheckCheck,
  habit: Flame,
  journal: BookOpen,
  session_start: Clock3,
  tool_completed: CheckCircle2,
  tool_abandoned: Flame,
  audit_call: Phone,
  badge: Award,
} as const;

const tooltipStyle = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "12px",
  color: "hsl(var(--foreground))",
};

function subtractDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() - days);
  return d;
}

function formatRelativeTime(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";
  const delta = Date.now() - t;
  const mins = Math.floor(delta / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "hier";
  return `il y a ${days} jours`;
}

function formatDayHeading(dayKey: string, count: number): string {
  const date = new Date(`${dayKey}T12:00:00`);
  const day = date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const clean = day.charAt(0).toUpperCase() + day.slice(1);
  return `${clean} · ${count} activité${count > 1 ? "s" : ""}`;
}

function buildDisplayItems(events: TimelineEvent[]): DisplayTimelineItem[] {
  const items: DisplayTimelineItem[] = [];
  for (let i = 0; i < events.length; i++) {
    const event = events[i]!;
    if (event.type !== "session_start") {
      items.push({ kind: "event", event });
      continue;
    }
    const page = String(event.metadata?.page || "Page inconnue");
    const group = [event];
    let j = i + 1;
    while (j < events.length) {
      const next = events[j]!;
      if (next.type !== "session_start") break;
      const nextPage = String(next.metadata?.page || "Page inconnue");
      if (nextPage !== page) break;
      group.push(next);
      j++;
    }
    if (group.length > 1) {
      items.push({ kind: "session_group", page, events: group });
      i = j - 1;
    } else {
      items.push({ kind: "event", event });
    }
  }
  return items;
}

export default function AdminUserTimeline({ userId }: { userId?: string }) {
  const location = useLocation();
  const [profiles, setProfiles] = useState<AdminProfile[]>([]);
  const [companyNameById, setCompanyNameById] = useState<Map<string, string>>(
    new Map()
  );
  const [selectedUserId, setSelectedUserId] = useState("");
  const [rangeDays, setRangeDays] = useState<RangeDays>(14);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [profilesLoading, setProfilesLoading] = useState(true);
  const [lastSeen, setLastSeen] = useState<string | null>(null);
  const [expandedSessionGroups, setExpandedSessionGroups] = useState<
    Record<string, boolean>
  >({});

  const initialLocationUserId = (location.state as LocationState)?.userId;

  useEffect(() => {
    const loadProfiles = async () => {
      setProfilesLoading(true);
      const [profRes, compRes] = await Promise.all([
        supabase.from("profiles").select("id, display_name, company_id, country, is_disabled, created_at, timezone"),
        supabase.from("companies" as never).select("id, name"),
      ]);

      if (profRes.error || compRes.error) {
        console.error(profRes.error || compRes.error);
        setProfiles([]);
        setCompanyNameById(new Map());
        setProfilesLoading(false);
        return;
      }

      setProfiles((profRes.data || []) as AdminProfile[]);
      const map = new Map<string, string>();
      ((compRes.data || []) as { id: string; name: string }[]).forEach((c) =>
        map.set(c.id, c.name)
      );
      setCompanyNameById(map);
      setProfilesLoading(false);
    };

    loadProfiles();
  }, []);

  useEffect(() => {
    const preselected = userId || initialLocationUserId || "";
    if (preselected) {
      setSelectedUserId(preselected);
    }
  }, [userId, initialLocationUserId]);

  useEffect(() => {
    if (!selectedUserId) {
      setEvents([]);
      setLastSeen(null);
      return;
    }

    const loadUserTimeline = async () => {
      setTimelineLoading(true);
      const now = new Date();
      const since = subtractDays(now, rangeDays);
      const sinceIso = since.toISOString();
      const sinceDay = getDayKey(sinceIso);

      const [
        moodRes,
        decisionRes,
        habitRes,
        journalRes,
        sessionRes,
        tbCompRes,
        tbAssignRes,
        auditRes,
        badgeRes,
        assignedHabitsRes,
        habitTemplatesRes,
      ] = await Promise.all([
        supabase
          .from("mood_entries" as never)
          .select("value, sleep, stress, logged_at")
          .eq("user_id", selectedUserId)
          .gte("logged_at", sinceIso),
        supabase
          .from("decisions" as never)
          .select("name, status, priority, responsibility, created_at, decided_at, time_to_decide")
          .eq("user_id", selectedUserId),
        supabase
          .from("habit_completions" as never)
          .select("completed_date, assigned_habit_id")
          .eq("user_id", selectedUserId)
          .gte("completed_date", sinceDay),
        supabase
          .from("journal_entries" as never)
          .select("title, tags, mood_score, created_at")
          .eq("user_id", selectedUserId)
          .gte("created_at", sinceIso),
        supabase
          .from("user_sessions" as never)
          .select("page, started_at, ended_at, last_heartbeat")
          .eq("user_id", selectedUserId)
          .gte("started_at", sinceIso)
          .order("started_at", { ascending: false }),
        supabase
          .from("toolbox_completions" as never)
          .select("status, completed_at, assignment_id")
          .eq("user_id", selectedUserId)
          .gte("completed_at", sinceIso),
        supabase
          .from("toolbox_assignments" as never)
          .select("id, title")
          .eq("user_id", selectedUserId),
        supabase
          .from("audit_calls" as never)
          .select("call_date, leadership_score, emotional_baseline")
          .eq("user_id", selectedUserId)
          .gte("call_date", sinceDay),
        supabase
          .from("user_badges" as never)
          .select("badge_name, earned_at")
          .eq("user_id", selectedUserId)
          .gte("earned_at", sinceIso),
        supabase
          .from("assigned_habits" as never)
          .select("id, template_id, title")
          .eq("user_id", selectedUserId),
        supabase
          .from("habit_templates" as never)
          .select("id, title, name"),
      ]);

      const errors = [
        moodRes.error,
        decisionRes.error,
        habitRes.error,
        journalRes.error,
        sessionRes.error,
        tbCompRes.error,
        tbAssignRes.error,
        auditRes.error,
        badgeRes.error,
        assignedHabitsRes.error,
        habitTemplatesRes.error,
      ].filter(Boolean);
      if (errors.length > 0) {
        console.error(errors);
        setEvents([]);
        setTimelineLoading(false);
        return;
      }

      const sessions = (sessionRes.data || []) as {
        page: string;
        started_at: string;
        ended_at: string | null;
        last_heartbeat: string;
      }[];
      setLastSeen(sessions[0]?.started_at || null);

      const assignmentTitleById = new Map<string, string>();
      ((tbAssignRes.data || []) as { id: string; title: string }[]).forEach(
        (row) => assignmentTitleById.set(row.id, row.title)
      );

      const habitTemplateNameById = new Map<string, string>();
      ((habitTemplatesRes.data || []) as { id: string; title?: string; name?: string }[]).forEach((row) => {
        habitTemplateNameById.set(row.id, row.title || row.name || "Habitude");
      });

      const habitNameByAssignedId = new Map<string, string>();
      (
        (assignedHabitsRes.data || []) as {
          id: string;
          template_id?: string | null;
          title?: string | null;
        }[]
      ).forEach((row) => {
        const fromTemplate = row.template_id
          ? habitTemplateNameById.get(row.template_id)
          : null;
        habitNameByAssignedId.set(row.id, row.title || fromTemplate || "Habitude");
      });

      const built: TimelineEvent[] = [];

      ((moodRes.data || []) as {
        value: number;
        sleep: number | null;
        stress: number | null;
        logged_at: string;
      }[]).forEach((row, idx) => {
        built.push({
          id: `mood-${idx}-${row.logged_at}`,
          timestamp: row.logged_at,
          type: "mood",
          title: "Humeur enregistrée",
          subtitle: `${row.value}/10 · Sommeil: ${row.sleep ?? "—"}h · Stress: ${row.stress ?? "—"}/10`,
          value: row.value,
        });
      });

      ((decisionRes.data || []) as {
        name: string;
        status: string;
        priority: number;
        responsibility: number;
        created_at: string;
        decided_at: string | null;
        time_to_decide: string | null;
      }[]).forEach((row, idx) => {
        if (new Date(row.created_at) >= since) {
          built.push({
            id: `decision-created-${idx}-${row.created_at}`,
            timestamp: row.created_at,
            type: "decision_created",
            title: `Décision créée: "${row.name}"`,
            subtitle: `Priorité ${row.priority} · Poids ${row.responsibility}/10`,
          });
        }
        if (row.decided_at && new Date(row.decided_at) >= since) {
          built.push({
            id: `decision-resolved-${idx}-${row.decided_at}`,
            timestamp: row.decided_at,
            type: "decision_resolved",
            title: `Décision résolue: "${row.name}"`,
            subtitle: row.time_to_decide ? `En ${row.time_to_decide}` : undefined,
          });
        }
      });

      ((habitRes.data || []) as {
        completed_date: string;
        assigned_habit_id: string;
      }[]).forEach((row, idx) => {
        const habitName = habitNameByAssignedId.get(row.assigned_habit_id) || "Habitude";
        const ts = row.completed_date.includes("T")
          ? row.completed_date
          : `${row.completed_date}T12:00:00.000Z`;
        built.push({
          id: `habit-${idx}-${row.completed_date}`,
          timestamp: ts,
          type: "habit",
          title: "Habitude complétée",
          subtitle: habitName,
          metadata: { assigned_habit_id: row.assigned_habit_id },
        });
      });

      ((journalRes.data || []) as {
        title: string | null;
        tags: string[] | null;
        mood_score: number | null;
        created_at: string;
      }[]).forEach((row, idx) => {
        const tags = row.tags?.length ? row.tags.join(", ") : "Sans tags";
        const mood =
          row.mood_score != null ? ` · Humeur ${row.mood_score}/5` : "";
        built.push({
          id: `journal-${idx}-${row.created_at}`,
          timestamp: row.created_at,
          type: "journal",
          title: row.title || "Entrée journal",
          subtitle: `${tags}${mood}`,
        });
      });

      sessions.forEach((row, idx) => {
        const start = new Date(row.started_at).getTime();
        const end = new Date(row.ended_at || row.last_heartbeat).getTime();
        const durationSec = Math.max(0, Math.round((end - start) / 1000));
        built.push({
          id: `session-${idx}-${row.started_at}`,
          timestamp: row.started_at,
          type: "session_start",
          title: `Session — ${row.page}`,
          subtitle: `Durée ${formatDurationSec(durationSec)}`,
          metadata: { page: row.page, duration_sec: durationSec },
        });
      });

      ((tbCompRes.data || []) as {
        status: "completed" | "abandoned" | "ignored";
        completed_at: string;
        assignment_id: string;
      }[]).forEach((row, idx) => {
        if (row.status === "ignored") return;
        const isCompleted = row.status === "completed";
        built.push({
          id: `tool-${idx}-${row.completed_at}`,
          timestamp: row.completed_at,
          type: isCompleted ? "tool_completed" : "tool_abandoned",
          title: assignmentTitleById.get(row.assignment_id) || "Outil",
          subtitle: isCompleted ? "Complété" : "Abandonné",
        });
      });

      ((auditRes.data || []) as {
        call_date: string;
        leadership_score: number | null;
        emotional_baseline: number | null;
      }[]).forEach((row, idx) => {
        const ts = row.call_date.includes("T")
          ? row.call_date
          : `${row.call_date}T12:00:00.000Z`;
        built.push({
          id: `audit-${idx}-${row.call_date}`,
          timestamp: ts,
          type: "audit_call",
          title: "Appel d'audit",
          subtitle: `Leadership: ${row.leadership_score ?? "—"}/10 · Émotionnel: ${row.emotional_baseline ?? "—"}/10`,
        });
      });

      ((badgeRes.data || []) as {
        badge_name: string;
        earned_at: string;
      }[]).forEach((row, idx) => {
        built.push({
          id: `badge-${idx}-${row.earned_at}`,
          timestamp: row.earned_at,
          type: "badge",
          title: `Badge débloqué: ${row.badge_name}`,
        });
      });

      built.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setExpandedSessionGroups({});
      setEvents(built);
      setTimelineLoading(false);
    };

    loadUserTimeline();
  }, [selectedUserId, rangeDays]);

  const selectedProfile = useMemo(() => {
    return profiles.find((p) => p.id === selectedUserId) || null;
  }, [profiles, selectedUserId]);

  const selectedCompanyName = useMemo(() => {
    if (!selectedProfile?.company_id) return "Aucune entreprise";
    return companyNameById.get(selectedProfile.company_id) || "Aucune entreprise";
  }, [selectedProfile, companyNameById]);

  const kpis = useMemo(() => {
    const sessions = events.filter((e) => e.type === "session_start").length;
    const moods = events.filter((e) => e.type === "mood");
    const avgMood = avgOrNull(
      moods
        .map((m) => m.value)
        .filter((v): v is number => typeof v === "number")
    );
    const habits = events.filter((e) => e.type === "habit").length;
    const decisions = events.filter((e) => e.type === "decision_created").length;
    const journals = events.filter((e) => e.type === "journal").length;
    return { sessions, moods: moods.length, avgMood, habits, decisions, journals };
  }, [events]);

  const activityTrend = useMemo(() => {
    const dayMap = new Map<string, number>();
    events.forEach((e) => {
      const day = getDayKey(e.timestamp);
      if (!day) return;
      dayMap.set(day, (dayMap.get(day) || 0) + 1);
    });
    return Array.from(dayMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([day, count]) => ({
        day: new Date(`${day}T12:00:00`).toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
        }),
        count,
      }));
  }, [events]);

  const groupedByDay = useMemo(() => {
    const map = new Map<string, TimelineEvent[]>();
    events.forEach((event) => {
      const day = getDayKey(event.timestamp);
      if (!day) return;
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(event);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([day, dayEvents]) => ({
        day,
        events: dayEvents,
        displayItems: buildDisplayItems(dayEvents),
      }));
  }, [events]);

  const toggleSessionGroup = (key: string) => {
    setExpandedSessionGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (profilesLoading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <p className="text-neural-label mb-3 text-neural-accent/60">Administration</p>
        <h1 className="text-neural-title text-3xl text-foreground">
          Timeline utilisateur
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Vue chronologique unifiée de l&apos;activité utilisateur
        </p>
      </div>

      <div className="ethereal-glass p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="w-full lg:max-w-sm bg-secondary/20 border border-border/20 rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/30"
          >
            <option value="">Sélectionner un utilisateur...</option>
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.display_name || "Sans nom"}
              </option>
            ))}
          </select>

          {selectedProfile && (
            <div className="text-xs text-muted-foreground">
              <span className="text-foreground font-medium">
                {selectedProfile.display_name || "Sans nom"}
              </span>
              <span> · {selectedCompanyName}</span>
              <span>
                {" "}
                · Dernière activité: {lastSeen ? formatRelativeTime(lastSeen) : "—"}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {[7, 14, 30, 90].map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => setRangeDays(days as RangeDays)}
              className={`text-[10px] uppercase tracking-[0.2em] px-3 py-2 rounded-full border transition-all ${
                rangeDays === days
                  ? "text-neural-accent border-neural-accent/30 bg-neural-accent/5"
                  : "text-muted-foreground border-border hover:border-muted-foreground/30"
              }`}
            >
              {days} jours
            </button>
          ))}
        </div>
      </div>

      {!selectedUserId ? (
        <div className="ethereal-glass p-16 text-center">
          <User size={38} strokeWidth={1.25} className="mx-auto mb-4 text-muted-foreground/35" />
          <p className="text-neural-title text-lg text-foreground">
            Sélectionnez un utilisateur
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
            <div className="ethereal-glass p-4">
              <p className="text-xl font-cinzel text-foreground">{kpis.sessions}</p>
              <p className="text-neural-label mt-1 text-[10px]">Sessions</p>
            </div>
            <div className="ethereal-glass p-4">
              <p className="text-xl font-cinzel text-foreground">{kpis.moods}</p>
              <p className="text-neural-label mt-1 text-[10px]">Humeurs</p>
            </div>
            <div className="ethereal-glass p-4">
              <p
                className={`text-xl font-cinzel ${
                  (kpis.avgMood || 0) >= 7
                    ? "text-primary"
                    : (kpis.avgMood || 0) >= 5
                      ? "text-neural-warm"
                      : "text-destructive"
                }`}
              >
                {kpis.avgMood ?? "—"}
              </p>
              <p className="text-neural-label mt-1 text-[10px]">Humeur moyenne</p>
            </div>
            <div className="ethereal-glass p-4">
              <p className="text-xl font-cinzel text-foreground">{kpis.habits}</p>
              <p className="text-neural-label mt-1 text-[10px]">Habitudes</p>
            </div>
            <div className="ethereal-glass p-4">
              <p className="text-xl font-cinzel text-foreground">{kpis.decisions}</p>
              <p className="text-neural-label mt-1 text-[10px]">Décisions créées</p>
            </div>
            <div className="ethereal-glass p-4">
              <p className="text-xl font-cinzel text-foreground">{kpis.journals}</p>
              <p className="text-neural-label mt-1 text-[10px]">Journaux</p>
            </div>
          </div>

          <div className="ethereal-glass p-5">
            <p className="text-neural-label mb-3">Résumé de la période</p>
            <div className="h-36">
              {activityTrend.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                  Aucune donnée
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={activityTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="day"
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }}
                    />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ r: 2 }}
                      name="Activités"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="ethereal-glass p-4">
            <p className="text-neural-label mb-4">Timeline</p>
            {timelineLoading ? (
              <div className="flex items-center justify-center py-20 text-muted-foreground">
                <Loader2 size={18} className="animate-spin mr-2" />
                Chargement de la timeline...
              </div>
            ) : groupedByDay.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground">
                Aucune activité sur cette période
              </div>
            ) : (
              <div className="space-y-8 max-h-[70vh] overflow-auto pr-1">
                {groupedByDay.map((group) => (
                  <div key={group.day} className="space-y-3">
                    <div className="sticky top-0 z-10 py-2 bg-background/80 backdrop-blur-sm">
                      <p className="text-neural-label text-xs uppercase tracking-[0.18em]">
                        {formatDayHeading(group.day, group.events.length)}
                      </p>
                    </div>

                    <div className="space-y-2">
                      {group.displayItems.map((item, idx) => {
                        if (item.kind === "session_group") {
                          const key = `${group.day}-${item.page}-${idx}`;
                          const expanded = !!expandedSessionGroups[key];
                          return (
                            <motion.div
                              key={key}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="border border-border/25 rounded-xl bg-secondary/10 p-3"
                            >
                              <button
                                type="button"
                                onClick={() => toggleSessionGroup(key)}
                                className="w-full flex items-center gap-3 text-left"
                              >
                                <span
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{ background: EVENT_COLORS.session_start }}
                                />
                                <div
                                  className="w-8 h-8 rounded-lg border flex items-center justify-center shrink-0"
                                  style={{
                                    borderColor: "color-mix(in srgb, hsl(var(--border)) 55%, transparent)",
                                    color: EVENT_COLORS.session_start,
                                  }}
                                >
                                  <Clock3 size={14} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-foreground">
                                    Session — {item.page}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {item.events.length} visites sur cette page
                                  </p>
                                </div>
                                {expanded ? (
                                  <ChevronUp size={14} className="text-muted-foreground" />
                                ) : (
                                  <ChevronDown size={14} className="text-muted-foreground" />
                                )}
                              </button>

                              {expanded && (
                                <div className="mt-3 ml-9 space-y-2">
                                  {item.events.map((e) => (
                                    <div key={e.id} className="text-xs text-muted-foreground">
                                      <span className="text-foreground">
                                        {new Date(e.timestamp).toLocaleTimeString("fr-FR", {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </span>
                                      {" · "}
                                      {e.subtitle}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </motion.div>
                          );
                        }

                        const event = item.event;
                        const Icon = EVENT_ICONS[event.type];
                        const color = EVENT_COLORS[event.type];

                        return (
                          <motion.div
                            key={event.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="border border-border/25 rounded-xl bg-secondary/10 p-3 flex items-start gap-3"
                          >
                            <span
                              className="w-2 h-2 mt-2 rounded-full shrink-0"
                              style={{ background: color }}
                            />
                            <div
                              className="w-8 h-8 rounded-lg border flex items-center justify-center shrink-0"
                              style={{
                                borderColor: "color-mix(in srgb, hsl(var(--border)) 55%, transparent)",
                                color,
                              }}
                            >
                              <Icon
                                size={14}
                                className={event.type === "tool_abandoned" ? "opacity-70" : ""}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-foreground">{event.title}</p>
                              {event.subtitle && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {event.subtitle}
                                </p>
                              )}
                            </div>
                            <span className="text-[11px] text-muted-foreground shrink-0">
                              {formatRelativeTime(event.timestamp)}
                            </span>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
