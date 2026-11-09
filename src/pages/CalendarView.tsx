import { useState, useEffect, useMemo } from "react";
import { MemberPageScaffold } from "@/layouts/MemberPageScaffold";
import { MemberSplitLayout } from "@/layouts/MemberSplitLayout";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, Calendar as CalendarIcon,
  Brain, Target, BookOpen, ListChecks, Wrench, Sparkles,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";

interface DayData {
  mood: number | null;
  habits: number;
  decisions: number;
  journal: number;
  toolbox: number;
}

export default function CalendarView() {
  const { user } = useAuth();
  const { t, locale } = useLanguage();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [monthData, setMonthData] = useState<Map<string, DayData>>(new Map());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<"calendar" | "detail">("calendar");

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

    const [moodRes, habitRes, decRes, journalRes, toolboxRes] = await Promise.all([
      supabase.from("mood_entries" as any).select("value, logged_at").eq("user_id", user!.id).gte("logged_at", start).lte("logged_at", end),
      supabase.from("habit_completions" as any).select("completed_date").eq("user_id", user!.id).gte("completed_date", startDate).lte("completed_date", endDate),
      supabase.from("decisions" as any).select("created_at").eq("user_id", user!.id).gte("created_at", start).lte("created_at", end),
      supabase.from("journal_entries").select("created_at").eq("user_id", user!.id).gte("created_at", start).lte("created_at", end),
      supabase.from("toolbox_completions" as any).select("completed_at, status").eq("user_id", user!.id).eq("status", "completed").gte("completed_at", start).lte("completed_at", end),
    ]);

    const map = new Map<string, DayData>();

    const getOrCreate = (dateStr: string): DayData => {
      if (!map.has(dateStr)) map.set(dateStr, { mood: null, habits: 0, decisions: 0, journal: 0, toolbox: 0 });
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

    ((toolboxRes.data as any[]) || []).forEach((tb) => {
      if (!tb?.completed_at) return;
      getOrCreate(String(tb.completed_at).split("T")[0]).toolbox++;
    });

    setMonthData(map);
  };

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0
  const dateLocale = locale === "en" ? "en-US" : "fr-FR";
  const weekDays = useMemo(() => {
    const monday = new Date(2024, 0, 1);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d.toLocaleDateString(dateLocale, { weekday: "short" });
    });
  }, [dateLocale]);

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const monthName = currentMonth.toLocaleDateString(dateLocale, { month: "long", year: "numeric" });

  const selectedData = selectedDay ? monthData.get(selectedDay) : null;

  const dayDetailContent = selectedDay ? (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
        <div>
          <p className="font-cinzel text-[9.5px] uppercase tracking-wider text-muted-foreground">
            JOUR SÉLECTIONNÉ
          </p>
          <p className="font-cinzel text-sm font-semibold text-foreground capitalize mt-0.5">
            {new Date(selectedDay + "T00:00:00").toLocaleDateString(dateLocale, {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
        </div>
        <span className="font-mono text-xs px-2.5 py-1 rounded-full bg-black/30 border border-white/10 text-[#c9a24b]">
          {selectedDay}
        </span>
      </div>

      {selectedData && (selectedData.mood !== null || selectedData.habits > 0 || selectedData.decisions > 0 || selectedData.journal > 0 || selectedData.toolbox > 0) ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {/* Mood Tile */}
          <div className="aegis-dock-tile rounded-2xl p-4 text-center shadow-sm">
            <Brain size={16} strokeWidth={1.5} className="text-[#c9a24b] mx-auto mb-1.5" />
            <p className="font-cormorant text-3xl font-light text-[#c9a24b] tabular-nums">
              {selectedData.mood !== null ? `${selectedData.mood}/10` : "—"}
            </p>
            <p className="font-cinzel text-[8.5px] uppercase tracking-wider text-muted-foreground mt-1">
              {t("nav.mood")}
            </p>
          </div>

          {/* Habits Tile */}
          <div className="aegis-dock-tile rounded-2xl p-4 text-center shadow-sm">
            <ListChecks size={16} strokeWidth={1.5} className="text-emerald-400 mx-auto mb-1.5" />
            <p className="font-cormorant text-3xl font-light text-foreground tabular-nums">
              {selectedData.habits}
            </p>
            <p className="font-cinzel text-[8.5px] uppercase tracking-wider text-muted-foreground mt-1">
              {t("nav.habits")}
            </p>
          </div>

          {/* Decisions Tile */}
          <div className="aegis-dock-tile rounded-2xl p-4 text-center shadow-sm">
            <Target size={16} strokeWidth={1.5} className="text-amber-400 mx-auto mb-1.5" />
            <p className="font-cormorant text-3xl font-light text-foreground tabular-nums">
              {selectedData.decisions}
            </p>
            <p className="font-cinzel text-[8.5px] uppercase tracking-wider text-muted-foreground mt-1">
              {t("calendar.legendDecisions")}
            </p>
          </div>

          {/* Journal Tile */}
          <div className="aegis-dock-tile rounded-2xl p-4 text-center shadow-sm">
            <BookOpen size={16} strokeWidth={1.5} className="text-[#6ba4f8] mx-auto mb-1.5" />
            <p className="font-cormorant text-3xl font-light text-foreground tabular-nums">
              {selectedData.journal}
            </p>
            <p className="font-cinzel text-[8.5px] uppercase tracking-wider text-muted-foreground mt-1">
              {t("nav.journal")}
            </p>
          </div>

          {/* Toolbox Tile */}
          <div className="aegis-dock-tile rounded-2xl p-4 text-center shadow-sm col-span-2 sm:col-span-1">
            <Wrench size={16} strokeWidth={1.5} className="text-[#e8c97e] mx-auto mb-1.5" />
            <p className="font-cormorant text-3xl font-light text-foreground tabular-nums">
              {selectedData.toolbox}
            </p>
            <p className="font-cinzel text-[8.5px] uppercase tracking-wider text-muted-foreground mt-1">
              {t("nav.toolbox")}
            </p>
          </div>
        </div>
      ) : (
        <div className="aegis-dock-tile rounded-2xl p-8 text-center shadow-sm space-y-1.5">
          <p className="font-cormorant text-base font-light text-muted-foreground italic">
            {t("common.noActivityToday")}
          </p>
          <p className="font-cinzel text-[9px] uppercase tracking-widest text-muted-foreground/40">
            Aucun événement consigné pour cette journée
          </p>
        </div>
      )}
    </div>
  ) : (
    <div className="aegis-dock-tile rounded-2xl p-10 text-center shadow-sm space-y-2">
      <CalendarIcon size={32} strokeWidth={1} className="mx-auto text-[#c9a24b]/30" />
      <p className="font-cormorant text-lg font-light text-muted-foreground italic">
        {t("calendar.selectDay")}
      </p>
      <p className="font-cinzel text-[9px] uppercase tracking-widest text-muted-foreground/40">
        Cliquez sur une date dans le cadran mensuel
      </p>
    </div>
  );

  const leftPane = (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <p className="font-cinzel text-[10.5px] font-semibold tracking-[0.24em] uppercase text-[#9e7828] dark:text-[#c9a24b] mb-1.5">
          VUE D'ENSEMBLE · BIO-CADENCE
        </p>
        <h1 className="font-cormorant text-3xl sm:text-4xl lg:text-5xl font-light text-foreground tracking-tight">
          {t("nav.calendar")}
        </h1>
        <p className="font-sans text-xs sm:text-sm text-muted-foreground mt-1 max-w-xl leading-relaxed">
          Synchronisation de votre bio-cadence, habitudes, réflexions et micro-décisions.
        </p>
      </div>

      {/* Mobile Segmented Switcher (<lg) */}
      <div className="flex lg:hidden items-center p-1 rounded-xl bg-black/40 border border-white/10 backdrop-blur-md shadow-sm">
        <button
          type="button"
          onClick={() => setMobileTab("calendar")}
          className={cn(
            "flex-1 py-2 px-2 rounded-lg text-xs font-cinzel uppercase tracking-[0.12em] font-medium transition-all text-center",
            mobileTab === "calendar"
              ? "bg-[#c9a24b]/20 text-[#c9a24b] border border-[#c9a24b]/40 shadow-sm font-semibold"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          📅 Calendrier
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("detail")}
          className={cn(
            "flex-1 py-2 px-2 rounded-lg text-xs font-cinzel uppercase tracking-[0.12em] font-medium transition-all text-center",
            mobileTab === "detail"
              ? "bg-[#c9a24b]/20 text-[#c9a24b] border border-[#c9a24b]/40 shadow-sm font-semibold"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          📋 Détail {selectedDay ? `(${selectedDay.split("-").slice(1).reverse().join("/")})` : "du Jour"}
        </button>
      </div>

      {/* Calendar Dial Card */}
      <div className={cn("aegis-dock-tile p-4 sm:p-6 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.35)]", mobileTab !== "calendar" && "hidden lg:block", "mb-[calc(var(--mobile-dock-padding,5rem)+1.5rem)] lg:mb-0")}>
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/[0.08]">
          <button
            type="button"
            onClick={prevMonth}
            className="p-2 rounded-xl border border-white/10 bg-black/20 hover:border-[#c9a24b]/40 hover:bg-[#c9a24b]/10 transition-all text-muted-foreground hover:text-foreground cursor-pointer"
            aria-label="Mois précédent"
          >
            <ChevronLeft size={16} />
          </button>
          <h2 className="font-cinzel text-sm sm:text-base font-semibold text-foreground capitalize tracking-[0.16em]">
            {monthName}
          </h2>
          <button
            type="button"
            onClick={nextMonth}
            className="p-2 rounded-xl border border-white/10 bg-black/20 hover:border-[#c9a24b]/40 hover:bg-[#c9a24b]/10 transition-all text-muted-foreground hover:text-foreground cursor-pointer"
            aria-label="Mois suivant"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Week days header */}
        <div className="grid grid-cols-7 gap-1.5 mb-2">
          {weekDays.map((d) => (
            <div key={d} className="text-center font-cinzel text-[9.5px] uppercase tracking-wider text-muted-foreground py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const data = monthData.get(dateStr);
            const isToday = dateStr === new Date().toISOString().split("T")[0];
            const isSelected = selectedDay === dateStr;
            const hasActivity =
              data &&
              (data.mood !== null ||
                data.habits > 0 ||
                data.decisions > 0 ||
                data.journal > 0 ||
                data.toolbox > 0);

            return (
              <button
                key={day}
                type="button"
                onClick={() => {
                  setSelectedDay(isSelected ? null : dateStr);
                  if (!isSelected) setMobileTab("detail");
                }}
                className={cn(
                  "aspect-square rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-all text-xs relative cursor-pointer",
                  isSelected
                    ? "border-[#c9a24b] bg-[#c9a24b]/20 text-[#c9a24b] shadow-[0_0_16px_rgba(201,162,75,0.3)] font-bold scale-[1.03]"
                    : isToday
                    ? "border-[#c9a24b]/50 bg-[#c9a24b]/10 text-foreground font-bold ring-1 ring-[#c9a24b]/30"
                    : hasActivity
                    ? "border-white/10 bg-black/25 text-foreground hover:border-[#c9a24b]/40 hover:bg-black/35"
                    : "border-transparent bg-transparent text-muted-foreground/60 hover:border-white/10 hover:text-foreground",
                )}
              >
                <span className={cn("font-mono text-xs", isToday ? "text-[#c9a24b] font-bold" : "")}>
                  {day}
                </span>
                {hasActivity && (
                  <div className="flex gap-0.5">
                    {data!.mood !== null && <div className="w-1 h-1 rounded-full bg-[#c9a24b]" />}
                    {data!.habits > 0 && <div className="w-1 h-1 rounded-full bg-emerald-400" />}
                    {data!.decisions > 0 && <div className="w-1 h-1 rounded-full bg-amber-400" />}
                    {data!.journal > 0 && <div className="w-1 h-1 rounded-full bg-[#6ba4f8]" />}
                    {data!.toolbox > 0 && <div className="w-1 h-1 rounded-full bg-[#e8c97e]" />}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-white/[0.08] justify-center">
          {[
            { color: "bg-[#c9a24b]", label: t("nav.mood") },
            { color: "bg-emerald-400", label: t("nav.habits") },
            { color: "bg-amber-400", label: t("calendar.legendDecisions") },
            { color: "bg-[#6ba4f8]", label: t("nav.journal") },
            { color: "bg-[#e8c97e]", label: t("nav.toolbox") },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${item.color}`} />
              <span className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const rightPane = (
    <div className={cn("space-y-4", mobileTab !== "detail" && "hidden lg:block")}>
      <div className="aegis-dock-tile p-5 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <p className="font-cinzel text-[10.5px] font-semibold uppercase tracking-[0.2em] text-[#9e7828] dark:text-[#c9a24b]">
            SYNTHÈSE DU JOUR
          </p>
          {selectedDay && (
            <span className="font-mono text-[10px] text-muted-foreground">
              {selectedDay}
            </span>
          )}
        </div>
        {dayDetailContent}
      </div>
    </div>
  );

  return (
    <MemberPageScaffold width="wide" viewport className="min-w-0 overflow-x-hidden">
      <MemberSplitLayout
        left={leftPane}
        right={rightPane}
        leftColSpan={7}
        rightColSpan={5}
        scrollRight={true}
        scrollLeft={true}
      />
    </MemberPageScaffold>
  );
}
