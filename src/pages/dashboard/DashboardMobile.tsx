import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { Target, ArrowUpRight, Wrench } from "lucide-react";
import DashboardHero from "@/components/DashboardHero";
import { DashboardNavCard } from "@/components/DashboardNavCard";
import { DashboardMobileBento } from "./DashboardMobileBento";
import HabitsMiniCard from "@/components/HabitsMiniCard";
import ScoreCard from "@/components/ScoreCard";
import ScoreboardWidget from "@/components/ScoreboardWidget";
import QuickLogModal from "@/components/QuickLogModal";
import { AssessmentCTA } from "@/features/archetype-assessment/components/AssessmentCTA";
import { PostAssessmentBanner } from "@/components/PostAssessmentBanner";
import { WelcomeExperience, SetupProgressBanner } from "@/components/WelcomeExperience";
import type { UserMaturityProfile } from "@/lib/userMaturity";
import { useLanguage } from "@/i18n/LanguageContext";
import { fadeUp, priorityBadge, PULL_REFRESH_HINT_KEY, type MobileHabit, type WeeklyDigest } from "./dashboard-shared";

export interface DashboardMobileProps {
  userId: string;
  loading: boolean;
  isError: boolean;
  onRetry: () => void;
  stats: { moodAvg: string; openDecisions: string; habitsDone: string };
  digest: WeeklyDigest | null;
  decisions: Array<{ id: string; name: string; priority: number; created_at?: string }>;
  mobileHabits: MobileHabit[];
  totalHabits: number;
  lastJournalEntry: { content: string; created_at: string } | null;
  showQuickLog: boolean;
  onQuickLogOpen: () => void;
  onQuickLogClose: () => void;
  toggleMobileHabit: (habitId: string) => void;
  timeAgoLabel: (dateStr: string) => string;
  maturity: UserMaturityProfile | null;
  showWelcome: boolean;
  showSetupBanner: boolean;
  showPostAssessment: boolean;
  onWelcomeDismiss: () => void;
  onPostAssessmentClose: () => void;
  pullHintVisible: boolean;
  onPullHintDismiss: () => void;
  toolboxTodo?: number;
  toolboxFocusId?: string | null;
}

export function DashboardMobile({
  userId,
  loading,
  isError,
  onRetry,
  stats,
  digest,
  decisions,
  mobileHabits,
  totalHabits,
  lastJournalEntry,
  showQuickLog,
  onQuickLogOpen,
  onQuickLogClose,
  toggleMobileHabit,
  timeAgoLabel,
  maturity,
  showWelcome,
  showSetupBanner,
  showPostAssessment,
  onWelcomeDismiss,
  onPostAssessmentClose,
  pullHintVisible,
  onPullHintDismiss,
  toolboxTodo = 0,
  toolboxFocusId = null,
}: DashboardMobileProps) {
  const { t } = useLanguage();

  const completedHabits = mobileHabits.filter((h) => h.completed).length;
  const pendingHabits = mobileHabits.filter((h) => !h.completed);
  const hour = new Date().getHours();
  const greeting =
    hour < 12
      ? t("dashboard.greetingMorning")
      : hour < 18
        ? t("dashboard.greetingAfternoon")
        : t("dashboard.greetingEvening");
  const streakDays = digest?.streakDays ?? 0;
  const habitsTotal = mobileHabits.length || totalHabits;
  const sessionLabel =
    hour < 12
      ? t("dashboard.sessionMorning")
      : hour < 18
        ? t("dashboard.sessionAfternoon")
        : t("dashboard.sessionEvening");
  const heroProgress = digest != null ? Math.min(100, Math.max(0, digest.habitRate)) : 75;
  const habitsBentoLabel =
    habitsTotal > 0 ? `${completedHabits}/${habitsTotal}` : stats.habitsDone;

  const digestAriaLabel =
    digest != null
      ? t("dashboard.digestAriaLabel", {
          mood:
            digest.moodTrend === "stable"
              ? t("dashboard.stable")
              : digest.moodTrend === "up"
                ? `+${digest.moodDelta}`
                : `−${digest.moodDelta}`,
          habit: String(digest.habitRate),
          streak: String(streakDays),
        })
      : undefined;

  return (
    <div className="mobile-section-gap max-w-full pt-1 sm:mx-auto sm:max-w-lg md:max-w-2xl">
      {showPostAssessment && <PostAssessmentBanner onClose={onPostAssessmentClose} />}
      {showWelcome && maturity && (
        <WelcomeExperience maturityProfile={maturity} onDismiss={onWelcomeDismiss} />
      )}
      {showSetupBanner && maturity && !showWelcome && (
        <SetupProgressBanner maturityProfile={maturity} />
      )}
      {pullHintVisible && (
        <div className="flex items-start gap-2 rounded-2xl border border-primary/20 bg-primary/5 px-3 py-2.5 sm:px-4">
          <p className="min-w-0 flex-1 font-barlow text-[11px] leading-snug text-text-secondary sm:text-xs">
            {t("dashboard.pullRefreshHint")}
          </p>
          <button
            type="button"
            className="shrink-0 rounded-lg px-2.5 py-1.5 font-barlow text-[10px] font-medium uppercase tracking-wide text-primary hover:bg-primary/10"
            onClick={() => {
              try {
                localStorage.setItem(PULL_REFRESH_HINT_KEY, "1");
              } catch {
                /* ignore */
              }
              onPullHintDismiss();
            }}
          >
            {t("dashboard.pullRefreshDismiss")}
          </button>
        </div>
      )}
      {isError && (
        <div className="flex flex-col gap-2 rounded-2xl border border-destructive/35 bg-destructive/10 px-3 py-3 sm:flex-row sm:items-center sm:px-4">
          <p className="flex-1 font-barlow text-sm text-destructive">{t("dashboard.loadError")}</p>
          <button
            type="button"
            className="rounded-xl border border-destructive/40 bg-background/80 px-3 py-2 font-barlow text-xs font-medium uppercase tracking-wide text-destructive hover:bg-destructive/10"
            onClick={onRetry}
          >
            {t("dashboard.retry")}
          </button>
        </div>
      )}

      {streakDays > 0 && (
        <motion.div {...fadeUp(0)} className="flex min-h-[24px] items-center justify-end gap-1.5">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
          <span className="font-barlow text-[11px] font-medium text-primary">
            {t("dashboard.streakLine", { n: streakDays })}
          </span>
        </motion.div>
      )}

      {/* Hero — visuel (action principale = Logger ci-dessous) */}
      <div aria-hidden={false}>
        <DashboardHero
          greeting={greeting}
          sessionLabel={sessionLabel}
          progress={heroProgress}
          progressAriaLabel={t("dashboard.heroProgressAria", { n: String(Math.round(heroProgress)) })}
        />
      </div>

      {/* 1. Action principale */}
      {loading ? (
        <div className="skeleton h-[72px] rounded-2xl sm:h-[76px] sm:rounded-[18px]" />
      ) : (
        <motion.div {...fadeUp(0.02)}>
          <button
            type="button"
            onClick={onQuickLogOpen}
            className="dashboard-cta select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            style={{ WebkitTapHighlightColor: "transparent" } as React.CSSProperties}
          >
            <div className="flex min-w-0 items-center gap-3 sm:gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[hsla(var(--aegis-warm)/0.14)] shadow-[inset_0_0_12px_hsla(var(--aegis-warm)/0.15)] sm:h-11 sm:w-11 sm:rounded-[13px]">
                <span className="h-2 w-2 rounded-full bg-[hsl(var(--aegis-warm))] shadow-[0_0_10px_hsla(var(--aegis-warm)/0.55)]" />
              </div>
              <div className="min-w-0 text-left">
                <p className="font-barlow text-[14px] font-medium leading-snug text-text-primary sm:text-[15px]">
                  {t("dashboard.mobileLogNow")}
                </p>
                <p className="mt-1 font-barlow text-[10px] font-medium uppercase tracking-[0.18em] text-text-tertiary/80 sm:tracking-[0.2em] sm:text-[11px]">
                  {t("dashboard.mobileLogSubtitle")}
                </p>
              </div>
            </div>
            <span className="shrink-0 pl-2 text-2xl font-light text-primary/45 sm:text-[26px]" aria-hidden>
              ›
            </span>
          </button>
        </motion.div>
      )}

      {/* 2. Bento semaine (remplace les 3 KPI + digest séparés) */}
      {loading ? (
        <div className="skeleton h-[108px] rounded-2xl sm:h-[118px] sm:rounded-[18px]" />
      ) : digest ? (
        <motion.div {...fadeUp(0.03)}>
          <DashboardMobileBento
            digest={digest}
            moodAvg={stats.moodAvg}
            habitsLabel={habitsBentoLabel}
            openDecisions={stats.openDecisions}
            streakDays={streakDays}
            digestAriaLabel={digestAriaLabel}
          />
        </motion.div>
      ) : null}

      {toolboxTodo > 0 ? (
        <motion.div {...fadeUp(0.035)}>
          <NavLink
            to="/toolbox"
            state={toolboxFocusId ? { openToolboxId: toolboxFocusId } : undefined}
            className="dashboard-panel-interactive flex min-h-[44px] items-center justify-between gap-3 rounded-2xl border border-primary/25 bg-primary/5 px-4 py-3.5 no-underline sm:rounded-[18px] sm:px-5"
          >
            <div className="flex min-w-0 items-center gap-3">
              <Wrench size={18} className="shrink-0 text-primary" strokeWidth={1.5} aria-hidden />
              <div className="min-w-0 text-left">
                <p className="font-barlow text-[11px] font-medium uppercase tracking-[0.16em] text-text-tertiary/85">
                  {t("dashboard.mobileToolboxTodo")}
                </p>
                <p className="font-barlow text-sm text-foreground">
                  {toolboxTodo} {t("toolbox.viewTodo").toLowerCase()}
                </p>
              </div>
            </div>
            <span className="shrink-0 font-barlow text-[11px] uppercase tracking-wider text-primary">
              {t("dashboard.mobileToolboxCta")}
            </span>
          </NavLink>
        </motion.div>
      ) : null}

      {/* 3. Décisions du jour */}
      {loading ? (
        <div className="skeleton h-[118px] rounded-2xl sm:h-[128px] sm:rounded-[18px]" />
      ) : (
        <motion.div {...fadeUp(0.04)}>
          <DashboardNavCard to="/decisions" ariaLabel={t("dashboard.a11yOpenDecisions")} className="p-4 sm:p-5">
            <div className="mb-3 flex min-h-[40px] items-center justify-between gap-2 sm:mb-4 sm:min-h-[44px]">
              <p className="dashboard-section-label">{t("dashboard.mobileDecisionsOpen")}</p>
              <span className="inline-flex min-h-[44px] min-w-[44px] items-center justify-end px-1 font-barlow text-[11px] tracking-wide text-primary/55 sm:text-xs">
                {t("dashboard.mobileSeeAll")}
                <ArrowUpRight size={12} className="ml-1 inline" strokeWidth={1.5} aria-hidden />
              </span>
            </div>
            {decisions.length === 0 ? (
              <div className="flex flex-col items-center gap-2.5 py-5 sm:py-6">
                <Target size={26} strokeWidth={1} className="text-muted-foreground/25 sm:h-7 sm:w-7" />
                <p className="max-w-[280px] text-center font-barlow text-sm leading-snug text-muted-foreground/50 sm:max-w-sm sm:text-[15px]">
                  {t("dashboard.mobileNoDecisions")}
                </p>
                <span className="mt-1 inline-flex min-h-[44px] items-center rounded-xl border border-primary/25 bg-primary/5 px-4 py-2.5 font-barlow text-[11px] uppercase tracking-wider text-primary sm:py-3 sm:text-xs">
                  {t("dashboard.mobileNewDecision")}
                </span>
              </div>
            ) : (
              <>
                <div className="divide-y divide-border/40">
                  {decisions.map((d) => {
                    const badge = priorityBadge(d.priority);
                    return (
                      <div
                        key={d.id}
                        className="flex min-h-[44px] items-center justify-between gap-2 py-2 first:pt-0 last:pb-0 sm:min-h-[48px] sm:py-2.5"
                      >
                        <div className="flex min-w-0 items-center gap-2.5">
                          <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary/85" />
                          <span className="truncate font-barlow text-[15px] text-foreground/90 sm:text-base">{d.name}</span>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {d.created_at && (
                            <span className="font-barlow text-[10px] tabular-nums text-muted-foreground/50 sm:text-[11px]">
                              {timeAgoLabel(d.created_at)}
                            </span>
                          )}
                          <span
                            className={`rounded-md px-2 py-0.5 font-barlow text-[10px] sm:text-[11px] ${badge.cls}`}
                          >
                            {badge.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-3 flex min-h-[44px] items-center justify-center gap-1.5 border-t border-border/40 pt-3 font-barlow text-[11px] uppercase tracking-wider text-primary/65 sm:mt-4 sm:justify-start sm:pt-4 sm:text-xs">
                  <span className="text-lg leading-none" aria-hidden>
                    +
                  </span>
                  <span>{t("decisions.newDecision")}</span>
                </p>
              </>
            )}
          </DashboardNavCard>
        </motion.div>
      )}

      {/* 4. Habitudes du jour */}
      {loading ? (
        <div className="skeleton h-[140px] rounded-2xl sm:h-[152px] sm:rounded-[18px]" />
      ) : mobileHabits.length > 0 ? (
        <motion.div {...fadeUp(0.05)}>
          <DashboardNavCard to="/habits" ariaLabel={t("dashboard.a11yOpenAllHabits")} className="p-4 sm:p-5">
            <div className="mb-3 flex min-h-[40px] items-center justify-between gap-2 sm:mb-4 sm:min-h-[44px]">
              <p className="font-barlow text-[11px] font-medium uppercase tracking-[0.16em] text-text-tertiary/85 sm:text-xs sm:tracking-[0.18em]">
                {t("dashboard.mobileHabitsToday")}
              </p>
              <div className="flex items-center gap-2 sm:gap-2.5">
                <span className="rounded-lg bg-primary/10 px-2.5 py-1 font-barlow text-[11px] tabular-nums text-primary sm:text-xs">
                  {completedHabits}/{mobileHabits.length}
                </span>
                <span className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center p-1 text-muted-foreground/40">
                  <ArrowUpRight size={13} aria-hidden />
                </span>
              </div>
            </div>
            {pendingHabits.length > 0 ? (
              <div className="space-y-1">
                {pendingHabits.map((habit) => (
                  <button
                    key={habit.id}
                    type="button"
                    data-dashboard-stop-nav
                    role="checkbox"
                    aria-checked={false}
                    aria-label={t("dashboard.a11yToggleHabit", { name: habit.name })}
                    onClick={() => void toggleMobileHabit(habit.id)}
                    className="flex min-h-[44px] w-full cursor-pointer items-center gap-3 rounded-lg py-1 text-left transition-opacity active:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    style={{ WebkitTapHighlightColor: "transparent" } as React.CSSProperties}
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-[hsl(var(--aegis-border))] transition-all" />
                    <span className="font-barlow text-[15px] text-foreground/90 sm:text-base">{habit.name}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center font-barlow text-sm leading-snug text-primary/80 sm:py-5 sm:text-[15px]">
                {t("dashboard.mobileHabitsAllDone")}
              </p>
            )}
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-border/50 sm:mt-4 sm:h-1.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary/35 to-primary transition-all duration-700"
                style={{
                  width: mobileHabits.length > 0 ? `${(completedHabits / mobileHabits.length) * 100}%` : "0%",
                }}
              />
            </div>
          </DashboardNavCard>
        </motion.div>
      ) : (
        <motion.div {...fadeUp(0.05)}>
          <NavLink
            to="/habits"
            aria-label={t("dashboard.a11yOpenAllHabits")}
            className="dashboard-panel-interactive block overflow-hidden rounded-2xl border-[0.5px] border-[hsl(var(--aegis-border-ice))] shadow-[0_6px_28px_hsl(0_0%_0%/0.08)] no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:rounded-[18px]"
          >
            <HabitsMiniCard userId={userId} />
          </NavLink>
        </motion.div>
      )}

      {/* 5. Scores */}
      {!loading && (
        <motion.div {...fadeUp(0.06)} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ScoreboardWidget compact />
          <NavLink
            to="/analytics"
            aria-label={t("dashboard.a11yOpenAnalytics")}
            className="block rounded-2xl no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ScoreCard compact />
          </NavLink>
        </motion.div>
      )}

      {/* 6. Journal */}
      {!loading && lastJournalEntry && (
        <motion.div {...fadeUp(0.07)}>
          <NavLink
            to="/journal"
            aria-label={t("dashboard.a11yOpenJournal")}
            className="block rounded-2xl no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:rounded-[18px]"
          >
            <div
              className="dashboard-panel-interactive p-4 sm:p-5"
              style={{ WebkitTapHighlightColor: "transparent" } as React.CSSProperties}
            >
              <div className="mb-2 flex items-center justify-between gap-2 sm:mb-3">
                <p className="font-barlow text-[11px] font-medium uppercase tracking-[0.16em] text-text-tertiary/85 sm:text-xs sm:tracking-[0.18em]">
                  {t("dashboard.mobileLastEntry")}
                </p>
                <span className="inline-flex shrink-0 items-center gap-1 font-barlow text-[10px] tabular-nums text-muted-foreground/50 sm:text-[11px]">
                  {timeAgoLabel(lastJournalEntry.created_at)}
                  <ArrowUpRight size={12} strokeWidth={1.5} aria-hidden />
                </span>
              </div>
              <p className="line-clamp-3 font-cormorant text-[15px] font-light italic leading-relaxed text-muted-foreground sm:text-base">
                &ldquo;{lastJournalEntry.content}&rdquo;
              </p>
            </div>
          </NavLink>
        </motion.div>
      )}

      {/* 7. Assessment — secondaire, en bas */}
      <motion.div {...fadeUp(0.08)}>
        <AssessmentCTA />
      </motion.div>

      <QuickLogModal open={showQuickLog} onClose={onQuickLogClose} />
    </div>
  );
}
