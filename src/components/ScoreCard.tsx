import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Flame, Star, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";

interface Badge {
  id: string;
  badge_type: string;
  badge_name: string;
  description: string | null;
  earned_at: string;
}

export default function ScoreCard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  if (isMobile) return null;
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [level, setLevel] = useState(1);

  useEffect(() => {
    if (user) {
      computeScore();
      loadBadges();
    }
  }, [user]);

  const computeScore = async () => {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);

    const [moodRes, decRes, habitRes, journalRes, actionRes] = await Promise.all([
      supabase.from("mood_entries").select("id").eq("user_id", user!.id).gte("logged_at", sevenDaysAgo.toISOString()),
      supabase.from("decisions").select("id").eq("user_id", user!.id).eq("status", "decided"),
      supabase.from("habit_completions").select("completed_date").eq("user_id", user!.id).gte("completed_date", sevenDaysAgo.toISOString().split("T")[0]),
      supabase.from("journal_entries").select("id").eq("user_id", user!.id).gte("created_at", sevenDaysAgo.toISOString()),
      supabase.from("daily_actions").select("completed_date").eq("user_id", user!.id).order("completed_date", { ascending: false }).limit(30),
    ]);

    const moodPts = (moodRes.data?.length || 0) * 10;
    const decPts = (decRes.data?.length || 0) * 15;
    const habitPts = (habitRes.data?.length || 0) * 5;
    const journalPts = (journalRes.data?.length || 0) * 10;
    const total = moodPts + decPts + habitPts + journalPts;
    setScore(total);
    setLevel(Math.max(1, Math.floor(total / 50) + 1));

    // Compute streak from daily_actions
    const dates = [...new Set((actionRes.data as any[] || []).map((d: any) => d.completed_date))].sort().reverse();
    let s = 0;
    const todayStr = today.toISOString().split("T")[0];
    for (let i = 0; i < dates.length; i++) {
      const expected = new Date(today);
      expected.setDate(today.getDate() - i);
      if (dates[i] === expected.toISOString().split("T")[0]) s++;
      else break;
    }
    setStreak(s);
  };

  const loadBadges = async () => {
    const { data } = await supabase.from("user_badges").select("*").eq("user_id", user!.id).order("earned_at", { ascending: false }).limit(5);
    setBadges((data as any[] || []) as Badge[]);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.06, duration: 0.3 }}
      className="rounded-xl border border-border-subtle bg-bg-surface p-6 shadow-card"
    >
      <div className="flex items-center gap-2 mb-4">
        <Trophy size={14} strokeWidth={1.5} className="text-accent-primary" />
        <p className="text-neural-label">{t("scoreCard.title")}</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-light text-text-primary font-display">{score}</div>
          <p className="text-[10px] text-muted-foreground mt-1">{t("scoreCard.points7d")}</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <Flame size={16} className="text-orange-400" />
            <span className="text-2xl font-light text-text-primary font-display">{streak}</span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">{t("scoreCard.consecutiveDays")}</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <Star size={16} className="text-yellow-400" />
            <span className="text-2xl font-light text-text-primary font-display">{level}</span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">{t("scoreCard.level")}</p>
        </div>
      </div>

      {/* Progress bar to next level */}
      <div className="mb-4">
        <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
          <span>{t("scoreCard.levelShort")} {level}</span>
          <span>{t("scoreCard.levelShort")} {level + 1}</span>
        </div>
        <div className="h-1.5 bg-secondary/30 rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${(score % 50) * 2}%` }} transition={{ duration: 1, delay: 0.5 }} className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full" />
        </div>
      </div>

      {/* Recent badges */}
      {badges.length > 0 && (
        <div>
          <p className="text-[10px] text-muted-foreground mb-2">{t("scoreCard.recentBadges")}</p>
          <div className="flex flex-wrap gap-2">
            {badges.map(b => (
              <div key={b.id} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-primary/10 text-primary text-[10px]" title={b.description || ""}>
                <Award size={10} /> {b.badge_name}
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
