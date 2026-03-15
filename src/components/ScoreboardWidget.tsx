import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, ChevronDown, ChevronUp, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";

interface BreakdownItem {
  criteria_id: string;
  label: string;
  earned: number;
  max: number;
  met: boolean;
}

export default function ScoreboardWidget() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  if (isMobile) return null;
  const [score, setScore] = useState<{ total: number; max: number; breakdown: BreakdownItem[] } | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadScoreboard();
  }, [user]);

  const loadScoreboard = async () => {
    // Get yesterday's scoreboard
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const scoreDate = yesterday.toISOString().split("T")[0];

    const { data } = await supabase
      .from("daily_scoreboards" as any)
      .select("total_score, max_score, breakdown")
      .eq("user_id", user!.id)
      .eq("score_date", scoreDate)
      .maybeSingle();

    if (data) {
      setScore({
        total: (data as any).total_score,
        max: (data as any).max_score,
        breakdown: (data as any).breakdown as BreakdownItem[],
      });
    }
    setLoading(false);
  };

  if (loading || !score) return null;

  const pct = score.max > 0 ? Math.round((score.total / score.max) * 100) : 0;
  const color = pct >= 80 ? "text-emerald-500" : pct >= 50 ? "text-amber-400" : "text-red-400";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="ethereal-glass p-6"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <Trophy size={18} className="text-primary" />
          <div>
            <p className="text-neural-label text-left">{t("scoreboard.yesterday")}</p>
            <p className={`text-2xl font-cinzel ${color}`}>
              {score.total}/{score.max} <span className="text-sm text-muted-foreground">{t("scoreboard.pts")}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Progress ring */}
          <div className="relative w-12 h-12">
            <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
              <circle cx="24" cy="24" r="20" fill="none" stroke="hsl(var(--border))" strokeWidth="3" />
              <circle
                cx="24" cy="24" r="20" fill="none"
                stroke="hsl(var(--primary))" strokeWidth="3"
                strokeDasharray={`${(pct / 100) * 125.6} 125.6`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-cinzel text-foreground">{pct}%</span>
          </div>
          {expanded ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          className="mt-4 space-y-2 border-t border-border/20 pt-4"
        >
          {score.breakdown.map((item, i) => (
            <div key={i} className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2">
                {item.met ? (
                  <Check size={12} className="text-emerald-500" />
                ) : (
                  <X size={12} className="text-red-400" />
                )}
                <span className="text-sm text-foreground">{item.label}</span>
              </div>
              <span className={`text-xs font-cinzel ${item.met ? "text-emerald-500" : "text-muted-foreground"}`}>
                {item.earned}/{item.max} {t("scoreboard.pts")}
              </span>
            </div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
