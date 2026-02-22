import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Brain } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const frequencies = [
  { value: 1, label: "Depleted", color: "hsl(0 70% 50%)" },
  { value: 2, label: "Low", color: "hsl(20 70% 50%)" },
  { value: 3, label: "Restless", color: "hsl(35 80% 55%)" },
  { value: 4, label: "Neutral", color: "hsl(50 60% 50%)" },
  { value: 5, label: "Balanced", color: "hsl(120 40% 50%)" },
  { value: 6, label: "Focused", color: "hsl(160 50% 50%)" },
  { value: 7, label: "Elevated", color: "hsl(180 60% 50%)" },
  { value: 8, label: "Flow", color: "hsl(180 70% 50%)" },
  { value: 9, label: "Peak", color: "hsl(200 70% 55%)" },
  { value: 10, label: "Transcendent", color: "hsl(270 50% 55%)" },
];

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function MoodTracker() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentMood, setCurrentMood] = useState(7);
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

    // Group by day, take latest per day
    const byDay = new Map<string, number>();
    (data || []).forEach((entry: any) => {
      const d = new Date(entry.logged_at);
      const key = dayNames[d.getDay()];
      byDay.set(key, entry.value);
    });

    // Build last 7 days
    const result: { day: string; value: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = dayNames[d.getDay()];
      result.push({ day: key, value: byDay.get(key) || 0 });
    }
    setWeekHistory(result);
  };

  const logMood = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("mood_entries" as any).insert({
      user_id: user.id,
      value: currentMood,
    } as any);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Logged", description: `Frequency ${currentMood} — ${frequencies[currentMood - 1].label}` });
      loadHistory();
    }
    setLoading(false);
  };

  const selectedFreq = frequencies[currentMood - 1];

  return (
    <div className="space-y-10 max-w-4xl">
      <div>
        <p className="text-neural-label mb-3">Emotional Intelligence</p>
        <h1 className="text-neural-title text-3xl text-foreground">Mood Frequency</h1>
      </div>

      {/* Current State */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="ethereal-glass p-10 text-center">
        <div className="mb-8">
          <Brain size={32} strokeWidth={1} className="mx-auto mb-4" style={{ color: selectedFreq.color }} />
          <motion.p key={currentMood} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-5xl font-cinzel font-light mb-2" style={{ color: selectedFreq.color }}>
            {currentMood}
          </motion.p>
          <motion.p key={selectedFreq.label} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-neural-label" style={{ color: selectedFreq.color }}>
            {selectedFreq.label}
          </motion.p>
        </div>

        <div className="relative px-4">
          <input type="range" min={1} max={10} value={currentMood} onChange={(e) => setCurrentMood(parseInt(e.target.value))}
            className="w-full h-1 appearance-none rounded-full cursor-pointer"
            style={{ background: `linear-gradient(to right, hsl(0 70% 50%), hsl(180 70% 50%), hsl(270 50% 55%))` }}
          />
          <div className="flex justify-between mt-3">
            {frequencies.map((f) => (
              <div key={f.value} className="w-1.5 h-1.5 rounded-full transition-all" style={{ backgroundColor: currentMood >= f.value ? f.color : "hsl(220 15% 15%)" }} />
            ))}
          </div>
        </div>

        <button onClick={logMood} disabled={loading} className="btn-neural mt-8 mx-auto">
          {loading ? "Logging..." : "Log Frequency"}
        </button>
      </motion.div>

      {/* Weekly chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="ethereal-glass p-8">
        <p className="text-neural-label mb-6">Weekly Frequency Map</p>
        <div className="flex items-end justify-between gap-3 h-40">
          {weekHistory.map((entry, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              {entry.value > 0 ? (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(entry.value / 10) * 100}%` }}
                  transition={{ delay: i * 0.08, duration: 0.5 }}
                  className="w-full rounded-xl relative overflow-hidden"
                  style={{
                    backgroundColor: frequencies[entry.value - 1].color + "20",
                    border: `1px solid ${frequencies[entry.value - 1].color}30`,
                  }}
                >
                  <div className="absolute bottom-0 w-full h-1/3" style={{ background: `linear-gradient(to top, ${frequencies[entry.value - 1].color}15, transparent)` }} />
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
