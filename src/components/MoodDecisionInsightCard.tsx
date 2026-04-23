import { motion } from "framer-motion";
import { Brain, Zap, Clock, AlertTriangle, CalendarDays } from "lucide-react";
import { NeuralCard } from "@/components/ui/neural-card";
import { useLanguage } from "@/i18n/LanguageContext";
import { useMoodDecisionCorrelation } from "@/hooks/useMoodDecisionCorrelation";
import type { WeekDay } from "@/services/correlationService";

const DAY_LABEL: Record<WeekDay, { fr: string; en: string }> = {
  monday: { fr: "lundi", en: "Monday" },
  tuesday: { fr: "mardi", en: "Tuesday" },
  wednesday: { fr: "mercredi", en: "Wednesday" },
  thursday: { fr: "jeudi", en: "Thursday" },
  friday: { fr: "vendredi", en: "Friday" },
  saturday: { fr: "samedi", en: "Saturday" },
  sunday: { fr: "dimanche", en: "Sunday" },
};

interface Props {
  userId: string | undefined;
}

export function MoodDecisionInsightCard({ userId }: Props) {
  const { t, locale } = useLanguage();
  const { data, isLoading } = useMoodDecisionCorrelation(userId);

  const dayLabel = (d: WeekDay | null) => (d ? DAY_LABEL[d][locale] : "—");

  return (
    <NeuralCard glow="purple" className="p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1.5 h-4 rounded-full bg-accent-secondary" />
        <h3 className="font-display text-[11px] tracking-[0.15em] uppercase text-text-secondary">
          {t("correlation.title")}
        </h3>
      </div>

      {isLoading || !data ? (
        <div className="h-32 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : data.insufficient_data ? (
        <p className="text-sm text-text-secondary">{t("correlation.insufficient")}</p>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="grid grid-cols-2 gap-4"
        >
          <Stat
            icon={Brain}
            label={t("correlation.avgMoodOnDecisionDays")}
            value={data.avg_mood_on_decision_days.toFixed(1)}
          />
          <Stat
            icon={Clock}
            label={t("correlation.avgResolutionTime")}
            value={`${data.avg_resolution_time_days.toFixed(1)} ${t("correlation.days")}`}
          />
          <Stat
            icon={Zap}
            label={t("correlation.fastVsSlow")}
            value={`${data.fast_decisions_mood_avg.toFixed(1)} / ${data.slow_decisions_mood_avg.toFixed(1)}`}
          />
          <Stat
            icon={AlertTriangle}
            label={t("correlation.lowMoodPending")}
            value={`${data.low_mood_pending_rate}%`}
            warn={data.low_mood_pending_rate > 40}
          />
          <div className="col-span-2 flex items-center gap-2 pt-3 border-t border-border-subtle/50">
            <CalendarDays size={12} className="text-accent-primary" strokeWidth={1.5} />
            <p className="text-[11px] text-text-secondary">
              {t("correlation.bestDay")}{" "}
              <span className="text-accent-positive">{dayLabel(data.best_decision_day)}</span>
              {" · "}
              {t("correlation.worstDay")}{" "}
              <span className="text-accent-danger">{dayLabel(data.worst_decision_day)}</span>
            </p>
          </div>
        </motion.div>
      )}
    </NeuralCard>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  warn,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <Icon size={12} strokeWidth={1.5} className={warn ? "text-accent-danger" : "text-accent-primary"} />
        <span className="text-[10px] uppercase tracking-[0.12em] text-text-tertiary font-display">
          {label}
        </span>
      </div>
      <span className={`text-lg font-display ${warn ? "text-accent-danger" : "text-text-primary"}`}>
        {value}
      </span>
    </div>
  );
}
