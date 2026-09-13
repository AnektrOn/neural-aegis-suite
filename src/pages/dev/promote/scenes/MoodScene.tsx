import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, XAxis, YAxis } from "recharts";
import RadialSlider from "@/components/RadialSlider";
import { NeuralCard } from "@/components/ui/neural-card";
import { useLanguage } from "@/i18n/LanguageContext";
import { PROMOTE_MOOD_WEEK, copy } from "../promoteDemoData";
import { usePromotePlayer } from "../PromotePlayerContext";

const moodBarColor = (val: number) =>
  val >= 8 ? "#34D399" : val >= 6 ? "#4F8EF7" : val >= 4 ? "#F59E0B" : "#F87171";

export function MoodScene() {
  const { t } = useLanguage();
  const { isFR } = usePromotePlayer();
  const [mood, setMood] = useState(7.8);
  const [sleep, setSleep] = useState(7.2);
  const [stress, setStress] = useState(3.1);
  const chartData = PROMOTE_MOOD_WEEK.map((d) => ({ day: copy(isFR, d.dayFr, d.dayEn), mood: d.mood }));

  return (
    <div className="space-y-5 pb-6 pt-2">
      <div>
        <p className="mb-2 font-display text-[10px] uppercase tracking-[0.22em] text-text-tertiary/70">
          {t("mood.emotionalIntelligence")}
        </p>
        <h1 className="font-cormorant text-3xl font-light tracking-tight">{t("mood.frequency")}</h1>
      </div>
      <div className="flex justify-center gap-2">
        <RadialSlider value={mood} onChange={setMood} label={copy(isFR, "Énergie", "Energy")} size={108} />
        <RadialSlider value={sleep} onChange={setSleep} label={copy(isFR, "Sommeil", "Sleep")} size={108} color="hsl(200 70% 55%)" />
        <RadialSlider value={stress} onChange={setStress} label={copy(isFR, "Stress", "Stress")} size={108} color="hsl(20 70% 50%)" />
      </div>
      <NeuralCard glow="none" className="glass-card border-0 p-4">
        <h2 className="mb-3 font-display text-[11px] uppercase tracking-[0.15em] text-text-secondary">
          {t("mood.weeklyFrequency")}
        </h2>
        <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="hsl(var(--border)/0.3)" />
              <XAxis dataKey="day" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }} domain={[0, 10]} axisLine={false} tickLine={false} width={28} />
              <Bar dataKey="mood" radius={[4, 4, 0, 0]} maxBarSize={28}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={moodBarColor(entry.mood)} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </NeuralCard>
    </div>
  );
}
