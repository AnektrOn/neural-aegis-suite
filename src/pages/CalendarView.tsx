import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Circle, CheckCircle2, Brain, Target, BookOpen, ListChecks } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";

interface DayData {
  mood: number | null;
  habits: number;
  decisions: number;
  journal: number;
}

export default function CalendarView() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [monthData, setMonthData] = useState<Map<string, DayData>>(new Map());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  useEffect(() => {
    if (user) loadMonthData();
  }, [user, year, month]);

  const loadMonthData = async () => {
    const start = new Date(year, month, 1).toISOString();
    const end = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
    const startDate = new Date(year, month, 1).toISOString().split("T")[0];
    const endDate = new Date(year, month + 1, 0).toISOString().split("T")[0];

    const [moodRes, habitRes, decRes, journalRes] = await Promise.all([
      supabase.from("mood_entries" as any).select("value, logged_at").eq("user_id", user!.id).gte("logged_at", start).lte("logged_at", end),
      supabase.from("habit_completions" as any).select("completed_date").eq("user_id", user!.id).gte("completed_date", startDate).lte("completed_date", endDate),
      supabase.from("decisions" as any).select("created_at").eq("user_id", user!.id).gte("created_at", start).lte("created_at", end),
      supabase.from("journal_entries").select("created_at").eq("user_id", user!.id).gte("created_at", start).lte("created_at", end),
    ]);

    const map = new Map<string, DayData>();

    const getOrCreate = (dateStr: string): DayData => {
      if (!map.has(dateStr)) map.set(dateStr, { mood: null, habits: 0, decisions: 0, journal: 0 });
      return map.get(dateStr)!;
    };

    ((moodRes.data as any[]) || []).forEach((m) => {
      const day = m.logged_at.split("T")[0];
      const d = getOrCreate(day);
      d.mood = d.mood ? Math.round((d.mood + m.value) / 2) : m.value;
    });

    ((habitRes.data as any[]) || []).forEach((h) => {
      getOrCreate(h.completed_date).habits++;
    });

    ((decRes.data as any[]) || []).forEach((d) => {
      getOrCreate(d.created_at.split("T")[0]).decisions++;
    });

    ((journalRes.data as any[]) || []).forEach((j) => {
      getOrCreate(j.created_at.split("T")[0]).journal++;
    });

    setMonthData(map);
  };

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0
  const weekDays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const monthName = currentMonth.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  const getMoodColor = (mood: number | null) => {
    if (mood === null) return "";
    if (mood >= 8) return "bg-emerald-500/20 border-emerald-500/30";
    if (mood >= 6) return "bg-primary/15 border-primary/25";
    if (mood >= 4) return "bg-amber-500/15 border-amber-500/25";
    return "bg-red-400/15 border-red-400/25";
  };

  const selectedData = selectedDay ? monthData.get(selectedDay) : null;

  return (
    <div className="space-y-10 max-w-5xl">
      <div>
        <p className="text-neural-label mb-3">Vue d'ensemble</p>
        <h1 className="text-neural-title text-3xl text-foreground">Calendrier</h1>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="ethereal-glass p-3 sm:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-secondary/30 transition-colors text-muted-foreground hover:text-foreground">
            <ChevronLeft size={18} />
          </button>
          <h2 className="text-neural-title text-lg text-foreground capitalize">{monthName}</h2>
          <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-secondary/30 transition-colors text-muted-foreground hover:text-foreground">
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Week days header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((d) => (
            <div key={d} className="text-center text-neural-label py-2">{d}</div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const data = monthData.get(dateStr);
            const isToday = dateStr === new Date().toISOString().split("T")[0];
            const isSelected = selectedDay === dateStr;
            const hasActivity = data && (data.mood !== null || data.habits > 0 || data.decisions > 0 || data.journal > 0);

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                className={`aspect-square rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-all text-sm relative ${
                  isSelected
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : isToday
                    ? "border-primary/30 bg-primary/5 text-foreground"
                    : hasActivity
                    ? `${getMoodColor(data?.mood ?? null)} text-foreground`
                    : "border-transparent hover:border-border/30 text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className={`font-cinzel text-xs ${isToday ? "font-bold" : ""}`}>{day}</span>
                {hasActivity && (
                  <div className="flex gap-0.5">
                    {data!.mood !== null && <div className="w-1 h-1 rounded-full bg-primary" />}
                    {data!.habits > 0 && <div className="w-1 h-1 rounded-full bg-emerald-500" />}
                    {data!.decisions > 0 && <div className="w-1 h-1 rounded-full bg-amber-500" />}
                    {data!.journal > 0 && <div className="w-1 h-1 rounded-full bg-violet-500" />}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 sm:gap-4 mt-6 justify-center">
          {[
            { color: "bg-primary", label: "Humeur" },
            { color: "bg-emerald-500", label: "Habitudes" },
            { color: "bg-amber-500", label: "Décisions" },
            { color: "bg-violet-500", label: "Journal" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${item.color}`} />
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest">{item.label}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Selected day detail */}
      {selectedDay && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="ethereal-glass p-6">
          <p className="text-neural-label mb-4">
            {new Date(selectedDay + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
          {selectedData ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-secondary/20 rounded-xl p-4 text-center">
                <Brain size={16} className="text-primary mx-auto mb-2" />
                <p className="text-lg font-cinzel text-foreground">{selectedData.mood ?? "—"}</p>
                <p className="text-neural-label">Humeur</p>
              </div>
              <div className="bg-secondary/20 rounded-xl p-4 text-center">
                <ListChecks size={16} className="text-emerald-500 mx-auto mb-2" />
                <p className="text-lg font-cinzel text-foreground">{selectedData.habits}</p>
                <p className="text-neural-label">Habitudes</p>
              </div>
              <div className="bg-secondary/20 rounded-xl p-4 text-center">
                <Target size={16} className="text-amber-500 mx-auto mb-2" />
                <p className="text-lg font-cinzel text-foreground">{selectedData.decisions}</p>
                <p className="text-neural-label">Décisions</p>
              </div>
              <div className="bg-secondary/20 rounded-xl p-4 text-center">
                <BookOpen size={16} className="text-violet-500 mx-auto mb-2" />
                <p className="text-lg font-cinzel text-foreground">{selectedData.journal}</p>
                <p className="text-neural-label">Journal</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">{t("common.noActivityToday")}</p>
          )}
        </motion.div>
      )}
    </div>
  );
}
