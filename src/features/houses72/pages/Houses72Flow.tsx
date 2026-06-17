/**
 * Houses72Flow — wizard page for "Le Casting des 12 Maisons" (72Q appendix).
 *
 * Route: /assessment/maisons  (or accessible from the deep dive page CTA)
 *
 * Flow:
 *   intro → house-by-house (6Q × up to 12 houses) → review → done
 *
 * On each house completion, answers are submitted to `houses72_responses`.
 * The deep dive hook combines these scores with V4 poles at read time.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Sparkles,
  Map,
} from "lucide-react";
import {
  loadHouses72Responses,
  submitHouse72Answers,
  submitHouses72Responses,
} from "../../archetype-assessment/services/houses72Service";
import { useHouses72Session } from "../../archetype-assessment/hooks/useHouses72Session";
import { getHouse72Questions } from "../../archetype-assessment/domain/questionsHouses72";
import { getHouse72Prompt, getHouse72Title, getHouse72Theme } from "../../archetype-assessment/domain/houses72Locale";
import { Houses72HouseNav } from "../components/Houses72HouseNav";
import { Houses72QuestionCard } from "../components/Houses72QuestionCard";
import type { Houses72Answer } from "../../archetype-assessment/domain/houses72Scoring";
import { isHouseComplete } from "../../archetype-assessment/domain/houses72Scoring";

const ROMAN: Record<number, string> = {
  1: "I", 2: "II", 3: "III", 4: "IV", 5: "V", 6: "VI",
  7: "VII", 8: "VIII", 9: "IX", 10: "X", 11: "XI", 12: "XII",
};

// ── Loading skeleton ──────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );
}

// ── Intro screen ──────────────────────────────────────────────────────────────

function IntroScreen({
  onStart,
  onResume,
  hasProgress,
}: {
  onStart: () => void;
  onResume: () => void;
  hasProgress: boolean;
}) {
  const { t } = useLanguage();
  return (
    <div className="max-w-lg mx-auto px-4 py-12 space-y-8">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Map className="w-8 h-8 text-primary" />
          </div>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {t("houses72.title")}
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {t("houses72.introLead", { emphasis: t("houses72.introEmphasis") })}
        </p>
        <p className="text-xs text-muted-foreground">
          {t("houses72.introDetail")}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {hasProgress ? (
          <>
            <Button size="lg" onClick={onResume} className="w-full">
              <Sparkles className="w-4 h-4 mr-2" />
              {t("houses72.resume")}
            </Button>
            <Button variant="outline" size="lg" onClick={onStart} className="w-full">
              {t("houses72.restart")}
            </Button>
          </>
        ) : (
          <Button size="lg" onClick={onStart} className="w-full">
            <Sparkles className="w-4 h-4 mr-2" />
            {t("houses72.start")}
          </Button>
        )}
      </div>
    </div>
  );
}

// ── House complete screen ─────────────────────────────────────────────────────

function HouseCompleteScreen({
  house,
  completedHouses,
  totalHouses,
  hasNextHouse,
  nextHouse,
  onContinue,
  onLeave,
  isSaving,
}: {
  house: number;
  completedHouses: number;
  totalHouses: number;
  hasNextHouse: boolean;
  nextHouse: number | null;
  onContinue: () => void;
  onLeave: () => void;
  isSaving: boolean;
}) {
  const { locale, t } = useLanguage();
  const roman = ROMAN[house] ?? String(house);
  const nextRoman = nextHouse ? ROMAN[nextHouse] ?? String(nextHouse) : "";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-lg p-6 sm:p-8 space-y-6 backdrop-blur-3xl bg-card/40 border-border/40">
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-foreground">
            {t("houses72.houseCompleteTitle", { roman })}
          </h2>
          <p className="text-sm font-medium text-foreground">{getHouse72Title(house, locale)}</p>
          <p className="text-xs text-muted-foreground">{getHouse72Theme(house, locale)}</p>
          <p className="text-sm text-muted-foreground leading-relaxed pt-1">
            {t("houses72.houseCompleteBody")}
          </p>
          <p className="text-xs text-primary font-medium">
            {t("houses72.housesProgress", {
              completed: String(completedHouses),
              total: String(totalHouses),
            })}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Button size="lg" onClick={onContinue} disabled={isSaving} className="w-full">
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t("houses72.saving")}
              </>
            ) : hasNextHouse && nextHouse ? (
              <>
                {t("houses72.continueNextHouse", { roman: nextRoman })}
                <ArrowRight className="ml-2 w-4 h-4" />
              </>
            ) : (
              <>
                {t("houses72.continueReview")}
                <ArrowRight className="ml-2 w-4 h-4" />
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={onLeave}
            disabled={isSaving}
            className="w-full"
          >
            {t("houses72.leaveSaved")}
          </Button>
        </div>
      </Card>
    </div>
  );
}

// ── Review screen ─────────────────────────────────────────────────────────────

function ReviewScreen({
  populatedHouses,
  completionMap,
  onGoToHouse,
  onFinish,
  isSubmitting,
  isAllComplete,
}: {
  populatedHouses: number[];
  completionMap: Record<number, number>;
  onGoToHouse: (house: number) => void;
  onFinish: () => void;
  isSubmitting: boolean;
  isAllComplete: boolean;
}) {
  const { locale, t } = useLanguage();
  const totalAnswered = Object.values(completionMap).reduce((s, n) => s + n, 0);
  const totalQuestions = populatedHouses.length * 6;

  return (
    <div className="max-w-lg mx-auto px-4 py-12 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold text-foreground">
          {t("houses72.recap")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("houses72.answeredCount", {
            answered: String(totalAnswered),
            total: String(totalQuestions),
          })}
        </p>
        <Progress value={(totalAnswered / totalQuestions) * 100} className="h-2 mt-2" />
      </div>

      <div className="space-y-2">
        {populatedHouses.map((house) => {
          const count = completionMap[house] ?? 0;
          const isComplete = count >= 6;
          return (
            <div
              key={house}
              className="flex items-center gap-3 p-3 rounded-lg border border-border/60"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  isComplete
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {house}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {getHouse72Title(house, locale)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("houses72.houseQuestionsCount", { count: String(count) })}
                </p>
              </div>
              {isComplete ? (
                <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onGoToHouse(house)}
                  className="text-xs"
                >
                  {t("houses72.complete")}
                </Button>
              )}
            </div>
          );
        })}
      </div>

      <Button
        size="lg"
        onClick={onFinish}
        disabled={isSubmitting || !isAllComplete}
        className="w-full"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {t("houses72.saving")}
          </>
        ) : isAllComplete ? (
          <>
            <CheckCircle2 className="w-4 h-4 mr-2" />
            {t("houses72.finalize")}
          </>
        ) : (
          t("houses72.finalizeHint")
        )}
      </Button>
    </div>
  );
}

// ── Done screen ───────────────────────────────────────────────────────────────

function DoneScreen({ onViewReport }: { onViewReport: () => void }) {
  const { t } = useLanguage();
  return (
    <div className="max-w-lg mx-auto px-4 py-12 space-y-8 text-center">
      <div className="flex justify-center">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-primary" />
        </div>
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground">{t("houses72.doneTitle")}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">{t("houses72.doneBody")}</p>
      </div>
      <Button size="lg" onClick={onViewReport} className="w-full">
        <Sparkles className="w-4 h-4 mr-2" />
        {t("houses72.viewDeepDive")}
      </Button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Houses72Flow() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { locale, t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [initialAnswers, setInitialAnswers] = useState<Houses72Answer[]>([]);

  // Load existing answers from DB
  useEffect(() => {
    if (!user?.id) return;
    let alive = true;
    setLoading(true);
    loadHouses72Responses(user.id)
      .then((answers) => {
        if (alive) {
          setInitialAnswers(answers);
          setLoading(false);
        }
      })
      .catch(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [user?.id]);

  const session = useHouses72Session({ initialAnswers });

  const {
    step,
    completedHouse,
    activeHouse,
    questionIndex,
    answers,
    draft,
    completionMap,
    populatedHouses,
    goToHouse,
    goToDone,
    showHouseComplete,
    continueAfterHouseComplete,
    nextQuestion,
    previousQuestion,
    setDraftSelections,
    commitDraft,
    isCurrentHouseComplete,
    isAllComplete,
    resetAll,
    resumeFromIncomplete,
  } = session;

  const completedHousesCount = useMemo(
    () => populatedHouses.filter((h) => isHouseComplete(h, answers)).length,
    [populatedHouses, answers],
  );

  const saveHouseProgress = useCallback(
    async (house: number, mergedAnswers: Houses72Answer[]) => {
      if (!user?.id) return;
      await submitHouse72Answers(user.id, house, mergedAnswers);
      setInitialAnswers(mergedAnswers);
    },
    [user?.id],
  );

  const finishCurrentHouse = useCallback(async () => {
    if (!user?.id) return;
    setSubmitting(true);
    try {
      const merged = commitDraft();
      await saveHouseProgress(activeHouse, merged);
      toast({
        title: t("houses72.houseSavedToast", {
          roman: ROMAN[activeHouse] ?? String(activeHouse),
        }),
        description: t("houses72.savedDesc"),
      });
      showHouseComplete(activeHouse);
    } catch {
      toast({
        variant: "destructive",
        title: t("houses72.errorTitle"),
        description: t("houses72.errorDesc"),
      });
    } finally {
      setSubmitting(false);
    }
  }, [user?.id, commitDraft, saveHouseProgress, activeHouse, showHouseComplete, t]);

  // Submit all answers when finalizing
  const handleFinalize = useCallback(async () => {
    if (!user?.id) return;
    setSubmitting(true);
    try {
      await submitHouses72Responses(user.id, answers);
      toast({
        title: t("houses72.savedTitle"),
        description: t("houses72.savedDesc"),
      });
      goToDone();
    } catch (err) {
      toast({
        variant: "destructive",
        title: t("houses72.errorTitle"),
        description: t("houses72.errorDesc"),
      });
    } finally {
      setSubmitting(false);
    }
  }, [user?.id, answers, goToDone]);

  const handleStart = useCallback(() => {
    resetAll();
    goToHouse(populatedHouses[0] ?? 1);
  }, [resetAll, goToHouse, populatedHouses]);

  const handleResume = useCallback(() => {
    resumeFromIncomplete();
  }, [resumeFromIncomplete]);

  const houseQuestions = getHouse72Questions(activeHouse);
  const currentQuestion = houseQuestions[questionIndex];
  const totalAnswered = Object.values(completionMap).reduce((s, n) => s + n, 0);
  const totalQuestions = populatedHouses.length * 6;

  const handleNext = useCallback(async () => {
    const isLastQuestionInHouse = questionIndex >= houseQuestions.length - 1;
    if (isLastQuestionInHouse) {
      await finishCurrentHouse();
      return;
    }
    if (Object.keys(draft.selections).length > 0) {
      commitDraft();
    }
    nextQuestion();
  }, [
    draft.selections,
    commitDraft,
    questionIndex,
    houseQuestions.length,
    finishCurrentHouse,
    nextQuestion,
  ]);

  const handleSaveAndLeave = useCallback(async () => {
    if (!user?.id) {
      navigate("/persona");
      return;
    }
    setSubmitting(true);
    try {
      const merged = commitDraft();
      const houseAnswers = merged.filter((a) => a.house === activeHouse);
      if (houseAnswers.length > 0) {
        await saveHouseProgress(activeHouse, merged);
      }
      navigate("/persona");
    } catch {
      toast({
        variant: "destructive",
        title: t("houses72.errorTitle"),
        description: t("houses72.errorDesc"),
      });
    } finally {
      setSubmitting(false);
    }
  }, [user?.id, commitDraft, activeHouse, saveHouseProgress, navigate, t]);

  const handleHouseSelect = useCallback(
    async (house: number) => {
      if (house === activeHouse) return;
      if (!user?.id) {
        goToHouse(house);
        return;
      }
      try {
        const merged = commitDraft();
        if (merged.some((a) => a.house === activeHouse)) {
          await saveHouseProgress(activeHouse, merged);
        }
      } catch {
        console.warn("houses72: failed to save before house switch");
      }
      goToHouse(house);
    },
    [user?.id, commitDraft, activeHouse, saveHouseProgress, goToHouse],
  );

  const handlePrevious = useCallback(() => {
    previousQuestion();
  }, [previousQuestion]);

  const handleContinueAfterHouse = useCallback(() => {
    continueAfterHouseComplete();
  }, [continueAfterHouseComplete]);

  const handleLeaveAfterHouse = useCallback(() => {
    navigate("/persona");
  }, [navigate]);

  if (loading) return <LoadingState />;

  // ── Render ────────────────────────────────────────────────────────────────

  if (step === "house_complete" && completedHouse !== null) {
    const houseIdx = populatedHouses.indexOf(completedHouse);
    const nextHouse =
      houseIdx >= 0 && houseIdx < populatedHouses.length - 1
        ? populatedHouses[houseIdx + 1]
        : null;

    return (
      <HouseCompleteScreen
        house={completedHouse}
        completedHouses={completedHousesCount}
        totalHouses={populatedHouses.length}
        hasNextHouse={nextHouse !== null}
        nextHouse={nextHouse}
        onContinue={handleContinueAfterHouse}
        onLeave={handleLeaveAfterHouse}
        isSaving={submitting}
      />
    );
  }

  if (step === "done") {
    return (
      <DoneScreen onViewReport={() => navigate("/deep-dive")} />
    );
  }

  if (step === "review") {
    return (
      <div className="min-h-screen bg-background">
        <ReviewScreen
          populatedHouses={populatedHouses}
          completionMap={completionMap}
          onGoToHouse={goToHouse}
          onFinish={handleFinalize}
          isSubmitting={submitting}
          isAllComplete={isAllComplete}
        />
      </div>
    );
  }

  if (step === "intro") {
    return (
      <div className="min-h-screen bg-background">
        <IntroScreen
          onStart={handleStart}
          onResume={handleResume}
          hasProgress={initialAnswers.length > 0}
        />
      </div>
    );
  }

  // step === "house"
  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground text-sm">{t("houses72.questionNotFound")}</p>
      </div>
    );
  }

  const canGoNext = Object.keys(draft.selections).length > 0;
  const isLastQuestionInHouse = questionIndex >= houseQuestions.length - 1;
  const houseProgressPct =
    totalQuestions > 0 ? Math.round((totalAnswered / totalQuestions) * 100) : 0;

  return (
    <div className="min-h-screen relative bg-background">
      <div className="absolute top-4 left-4 z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSaveAndLeave}
          disabled={submitting}
          aria-label={t("general.close")}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10 sm:py-16">
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>
                {t("houses72.houseLabel", { roman: ROMAN[activeHouse] ?? String(activeHouse) })}
                {" · "}
                {t("houses72.questionLabel", {
                  current: String(questionIndex + 1),
                  total: String(houseQuestions.length),
                })}
              </span>
              <span>{houseProgressPct}%</span>
            </div>
            <Progress value={houseProgressPct} />
          </div>

          <Houses72HouseNav
            populatedHouses={populatedHouses}
            activeHouse={activeHouse}
            completionMap={completionMap}
            onSelectHouse={handleHouseSelect}
          />

          <Card className="p-5 sm:p-7 backdrop-blur-3xl bg-card/40 border-border/40">
            <Houses72QuestionCard
              question={currentQuestion}
              draft={draft}
              onDraftSelectionsChange={setDraftSelections}
              prompt={getHouse72Prompt(currentQuestion, locale)}
            />
          </Card>

          <div className="flex items-center justify-between gap-3">
            <Button variant="ghost" onClick={handlePrevious}>
              <ArrowLeft className="mr-2 w-4 h-4" />
              {t("appendix.previous")}
            </Button>

            {isLastQuestionInHouse ? (
              <Button onClick={handleNext} disabled={!canGoNext || submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    {t("houses72.saving")}
                  </>
                ) : (
                  <>
                    {t("houses72.finishHouse")}
                    <CheckCircle2 className="ml-2 w-4 h-4" />
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={handleNext} disabled={!canGoNext}>
                {t("appendix.next")}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            )}
          </div>

          {isCurrentHouseComplete ? (
            <p className="text-center text-xs text-primary font-medium flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {t("houses72.houseComplete", { house: String(activeHouse) })}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
