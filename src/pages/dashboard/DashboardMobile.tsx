import { useMemo } from "react";
import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { motion } from "framer-motion";
import { Wrench } from "lucide-react";
import { NavLink } from "react-router-dom";
import QuickLogModal from "@/components/QuickLogModal";
import { AssessmentCTA } from "@/features/archetype-assessment/components/AssessmentCTA";
import PremiumSection from "@/components/PremiumSection";
import PulseFeatureButton from "@/components/PulseFeatureButton";
import { PostAssessmentBanner } from "@/components/PostAssessmentBanner";
import { WelcomeExperience, SetupProgressBanner } from "@/components/WelcomeExperience";
import { useLanguage } from "@/i18n/LanguageContext";
import type { UserMaturityProfile } from "@/lib/userMaturity";
import type { AegisHealthScore } from "@/types/aegisHealth";
import { buildBioExecutiveViewModel } from "@/features/bio-executive-dashboard/buildBioExecutiveViewModel";
import { buildExocortexHeroUi } from "@/features/bio-executive-dashboard/bioExecutiveHeroPresentation";
import { BioExecutiveMobileDashboard } from "@/features/bio-executive-dashboard/BioExecutiveMobileDashboard";
import { useBioExecutiveHero } from "@/features/bio-executive-dashboard/useBioExecutiveHero";
import type { BioExecutiveHabitRow, BioExecutiveMoodVitals } from "@/features/bio-executive-dashboard/types";
import { fadeUp, PULL_REFRESH_HINT_KEY, type MobileHabit, type WeeklyDigest } from "./dashboard-shared";

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
  aegisScore: AegisHealthScore | null;
  aegisScoreDelta: number;
  moodVitals?: BioExecutiveMoodVitals | null;
  oldestDecisionDays?: number;
  maxDecisionPriority?: number;
  scoreTrendSparkline?: number[];
  desktopLayout?: boolean;
}

function mapHabitRows(mobileHabits: MobileHabit[]): BioExecutiveHabitRow[] {
  return mobileHabits.map((h) => ({
    id: h.id,
    name: h.name,
    done: h.completed,
    tag: h.category || "—",
    time: "—",
  }));
}

export function DashboardMobile(props: DashboardMobileProps) {
  const { t, locale } = useLanguage();
  const {
    loading,
    isError,
    onRetry,
    stats,
    digest,
    decisions,
    mobileHabits,
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
    aegisScore,
    aegisScoreDelta,
    moodVitals = null,
    oldestDecisionDays = 0,
    maxDecisionPriority = 0,
    scoreTrendSparkline = [],
    desktopLayout = false,
  } = props;

  const { heroData } = useBioExecutiveHero(desktopLayout ? props.userId : undefined);
  const exocortexUi = useMemo(() => {
    if (!desktopLayout || !heroData) return null;
    try {
      return buildExocortexHeroUi(heroData, locale === "fr" ? "fr" : "en");
    } catch (err) {
      console.error("[dashboard] exocortexUi build failed", err);
      return null;
    }
  }, [desktopLayout, heroData, locale]);

  const hour = new Date().getHours();
  const sessionLabel =
    hour < 12
      ? t("dashboard.sessionMorning")
      : hour < 18
        ? t("dashboard.sessionAfternoon")
        : t("dashboard.sessionEvening");

  const completedHabits = mobileHabits.filter((h) => h.completed).length;
  const habitProgressPct =
    mobileHabits.length > 0 ? Math.round((completedHabits / mobileHabits.length) * 100) : digest?.habitRate ?? 0;

  const headerDate = format(new Date(), "EEE d MMM", {
    locale: locale === "fr" ? fr : enUS,
  });

  const viewModel = buildBioExecutiveViewModel({
    locale: locale === "fr" ? "fr" : "en",
    sessionLabel,
    digest,
    moodAvg: stats.moodAvg,
    openDecisions: stats.openDecisions,
    aegisScore,
    aegisScoreDelta,
    habitProgressPct,
    firstOpenDecisionName: decisions[0]?.name,
    journalSnippet: lastJournalEntry?.content?.slice(0, 120) ?? null,
    moodVitals,
    oldestDecisionDays,
    maxDecisionPriority,
    scoreTrendSparkline,
  });

  const aiTransparencyBody =
    locale === "fr"
      ? `Synthèse à partir de ${completedHabits} habitudes cochées aujourd'hui, humeur ${stats.moodAvg} et score Aegis. Calcul local côté app.`
      : `Summary from ${completedHabits} habits checked today, mood ${stats.moodAvg}, and Aegis score. Computed in-app.`;

  const bioExecutiveLab = loading ? (
    <div className="min-h-[60vh] space-y-3 p-4">
      <div className="skeleton h-[320px] rounded-2xl" />
      <div className="skeleton h-[72px] rounded-2xl" />
      <div className="skeleton h-[220px] rounded-2xl" />
    </div>
  ) : (
    <BioExecutiveMobileDashboard
      headerDate={headerDate}
      viewModel={viewModel}
      habits={mapHabitRows(mobileHabits)}
      onToggleHabit={toggleMobileHabit}
      onQuickLogOpen={onQuickLogOpen}
      quickLogTitle={t("dashboard.mobileLogNow")}
      quickLogSubtitle={t("dashboard.mobileLogSubtitle")}
      aiTransparencyBody={aiTransparencyBody}
      desktopLayout={desktopLayout}
      exocortexUi={exocortexUi}
      immersiveAppShell
    />
  );

  const loadErrorBanner = isError ? (
    <div className="flex flex-col gap-2 rounded-2xl border border-destructive/35 bg-destructive/10 px-3 py-3 sm:flex-row sm:items-center sm:px-4 m-4">
      <p className="flex-1 font-barlow text-sm text-destructive">{t("dashboard.loadError")}</p>
      <button
        type="button"
        className="rounded-xl border border-destructive/40 bg-background/80 px-3 py-2 font-barlow text-xs font-medium uppercase tracking-wide text-destructive hover:bg-destructive/10 min-h-[44px]"
        onClick={onRetry}
      >
        {t("dashboard.retry")}
      </button>
    </div>
  ) : null;

  if (desktopLayout) {
    return (
      <>
        {loadErrorBanner}
        {bioExecutiveLab}
        <QuickLogModal open={showQuickLog} onClose={onQuickLogClose} />
      </>
    );
  }

  return (
    <div
      className={
        desktopLayout
          ? "max-w-full p-0 pb-[calc(var(--mobile-dock-padding)+0.5rem)] lg:pb-[calc(var(--mobile-dock-padding)+1rem)]"
          : "mobile-section-gap max-w-full pt-1 pb-4"
      }
    >
      {showPostAssessment && <PostAssessmentBanner onClose={onPostAssessmentClose} />}
      {showWelcome && maturity && (
        <WelcomeExperience maturityProfile={maturity} onDismiss={onWelcomeDismiss} />
      )}
      {showSetupBanner && maturity && !showWelcome && (
        <SetupProgressBanner maturityProfile={maturity} />
      )}
      {pullHintVisible && (
        <div className="flex items-start gap-2 rounded-2xl border border-primary/20 bg-primary/5 px-3 py-2.5 sm:px-4">
          <p className="min-w-0 flex-1 font-barlow text-[11px] leading-snug text-muted-foreground sm:text-xs">
            {t("dashboard.pullRefreshHint")}
          </p>
          <button
            type="button"
            className="shrink-0 rounded-lg px-2.5 py-1.5 font-barlow text-[10px] font-medium uppercase tracking-wide text-primary hover:bg-primary/10 min-h-[44px]"
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
            className="rounded-xl border border-destructive/40 bg-background/80 px-3 py-2 font-barlow text-xs font-medium uppercase tracking-wide text-destructive hover:bg-destructive/10 min-h-[44px]"
            onClick={onRetry}
          >
            {t("dashboard.retry")}
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          <div className="skeleton h-[320px] rounded-2xl" />
          <div className="skeleton h-[72px] rounded-2xl" />
          <div className="skeleton h-[220px] rounded-2xl" />
        </div>
      ) : (
        bioExecutiveLab
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 px-3 sm:px-4">
        {toolboxTodo > 0 ? (
          <motion.div {...fadeUp(0.04)} className="h-full">
            <NavLink
              to="/toolbox"
              state={toolboxFocusId ? { openToolboxId: toolboxFocusId } : undefined}
              className="dashboard-panel-interactive flex h-full min-h-[44px] items-center justify-between gap-3 rounded-2xl border border-primary/25 bg-primary/5 p-4 no-underline"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                  <Wrench size={18} className="text-primary" strokeWidth={1.5} aria-hidden />
                </div>
                <div className="min-w-0 text-left">
                  <p className="font-barlow text-[10.5px] font-medium uppercase tracking-[0.16em] text-muted-foreground/85">
                    {t("dashboard.mobileToolboxTodo")}
                  </p>
                  <p className="font-barlow text-sm font-semibold text-foreground">
                    {toolboxTodo} {t("toolbox.viewTodo").toLowerCase()}
                  </p>
                </div>
              </div>
              <span className="shrink-0 font-barlow text-[11px] uppercase tracking-wider text-primary font-medium">
                {t("dashboard.mobileToolboxCta")} ›
              </span>
            </NavLink>
          </motion.div>
        ) : null}

        {!loading && lastJournalEntry && (
          <motion.div {...fadeUp(0.05)} className="h-full">
            <NavLink
              to="/journal"
              className="dashboard-panel-interactive flex flex-col justify-between h-full rounded-2xl p-4 no-underline border border-border/20 bg-background/40"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="font-barlow text-[10.5px] font-medium uppercase tracking-[0.16em] text-muted-foreground/85">
                  {t("dashboard.mobileLastEntry")}
                </p>
                <span className="font-mono text-[10px] tabular-nums text-muted-foreground/60">
                  {timeAgoLabel(lastJournalEntry.created_at)}
                </span>
              </div>
              <p className="line-clamp-2 font-cormorant text-[14px] font-light italic leading-snug text-muted-foreground">
                &ldquo;{lastJournalEntry.content}&rdquo;
              </p>
            </NavLink>
          </motion.div>
        )}
      </div>

      <motion.div {...fadeUp(0.06)} className="px-3 sm:px-4 space-y-3">
        <AssessmentCTA />
        <PremiumSection>
          <PulseFeatureButton className="w-full" />
        </PremiumSection>
      </motion.div>

      <QuickLogModal open={showQuickLog} onClose={onQuickLogClose} />
    </div>
  );
}
