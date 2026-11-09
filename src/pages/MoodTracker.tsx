import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Moon, Flame, UtensilsCrossed, Plus, Minus, Sparkles, TrendingUp, CheckCircle2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import RadialSlider from "@/components/RadialSlider";
import { useLanguage } from "@/i18n/LanguageContext";
import { useMoodHistory } from "@/hooks/useMoodHistory";
import { useIsMobile } from "@/hooks/use-mobile";
import { MemberPageScaffold } from "@/layouts/MemberPageScaffold";
import { MemberSplitLayout } from "@/layouts/MemberSplitLayout";
import { cn } from "@/lib/utils";

const frequencyKeys = [
  "mood.exhausted",
  "mood.low",
  "mood.agitated",
  "mood.neutral",
  "mood.balanced",
  "mood.focused",
  "mood.high",
  "mood.flow",
  "mood.optimal",
  "mood.transcendent",
] as const;

const frequencyColors = [
  "#78716c", // exhausted (pierre/stone)
  "#a8715a", // low (terre de sienne)
  "#c2884a", // agitated (ambre sombre)
  "#a39b8b", // neutral (ivoire minéral)
  "#8aa878", // balanced (sauge douce)
  "#6ba4a8", // focused (céladon)
  "#5e9fd8", // high (bleu céruléen)
  "#7b86dc", // flow (iris profond)
  "#c9a24b", // optimal (or impérial)
  "#e8c97e", // transcendent (or solaire pur)
];

const mealSizeKeys = ["mood.mealSnack", "mood.mealDemi", "mood.mealNormal"] as const;
const mealSizes = ["snack", "demi", "normal"] as const;
type MealSize = (typeof mealSizes)[number];

const dayKeys = ["mood.daySun", "mood.dayMon", "mood.dayTue", "mood.dayWed", "mood.dayThu", "mood.dayFri", "mood.daySat"] as const;

export default function MoodTracker() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const frequencies = frequencyKeys.map((key, i) => ({ value: i + 1, label: t(key), color: frequencyColors[i] }));
  const dayNames = useMemo(() => dayKeys.map((k) => t(k)), [t]);

  const [currentMood, setCurrentMood] = useState(7.0);
  const [sleep, setSleep] = useState(7.0);
  const [stress, setStress] = useState(3.0);
  const [meals, setMeals] = useState<MealSize[]>([]);
  const [loading, setLoading] = useState(false);
  const isMobile = useIsMobile();
  const [mobileTab, setMobileTab] = useState<"log" | "trends">("log");

  const mainDialSize = isMobile ? 144 : 168;
  const satelliteDialSize = isMobile ? 108 : 124;

  const moodHistoryQuery = useMoodHistory(user?.id, dayNames);
  const weekHistory = moodHistoryQuery.data ?? [];

  const logMood = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("mood_entries" as any).insert({
      user_id: user.id,
      value: Math.round(currentMood),
      sleep,
      stress,
      meals_count: meals.length,
      meals: meals.map((size) => ({ size })),
    } as any);

    if (error) {
      toast({ title: t("toast.error"), description: error.message, variant: "destructive" });
    } else {
      const moodIdx = Math.min(Math.max(Math.round(currentMood) - 1, 0), 9);
      toast({
        title: t("mood.saved"),
        description: t("mood.frequencyLabel", { value: currentMood.toFixed(1), label: frequencies[moodIdx].label }),
      });
      void moodHistoryQuery.refetch();
    }
    setLoading(false);
  };

  const addMeal = (size: MealSize) => setMeals((prev) => [...prev, size]);
  const removeMeal = (index: number) => setMeals((prev) => prev.filter((_, i) => i !== index));

  const moodIdx = Math.min(Math.max(Math.round(currentMood) - 1, 0), 9);
  const selectedFreq = frequencies[moodIdx];
  const chartData = weekHistory.map((e) => ({ day: e.day, mood: e.value }));

  // Telemetry computation
  const recordedEntries = weekHistory.filter((e) => e.value > 0);
  const avgMood = recordedEntries.length > 0
    ? (recordedEntries.reduce((acc, curr) => acc + curr.value, 0) / recordedEntries.length).toFixed(1)
    : "—";
  const peakMood = recordedEntries.length > 0
    ? Math.max(...recordedEntries.map((e) => e.value)).toFixed(1)
    : "—";
  const consistencyPct = Math.round((recordedEntries.length / 7) * 100);

  const leftPane = (
    <div className="flex flex-col gap-4 h-full justify-between">
      {/* Header */}
      <div>
        <p className="font-cinzel text-[10.5px] font-semibold tracking-[0.24em] uppercase text-[#9e7828] dark:text-[#c9a24b] mb-1.5">
          INTELLIGENCE ÉMOTIONNELLE · CHRONO-CADENCE
        </p>
        <h1 className="font-cormorant text-3xl sm:text-4xl lg:text-5xl font-light text-foreground tracking-tight">
          {t("mood.frequency")}
        </h1>
        <p className="font-sans text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
          Régulez votre clarté mentale, repos circadien et tension nerveuse en temps réel.
        </p>
      </div>

      {/* Main Dial Stage */}
      <div className="aegis-dock-tile relative rounded-2xl p-5 sm:p-6 shadow-[0_8px_32px_rgba(0,0,0,0.35)] flex flex-col justify-between">
        {/* Dominant Dial: Mental Clarity & Frequency */}
        <div className="flex flex-col items-center justify-center pt-1 pb-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Brain size={16} strokeWidth={1.5} className="text-[#c9a24b]" />
            <span className="font-cinzel text-[10.5px] font-semibold uppercase tracking-[0.2em] text-[#c9a24b]">
              {t("mood.label")} · Valence
            </span>
          </div>
          <RadialSlider
            value={currentMood}
            onChange={setCurrentMood}
            min={0}
            max={10}
            step={0.1}
            size={mainDialSize}
            label={t("mood.label")}
            color="#c9a24b"
          />
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedFreq.label}
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -3 }}
              className="mt-2.5 px-3 py-1 rounded-full border border-white/10 bg-black/30 flex items-center gap-2"
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedFreq.color }} />
              <span className="font-cinzel text-xs uppercase tracking-wider text-foreground font-semibold">
                {selectedFreq.label}
              </span>
              <span className="font-mono text-[10.5px] text-[#c9a24b] font-bold">
                {currentMood.toFixed(1)}/10
              </span>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Satellite Dials: Sleep & Stress */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/[0.08]">
          {/* Sleep Dial */}
          <div className="flex flex-col items-center p-2 rounded-xl bg-black/20 border border-white/5">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Moon size={14} strokeWidth={1.5} className="text-[#6ba4f8]" />
              <span className="font-cinzel text-[9.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t("mood.sleep")}
              </span>
            </div>
            <RadialSlider
              value={sleep}
              onChange={setSleep}
              min={0}
              max={12}
              step={0.1}
              size={satelliteDialSize}
              label={t("mood.sleep")}
              color="#6ba4f8"
              formatValue={(v) => `${v.toFixed(1)}h`}
            />
          </div>

          {/* Stress Dial */}
          <div className="flex flex-col items-center p-2 rounded-xl bg-black/20 border border-white/5">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Flame size={14} strokeWidth={1.5} className="text-[#f87171]" />
              <span className="font-cinzel text-[9.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t("mood.stress")}
              </span>
            </div>
            <RadialSlider
              value={stress}
              onChange={setStress}
              min={0}
              max={10}
              step={0.1}
              size={satelliteDialSize}
              label={t("mood.stress")}
              color="#f87171"
            />
          </div>
        </div>

        {/* Meals Tracking Strip */}
        <div className="mt-4 border-t border-white/[0.08] pt-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <UtensilsCrossed size={13} strokeWidth={1.5} className="text-[#c9a24b]" />
              <p className="font-cinzel text-[9.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t("mood.mealsToday", { count: meals.length })}
              </p>
            </div>
            <span className="font-mono text-[10px] text-muted-foreground">
              {meals.length} {meals.length > 1 ? "repas" : "repas"}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-2.5 min-h-[30px]">
            {meals.map((m, i) => (
              <motion.button
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                type="button"
                onClick={() => removeMeal(i)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-white/10 bg-black/30 text-xs text-foreground hover:border-red-400/40 hover:bg-red-500/10 transition-all cursor-pointer group"
                title="Supprimer ce repas"
              >
                <span>{t(mealSizeKeys[mealSizes.indexOf(m)])}</span>
                <Minus size={11} className="text-muted-foreground group-hover:text-red-400" strokeWidth={1.5} />
              </motion.button>
            ))}
            {meals.length === 0 && (
              <p className="text-muted-foreground/60 text-xs italic py-0.5">{t("mood.noMealsAdded")}</p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {mealSizes.map((size, idx) => (
              <button
                key={size}
                type="button"
                onClick={() => addMeal(size)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-black/20 text-xs font-cinzel uppercase tracking-wider text-muted-foreground hover:text-foreground hover:border-[#c9a24b]/40 hover:bg-[#c9a24b]/10 transition-all cursor-pointer"
              >
                <Plus size={11} strokeWidth={1.5} />
                {t(mealSizeKeys[idx])}
              </button>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={logMood}
          disabled={loading}
          className="btn-solaire w-full mt-4 py-2.5 rounded-xl font-cinzel text-xs uppercase tracking-[0.18em] font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-60"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
          ) : (
            <Sparkles size={14} />
          )}
          <span>{loading ? t("mood.saving") : t("mood.save")}</span>
        </button>
      </div>
    </div>
  );

  const rightPane = (
    <div className="space-y-4">
      {/* Weekly History & Telemetry Bento */}
      <div className="aegis-dock-tile rounded-2xl p-5 sm:p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)] space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-4 rounded-full bg-[#c9a24b]" />
            <h2 className="font-cinzel text-[11px] font-semibold tracking-[0.16em] uppercase text-muted-foreground">
              {t("mood.weeklyMap")} · Tendance 7 Jours
            </h2>
          </div>
          <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
            {recordedEntries.length}/7 consignés
          </span>
        </div>

        {/* Telemetry Strip */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-xl bg-black/25 border border-white/5 flex flex-col items-center justify-center">
            <span className="font-cinzel text-[8.5px] uppercase tracking-wider text-muted-foreground">
              Moyenne 7j
            </span>
            <span className="font-cormorant text-2xl font-light text-[#c9a24b] mt-0.5 tabular-nums">
              {avgMood !== "—" ? `${avgMood}` : "—"}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-black/25 border border-white/5 flex flex-col items-center justify-center">
            <span className="font-cinzel text-[8.5px] uppercase tracking-wider text-muted-foreground">
              Pic de Clarté
            </span>
            <span className="font-cormorant text-2xl font-light text-foreground mt-0.5 tabular-nums">
              {peakMood !== "—" ? `${peakMood}` : "—"}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-black/25 border border-white/5 flex flex-col items-center justify-center">
            <span className="font-cinzel text-[8.5px] uppercase tracking-wider text-muted-foreground">
              Régularité
            </span>
            <span className="font-cormorant text-2xl font-light text-emerald-400 mt-0.5 tabular-nums">
              {consistencyPct}%
            </span>
          </div>
        </div>

        {/* Frequency Wave Area Chart */}
        {chartData.every((e) => e.mood === 0) ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-center">
            <svg width="40" height="40" viewBox="0 0 48 48" fill="none" aria-hidden className="text-[#c9a24b]/20">
              <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="1.5" />
              <path d="M16 28c1.5-3 4-5 8-5s6.5 2 8 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="18" cy="20" r="2" fill="currentColor" />
              <circle cx="30" cy="20" r="2" fill="currentColor" />
            </svg>
            <p className="font-cormorant text-lg font-light text-muted-foreground/70 italic">{t("mood.historyEmpty")}</p>
            <p className="font-cinzel text-[9.5px] tracking-[0.18em] uppercase text-muted-foreground/40">
              Enregistrez vos premières métriques
            </p>
          </div>
        ) : (
          <div className="h-48 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -22, bottom: 0 }}>
                <defs>
                  <linearGradient id="moodGoldGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#c9a24b" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#c9a24b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                <XAxis
                  dataKey="day"
                  tick={{ fill: "#9a968b", fontSize: 10, fontFamily: "var(--font-mono, monospace)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 10]}
                  tick={{ fill: "#9a968b", fontSize: 10, fontFamily: "var(--font-mono, monospace)" }}
                  axisLine={false}
                  tickLine={false}
                  width={28}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const val = payload[0].value as number;
                    return (
                      <div className="aegis-dock-tile px-3 py-1.5 rounded-xl border border-[#c9a24b]/30 shadow-lg text-xs">
                        <span className="font-mono text-[#c9a24b] font-bold">
                          {val > 0 ? `${val}/10` : "Non consigné"}
                        </span>
                      </div>
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="mood"
                  stroke="#c9a24b"
                  strokeWidth={2.5}
                  fill="url(#moodGoldGradient)"
                  dot={{ fill: "#070707", stroke: "#c9a24b", strokeWidth: 2, r: 4 }}
                  activeDot={{ fill: "#c9a24b", stroke: "#fff", strokeWidth: 2, r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Valence Spectrum & Interactive Guide */}
      <div className="aegis-dock-tile rounded-2xl p-5 space-y-3 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
          <p className="font-cinzel text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c9a24b]">
            ÉCHELLE DE VALENCE ÉMOTIONNELLE
          </p>
          <span className="font-mono text-[9px] text-muted-foreground uppercase">
            10 Niveaux Harmoniques
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          {frequencies.map((freq) => {
            const isSelected = Math.round(currentMood) === freq.value;
            return (
              <button
                key={freq.value}
                type="button"
                onClick={() => setCurrentMood(freq.value)}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-xl border transition-all cursor-pointer text-left",
                  isSelected
                    ? "border-[#c9a24b]/50 bg-[#c9a24b]/15 shadow-sm"
                    : "border-white/5 bg-black/20 hover:border-white/15 hover:bg-black/30",
                )}
              >
                <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: freq.color }} />
                <span className="font-mono text-[10px] text-muted-foreground w-4">{freq.value}</span>
                <span className={cn("text-[11px] truncate flex-1", isSelected ? "text-[#c9a24b] font-semibold" : "text-foreground")}>
                  {freq.label}
                </span>
                {isSelected && <CheckCircle2 size={12} className="text-[#c9a24b] shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <MemberPageScaffold width="wide" viewport className="min-w-0 overflow-x-hidden">
      {/* Mobile-only Segmented Bar (<lg) */}
      <div className="lg:hidden px-4 pt-3 pb-1">
        <div className="flex items-center justify-between gap-1 p-1 rounded-xl bg-black/40 border border-white/10 backdrop-blur-md member-top-dock-margin-end">
          <button
            type="button"
            onClick={() => setMobileTab("log")}
            className={cn(
              "flex-1 min-h-[36px] flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg font-cinzel text-[9.5px] font-semibold uppercase tracking-wider transition-all",
              mobileTab === "log"
                ? "bg-[#c9a24b] text-[#0b0b0a] shadow-sm font-bold"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Brain size={12} strokeWidth={1.5} />
            <span>Saisie & Cadrans</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("trends")}
            className={cn(
              "flex-1 min-h-[36px] flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg font-cinzel text-[9.5px] font-semibold uppercase tracking-wider transition-all",
              mobileTab === "trends"
                ? "bg-[#c9a24b] text-[#0b0b0a] shadow-sm font-bold"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <TrendingUp size={12} strokeWidth={1.5} />
            <span>Tendance 7j & Guide</span>
          </button>
        </div>
      </div>

      {/* Desktop Split View (>=lg) */}
      <div className="hidden lg:contents">
        <MemberSplitLayout
          left={leftPane}
          right={rightPane}
          leftColSpan={6}
          rightColSpan={6}
          scrollRight={true}
          scrollLeft={true}
        />
      </div>

      {/* Mobile Active Views (<lg) */}
      <div className="lg:hidden px-4 pb-6">
        {mobileTab === "log" && <div className="pt-2">{leftPane}</div>}
        {mobileTab === "trends" && <div className="pt-2">{rightPane}</div>}
      </div>
    </MemberPageScaffold>
  );
}
