import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Brain, Moon, Flame, UtensilsCrossed, Plus, Minus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import RadialSlider from "@/components/RadialSlider";
import { useLanguage } from "@/i18n/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";

const frequencyKeys = [
  "mood.exhausted", "mood.low", "mood.agitated", "mood.neutral", "mood.balanced",
  "mood.focused", "mood.high", "mood.flow", "mood.optimal", "mood.transcendent",
] as const;

const frequencyColors = [
  "hsl(0 70% 50%)", "hsl(20 70% 50%)", "hsl(35 80% 55%)", "hsl(50 60% 50%)", "hsl(120 40% 50%)",
  "hsl(160 50% 50%)", "hsl(180 60% 50%)", "hsl(180 70% 50%)", "hsl(200 70% 55%)", "hsl(270 50% 55%)",
];

const mealSizeKeys = ["mood.mealSnack", "mood.mealDemi", "mood.mealNormal"] as const;
const mealSizes = ["snack", "demi", "normal"] as const;
type MealSize = typeof mealSizes[number];

const dayKeys = ["mood.daySun", "mood.dayMon", "mood.dayTue", "mood.dayWed", "mood.dayThu", "mood.dayFri", "mood.daySat"] as const;

export default function MoodTracker() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const frequencies = frequencyKeys.map((key, i) => ({ value: i + 1, label: t(key), color: frequencyColors[i] }));
  const dayNames = dayKeys.map((k) => t(k));
  const [currentMood, setCurrentMood] = useState(7.0);
  const [sleep, setSleep] = useState(7.0);
  const [stress, setStress] = useState(3.0);
  const [meals, setMeals] = useState<MealSize[]>([]);
  const [weekHistory, setWeekHistory] = useState<{ day: string; value: number }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) loadHistory();
  }, [user]);

  const loadHistory = async () => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const { data } = await supabase
      .from("mood_entries" as any)
      .select("value, logged_at")
      .eq("user_id", user!.id)
      .gte("logged_at", sevenDaysAgo.toISOString())
      .order("logged_at", { ascending: true });

    const byDay = new Map<string, number>();
    (data || []).forEach((entry: any) => {
      const d = new Date(entry.logged_at);
      byDay.set(dayNames[d.getDay()], entry.value);
    });

    const result: { day: string; value: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      result.push({ day: dayNames[d.getDay()], value: byDay.get(dayNames[d.getDay()]) || 0 });
    }
    setWeekHistory(result);
  };

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
      toast({ title: t("mood.saved"), description: t("mood.frequencyLabel", { value: currentMood.toFixed(1), label: frequencies[moodIdx].label }) });
      loadHistory();
    }
    setLoading(false);
  };

  const addMeal = (size: MealSize) => setMeals((prev) => [...prev, size]);
  const removeMeal = (index: number) => setMeals((prev) => prev.filter((_, i) => i !== index));

  const moodIdx = Math.min(Math.max(Math.round(currentMood) - 1, 0), 9);
  const selectedFreq = frequencies[moodIdx];

  // ─── Mobile layout (lightweight, redirect to Quick Log from Dashboard) ───────────
  if (isMobile) {
    return (
      <div className="space-y-6 max-w-full pt-2">
        <div>
          <p className="text-neural-label mb-2">{t("mood.emotionalIntelligence")}</p>
          <h1 className="text-neural-title text-2xl text-foreground">Historique</h1>
        </div>

        {/* Redirection vers quick log */}
        <div className="ethereal-glass p-4 text-center">
          <p className="text-sm text-muted-foreground/70">
            Pour logger rapidement, utilisez{" "}
            <button
              type="button"
              onClick={() => navigate("/", { state: { openQuickLog: true } })}
              className="text-primary underline-offset-2 underline"
            >
              Logger maintenant
            </button>{" "}
            depuis le Dashboard.
          </p>
        </div>

        {/* Graphe hebdomadaire uniquement */}
        {weekHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="ethereal-glass p-5"
          >
            <p className="text-neural-label mb-5">Fréquence hebdomadaire</p>
            <div className="flex items-end justify-between gap-2 h-28">
              {weekHistory.map((entry, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                  {entry.value > 0 ? (
                    <div
                      className="w-full rounded-lg"
                      style={{
                        height: `${(entry.value / 10) * 100}%`,
                        minHeight: "4px",
                        background: `hsl(var(--primary) / 0.2)`,
                        border: `1px solid hsl(var(--primary) / 0.3)`,
                      }}
                    />
                  ) : (
                    <div className="w-full h-1 rounded-lg bg-secondary/30" />
                  )}
                  <span className="text-[9px] text-muted-foreground/50 uppercase">{entry.day}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    );
  }

  // ─── Desktop layout ───────────────────────────────────────────────────────────
  return (
    <div className="space-y-10 max-w-5xl">
      <div>
        <p className="text-neural-label mb-3">{t("mood.emotionalIntelligence")}</p>
        <h1 className="text-neural-title text-3xl text-foreground">{t("mood.frequency")}</h1>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="ethereal-glass p-4 sm:p-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 items-center justify-items-center">
          <div className="flex flex-col items-center">
            <Brain size={20} strokeWidth={1} className="mb-3" style={{ color: selectedFreq.color }} />
            <RadialSlider value={currentMood} onChange={setCurrentMood} min={0} max={10} step={0.1} size={160} label={t("mood.label")} color={selectedFreq.color} />
            <motion.p key={selectedFreq.label} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-neural-label mt-2" style={{ color: selectedFreq.color }}>
              {selectedFreq.label}
            </motion.p>
          </div>
          <div className="flex flex-col items-center">
            <Moon size={20} strokeWidth={1} className="mb-3 text-blue-400" />
            <RadialSlider value={sleep} onChange={setSleep} min={0} max={10} step={0.1} size={160} label={t("mood.sleep")} color="hsl(220 70% 60%)" formatValue={(v) => `${v.toFixed(1)}h`} />
          </div>
          <div className="flex flex-col items-center">
            <Flame size={20} strokeWidth={1} className="mb-3 text-red-400" />
            <RadialSlider value={stress} onChange={setStress} min={0} max={10} step={0.1} size={160} label={t("mood.stress")} color="hsl(0 70% 55%)" />
          </div>
        </div>

        <div className="mt-10 border-t border-border/30 pt-8">
          <div className="flex items-center gap-2 mb-4">
            <UtensilsCrossed size={16} strokeWidth={1.5} className="text-neural-warm" />
            <p className="text-neural-label">{t("mood.mealsToday", { count: meals.length })}</p>
          </div>
          <div className="flex flex-wrap gap-2 mb-4 min-h-[40px]">
            {meals.map((m, i) => (
              <motion.button key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} onClick={() => removeMeal(i)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/40 bg-secondary/30 text-xs text-foreground hover:border-destructive/40 hover:bg-destructive/5 transition-all group">
                <span>{t(mealSizeKeys[mealSizes.indexOf(m)])}</span>
                <Minus size={10} className="text-muted-foreground group-hover:text-destructive" />
              </motion.button>
            ))}
            {meals.length === 0 && <p className="text-muted-foreground text-xs">{t("mood.noMealsAdded")}</p>}
          </div>
          <div className="flex gap-2">
            {mealSizes.map((size, idx) => (
              <button key={size} onClick={() => addMeal(size)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border/30 text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5 transition-all">
                <Plus size={12} />
                {t(mealSizeKeys[idx])}
              </button>
            ))}
          </div>
        </div>

        <button onClick={logMood} disabled={loading} className="btn-neural mt-8 mx-auto">
          {loading ? t("mood.saving") : t("mood.save")}
        </button>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="ethereal-glass p-8">
        <p className="text-neural-label mb-6">{t("mood.weeklyMap")}</p>
        <div className="flex items-end justify-between gap-3 h-40">
          {weekHistory.map((entry, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              {entry.value > 0 ? (
                <motion.div initial={{ height: 0 }} animate={{ height: `${(entry.value / 10) * 100}%` }} transition={{ delay: i * 0.08, duration: 0.5 }}
                  className="w-full rounded-xl relative overflow-hidden"
                  style={{ backgroundColor: frequencies[Math.min(entry.value - 1, 9)].color + "20", border: `1px solid ${frequencies[Math.min(entry.value - 1, 9)].color}30` }}>
                  <div className="absolute bottom-0 w-full h-1/3" style={{ background: `linear-gradient(to top, ${frequencies[Math.min(entry.value - 1, 9)].color}15, transparent)` }} />
                </motion.div>
              ) : (
                <div className="w-full h-2 rounded-xl bg-secondary/20" />
              )}
              <span className="text-neural-label">{entry.day}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
