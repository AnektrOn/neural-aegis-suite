import { useState } from "react";
import { motion } from "framer-motion";
import { Brain, Moon, Flame, UtensilsCrossed, Plus, Minus } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import RadialSlider from "@/components/RadialSlider";
import { useLanguage } from "@/i18n/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import { NeuralCard } from "@/components/ui/neural-card";
import { useMoodHistory } from "@/hooks/useMoodHistory";
import { useAegisMotion } from "@/hooks/useAegisMotion";

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
  "hsl(0 70% 50%)",
  "hsl(20 70% 50%)",
  "hsl(35 80% 55%)",
  "hsl(50 60% 50%)",
  "hsl(120 40% 50%)",
  "hsl(160 50% 50%)",
  "hsl(180 60% 50%)",
  "hsl(180 70% 50%)",
  "hsl(200 70% 55%)",
  "hsl(270 50% 55%)",
];

const mealSizeKeys = ["mood.mealSnack", "mood.mealDemi", "mood.mealNormal"] as const;
const mealSizes = ["snack", "demi", "normal"] as const;
type MealSize = (typeof mealSizes)[number];

const dayKeys = ["mood.daySun", "mood.dayMon", "mood.dayTue", "mood.dayWed", "mood.dayThu", "mood.dayFri", "mood.daySat"] as const;

const moodBarColor = (val: number) =>
  val >= 8 ? "#34D399" : val >= 6 ? "#4F8EF7" : val >= 4 ? "#F59E0B" : "#F87171";

/** Shared diameter for mood / sleep / stress radial sliders */
const MOOD_TRACKER_SLIDER_SIZE = 168;

export default function MoodTracker() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { fadeUp } = useAegisMotion();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const frequencies = frequencyKeys.map((key, i) => ({ value: i + 1, label: t(key), color: frequencyColors[i] }));
  const dayNames = dayKeys.map((k) => t(k));
  const [currentMood, setCurrentMood] = useState(7.0);
  const [sleep, setSleep] = useState(7.0);
  const [stress, setStress] = useState(3.0);
  const [meals, setMeals] = useState<MealSize[]>([]);
  const [loading, setLoading] = useState(false);
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

  if (isMobile) {
    return (
      <div className="space-y-6 max-w-full pt-2">
        <div>
          <p className="font-display text-[10px] tracking-[0.22em] uppercase text-text-tertiary/70 mb-2">{t("mood.emotionalIntelligence")}</p>
          <h1 className="font-cormorant text-3xl font-light text-text-primary tracking-tight">{t("mood.frequency")}</h1>
        </div>

        <NeuralCard variant="default" glow="none" className="glass-card p-4 text-center border-0">
          <p className="text-sm text-text-secondary">
            Pour logger rapidement, utilisez{" "}
            <button
              type="button"
              onClick={() => navigate("/", { state: { openQuickLog: true } })}
              className="text-primary underline-offset-2 underline font-medium"
            >
              Logger maintenant
            </button>{" "}
            depuis le Dashboard.
          </p>
        </NeuralCard>

        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <NeuralCard glow="none" className="glass-card p-4 border-0">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-4 rounded-full bg-primary" />
              <h2 className="font-display text-[11px] tracking-[0.15em] uppercase text-text-secondary">{t("mood.weeklyFrequency")}</h2>
            </div>
            {chartData.every((e) => e.mood === 0) ? (
              <div className="flex flex-col items-center justify-center h-40 gap-2 text-center">
                <p className="font-cormorant text-lg font-light text-text-tertiary/70 italic">{t("mood.historyEmpty")}</p>
                <p className="font-display text-[10px] tracking-[0.18em] uppercase text-text-tertiary/40">Loggez depuis le Dashboard</p>
              </div>
            ) : (
              <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="hsl(var(--border)/0.3)" strokeDasharray="0" />
                    <XAxis dataKey="day" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }} axisLine={false} tickLine={false} interval={0} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }} domain={[0, 10]} axisLine={false} tickLine={false} width={28} />
                    <Bar dataKey="mood" radius={[4, 4, 0, 0]} maxBarSize={28}>
                      {chartData.map((entry, i) => (
                        <Cell key={i} fill={entry.mood > 0 ? moodBarColor(entry.mood) : "hsl(var(--border))"} fillOpacity={entry.mood > 0 ? 0.85 : 0.35} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </NeuralCard>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-10 max-w-5xl">
      <div>
        <p className="font-display text-[10px] tracking-[0.22em] uppercase text-text-tertiary/70 mb-2">{t("mood.emotionalIntelligence")}</p>
        <h1 className="font-cormorant text-3xl sm:text-4xl font-light text-text-primary tracking-tight">{t("mood.frequency")}</h1>
      </div>

      <NeuralCard glow="purple" className="relative p-4 sm:p-8">
        <div className="flex items-center gap-2 mb-6 sm:mb-8">
          <div className="w-1.5 h-4 rounded-full bg-accent-secondary" />
          <h2 className="font-display text-[11px] tracking-[0.15em] uppercase text-text-secondary">{t("mood.label")}</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 items-start justify-items-center">
          <div className="flex w-full max-w-[220px] flex-col items-center slider-mood">
            <Brain size={20} strokeWidth={1} className="mb-3 text-accent-secondary" />
            <RadialSlider
              value={currentMood}
              onChange={setCurrentMood}
              min={0}
              max={10}
              step={0.1}
              size={MOOD_TRACKER_SLIDER_SIZE}
              label={t("mood.label")}
              color="#7C6DFA"
            />
            <motion.p
              key={selectedFreq.label}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-neural-label mt-3 min-h-[2.5rem] text-center max-w-[200px] flex items-center justify-center"
              style={{ color: selectedFreq.color }}
            >
              {selectedFreq.label}
            </motion.p>
          </div>
          <div className="flex w-full max-w-[220px] flex-col items-center slider-sleep">
            <Moon size={20} strokeWidth={1} className="mb-3 text-accent-primary" />
            <RadialSlider
              value={sleep}
              onChange={setSleep}
              min={0}
              max={12}
              step={0.1}
              size={MOOD_TRACKER_SLIDER_SIZE}
              label={t("mood.sleep")}
              color="#4F8EF7"
              formatValue={(v) => `${v.toFixed(1)}h`}
            />
            <div className="mt-3 min-h-[2.5rem] max-w-[200px]" aria-hidden />
          </div>
          <div className="flex w-full max-w-[220px] flex-col items-center slider-stress">
            <Flame size={20} strokeWidth={1} className="mb-3 text-accent-danger" />
            <RadialSlider
              value={stress}
              onChange={setStress}
              min={0}
              max={10}
              step={0.1}
              size={MOOD_TRACKER_SLIDER_SIZE}
              label={t("mood.stress")}
              color="#F87171"
            />
            <div className="mt-3 min-h-[2.5rem] max-w-[200px]" aria-hidden />
          </div>
        </div>

        <div className="mt-10 border-t border-border-subtle/60 pt-8">
          <div className="flex items-center gap-2 mb-4">
            <UtensilsCrossed size={16} strokeWidth={1.5} className="text-accent-warning" />
            <p className="text-neural-label">{t("mood.mealsToday", { count: meals.length })}</p>
          </div>
          <div className="flex flex-wrap gap-2 mb-4 min-h-[40px]">
            {meals.map((m, i) => (
              <motion.button
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                type="button"
                onClick={() => removeMeal(i)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border-active bg-bg-elevated text-xs text-text-primary hover:border-accent-danger/40 hover:bg-accent-danger/5 transition-all duration-200 group"
              >
                <span>{t(mealSizeKeys[mealSizes.indexOf(m)])}</span>
                <Minus size={10} className="text-text-tertiary group-hover:text-accent-danger" strokeWidth={1.5} />
              </motion.button>
            ))}
            {meals.length === 0 && <p className="text-text-secondary text-xs">{t("mood.noMealsAdded")}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            {mealSizes.map((size, idx) => (
              <button
                key={size}
                type="button"
                onClick={() => addMeal(size)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border-active text-xs text-text-secondary hover:text-text-primary hover:border-accent-primary/40 hover:bg-accent-primary/5 transition-all duration-200"
              >
                <Plus size={12} strokeWidth={1.5} />
                {t(mealSizeKeys[idx])}
              </button>
            ))}
          </div>
        </div>

        <button type="button" onClick={logMood} disabled={loading} className="btn-neural mt-8 mx-auto">
          {loading ? t("mood.saving") : t("mood.save")}
        </button>
      </NeuralCard>

      <NeuralCard glow="none" className="glass-card p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-1.5 h-4 rounded-full bg-primary" />
          <p className="font-display text-[11px] tracking-[0.15em] uppercase text-text-secondary">{t("mood.weeklyMap")}</p>
        </div>
        {chartData.every(e => e.mood === 0) ? (
          <div className="flex flex-col items-center justify-center h-56 gap-3 text-center">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden className="text-primary/20">
              <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="1.5" />
              <path d="M16 28c1.5-3 4-5 8-5s6.5 2 8 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="18" cy="20" r="2" fill="currentColor" />
              <circle cx="30" cy="20" r="2" fill="currentColor" />
            </svg>
            <p className="font-cormorant text-xl font-light text-text-tertiary/70 italic">{t("mood.historyEmpty")}</p>
            <p className="font-display text-[10px] tracking-[0.18em] uppercase text-text-tertiary/40">Loggez votre premier mood</p>
          </div>
        ) : (
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
              <CartesianGrid vertical={false} stroke="hsl(var(--border)/0.3)" strokeDasharray="0" />
              <XAxis dataKey="day" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} domain={[0, 10]} axisLine={false} tickLine={false} width={32} />
              <Bar dataKey="mood" radius={[4, 4, 0, 0]} maxBarSize={32}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.mood > 0 ? moodBarColor(entry.mood) : "hsl(var(--border))"} fillOpacity={entry.mood > 0 ? 0.85 : 0.4} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        )}
      </NeuralCard>
    </div>
  );
}
