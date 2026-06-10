import { NavLink } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { MiniSparkline } from "@/components/MiniSparkline";
import { useLanguage } from "@/i18n/LanguageContext";
import type { WeeklyDigest } from "./dashboard-shared";

interface Props {
  digest: WeeklyDigest;
  moodAvg: string;
  habitsLabel: string;
  openDecisions: string;
  streakDays: number;
  digestAriaLabel?: string;
}

/** Single bento block: week overview (replaces duplicate KPI pills + digest). */
export function DashboardMobileBento({
  digest,
  moodAvg,
  habitsLabel,
  openDecisions,
  streakDays,
  digestAriaLabel,
}: Props) {
  const { t } = useLanguage();
  const showStreak = streakDays > 0;

  return (
    <div
      role="region"
      aria-label={digestAriaLabel}
      className="glass-card dashboard-panel p-4 sm:p-5"
    >
      <div className="mb-3 flex items-center justify-between gap-2 sm:mb-4">
        <p className="dashboard-section-label">{t("dashboard.mobileThisWeek")}</p>
        <ArrowUpRight size={14} className="text-muted-foreground/40" strokeWidth={1.5} aria-hidden />
      </div>

      <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
        <NavLink
          to="/mood"
          aria-label={t("dashboard.a11yOpenMood")}
          className="dashboard-panel-interactive flex flex-col items-center rounded-xl px-1 py-2.5 sm:px-2 no-underline"
        >
          <MiniSparkline
            values={digest.moodSeries ?? []}
            ariaLabel={t("dashboard.moodSparklineAria")}
            className="mb-1"
          />
          <p className="font-cormorant text-[22px] sm:text-[24px] font-light leading-none text-primary tabular-nums">
            {moodAvg}
          </p>
          <div className="mt-1 flex min-h-[18px] items-center justify-center gap-0.5">
            {digest.moodTrend === "stable" ? (
              <span className="font-barlow text-[10px] text-muted-foreground/55">{t("dashboard.stable")}</span>
            ) : (
              <>
                <span
                  className={`font-barlow text-sm ${
                    digest.moodTrend === "up" ? "text-chart-4" : "text-destructive"
                  }`}
                  aria-hidden
                >
                  {digest.moodTrend === "up" ? "↑" : "↓"}
                </span>
                <span className="font-barlow text-[10px] text-muted-foreground/75 tabular-nums">
                  {digest.moodTrend === "up" ? `+${digest.moodDelta}` : `−${digest.moodDelta}`}
                </span>
              </>
            )}
          </div>
          <p className="mt-1 font-barlow text-[10px] uppercase tracking-[0.14em] text-muted-foreground/55">
            {t("mood.label")}
          </p>
        </NavLink>

        <NavLink
          to="/habits"
          aria-label={t("dashboard.a11yOpenAllHabits")}
          className="dashboard-panel-interactive flex flex-col items-center justify-center rounded-xl border-l border-border/50 px-2 py-2.5 sm:px-3 no-underline"
        >
          <p className="font-cormorant text-[22px] sm:text-[24px] font-light leading-none text-foreground tabular-nums">
            {habitsLabel}
          </p>
          <p className="mt-1 font-barlow text-[10px] text-primary/60 tabular-nums">
            {digest.habitRate}%
          </p>
          <p className="mt-1 font-barlow text-[10px] uppercase tracking-[0.14em] text-muted-foreground/55">
            {t("nav.habits")}
          </p>
        </NavLink>

        <NavLink
          to={showStreak ? "/habits" : "/decisions"}
          aria-label={showStreak ? t("dashboard.a11yOpenAllHabits") : t("dashboard.a11yOpenDecisions")}
          className="dashboard-panel-interactive flex flex-col items-center justify-center rounded-xl border-l border-border/50 py-2.5 pl-2 sm:pl-3 no-underline"
        >
          <p
            className={`font-cormorant text-[22px] sm:text-[24px] font-light leading-none tabular-nums ${
              showStreak ? "text-warning" : "text-muted-foreground"
            }`}
          >
            {showStreak ? `${streakDays}j` : openDecisions}
          </p>
          <p className="mt-1 font-barlow text-[10px] uppercase tracking-[0.14em] text-muted-foreground/55">
            {showStreak ? t("dashboard.kpiStreak") : t("dashboard.kpiDecisions")}
          </p>
        </NavLink>
      </div>
    </div>
  );
}
