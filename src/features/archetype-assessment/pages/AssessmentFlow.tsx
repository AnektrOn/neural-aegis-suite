import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { toast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Sparkles,
  X,
  Clock,
} from "lucide-react";
import {
  loadActiveTemplate,
  ensureAssessmentSession,
  persistAssessmentSessionId,
  readPersistedAssessmentSessionId,
  submitSession,
} from "../services/assessmentService";
import { computeRawScores } from "../domain/scoringEngine";
import { useAssessmentSession } from "../hooks/useAssessmentSession";
import type { LoadedTemplate } from "../services/assessmentService";
import type { ResponseValue, RuntimeQuestion, ArchetypeKey, ShadowKey } from "../domain/types";
import { MiniRadarThumb } from "../components/MiniRadarThumb";
import { IntensityMultipleChoice } from "../components/IntensityMultipleChoice";
import { useAdmin } from "@/hooks/use-admin";

const SECONDS_PER_QUESTION = 18;

function formatMinutesRemaining(remainingQuestions: number, t: (key: string, vars?: Record<string, string>) => string): string {
  const seconds = Math.max(0, remainingQuestions) * SECONDS_PER_QUESTION;
  const minutes = Math.max(1, Math.round(seconds / 60));
  return t("assessment.minutesRemaining", { minutes: String(minutes) });
}

export default function AssessmentFlow() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const { locale, t } = useLanguage();
  const isFR = locale === "fr";

  const [loaded, setLoaded] = useState<LoadedTemplate | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let alive = true;
    loadActiveTemplate()
      .then((t) => {
        if (!alive) return;
        // V4 core bank only (30 questions)
        const required = t.questions.filter((q) => q.is_required !== false);
        setLoaded({ ...t, questions: required });
      })
      .catch((e) => alive && setLoadError(e.message ?? t("assessment.loadError")));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!user || sessionId) return;
    const stored = readPersistedAssessmentSessionId(user.id);
    if (stored) setSessionId(stored);
  }, [user, sessionId]);

  const session = useAssessmentSession({ questions: loaded?.questions ?? [] });

  const handleStart = async () => {
    if (!user || !loaded) {
      toast({
        title: t("assessment.error"),
        description: t("assessment.notLoaded"),
        variant: "destructive",
      });
      return;
    }
    try {
      const sid = await ensureAssessmentSession(user.id, loaded.template.id, sessionId);
      setSessionId(sid);
      persistAssessmentSessionId(user.id, sid);
      session.goToQuestions();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast({ title: t("assessment.error"), description: msg, variant: "destructive" });
    }
  };

  const handleSubmit = async () => {
    if (!user || !loaded) {
      toast({
        title: t("assessment.error"),
        description: t("assessment.missingSession"),
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      const sid = await ensureAssessmentSession(user.id, loaded.template.id, sessionId);
      if (sid !== sessionId) setSessionId(sid);

      await submitSession({
        userId: user.id,
        sessionId: sid,
        questions: loaded.questions,
        responses: session.responsesArray,
        startedAt: session.startedAt,
      });
      toast({
        title: t("assessment.saved"),
        description: t("assessment.savedDesc"),
      });
      navigate("/onboarding/results", { replace: true });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast({ title: t("assessment.error"), description: msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const liveRawScores = useMemo<Record<string, number>>(() => {
    if (!loaded) return {};
    const { archetypeScores } = computeRawScores(
      loaded.questions,
      session.responsesArray
    );
    return archetypeScores as Record<string, number>;
  }, [loaded, session.responsesArray]);

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="p-6 max-w-md">
          <p className="text-destructive">{loadError}</p>
          <Button className="mt-4" onClick={() => navigate("/")}>
            {t("assessment.back")}
          </Button>
        </Card>
      </div>
    );
  }

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const remaining = Math.max(0, session.totalQuestions - (session.questionIndex + 1));

  return (
    <div className="min-h-screen relative">
      <div className="absolute top-4 right-4 z-10">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")} aria-label={t("general.close")}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      {session.step === "questions" && isAdmin ? (
        <MiniRadarThumb isFR={isFR} rawScores={liveRawScores} />
      ) : null}

      <div className="max-w-2xl mx-auto px-4 py-10 sm:py-16">
        {session.step === "welcome" && (
          <Card className="p-6 sm:p-10 backdrop-blur-3xl bg-card/40 border-border/40">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-6 h-6 text-primary" />
              <h1 className="text-2xl sm:text-3xl font-serif">{t("quiz.public.title")}</h1>
            </div>
            <p className="text-muted-foreground mb-4">{t("quiz.public.description")}</p>

            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 mb-4">
              <p className="text-sm font-medium mb-1">
                {t("assessment.coreTitle")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("assessment.coreDesc", { count: String(session.totalQuestions) })}
              </p>
            </div>

            <ul className="space-y-2 text-sm text-muted-foreground mb-8">
              <li>
                •{" "}
                {t("assessment.bulletPoles")}
              </li>
              <li>
                •{" "}
                {t("assessment.bulletResults")}
              </li>
            </ul>
            <Button size="lg" className="w-full" onClick={handleStart}>
              {t("welcome.cta.start")} <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Card>
        )}

        {session.step === "questions" && session.currentQuestion && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>
                  {t("assessment.questionProgress", {
                    current: String(session.questionIndex + 1),
                    total: String(session.totalQuestions),
                  })}
                </span>
                <span>{Math.round(session.progress * 100)}%</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-2">
                <Clock className="w-3 h-3" />
                <span>{formatMinutesRemaining(remaining, t)}</span>
              </div>
              <Progress value={session.progress * 100} />
            </div>

            <Card className="p-5 sm:p-7 backdrop-blur-3xl bg-card/40 border-border/40">
              <QuestionRenderer
                question={session.currentQuestion}
                value={session.responses[session.currentQuestion.id]}
                onChange={session.setResponse}
                isFR={isFR}
                t={t}
              />
            </Card>

            <div className="flex items-center justify-between gap-3">
              <Button variant="ghost" onClick={session.previous}>
                <ArrowLeft className="mr-2 w-4 h-4" /> {t("appendix.previous")}
              </Button>
              <Button onClick={session.next} disabled={!session.isCurrentAnswered}>
                {session.questionIndex === session.totalQuestions - 1
                  ? t("assessment.review")
                  : t("appendix.next")}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {session.step === "review" && (
          <Card className="p-6 sm:p-8 backdrop-blur-3xl bg-card/40 border-border/40">
            <h2 className="text-xl sm:text-2xl font-serif mb-2">
              {t("assessment.reviewTitle")}
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              {t("assessment.answeredCount", {
                answered: String(session.responsesArray.length),
                total: String(session.totalQuestions),
              })}
            </p>
            <div className="max-h-72 overflow-auto space-y-2 mb-6 pr-1">
              {loaded.questions.map((q, idx) => {
                const answered = Boolean(session.responses[q.id]);
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => session.goToQuestion(idx)}
                    className="w-full text-left flex items-center gap-3 p-2 rounded-md hover:bg-accent/30 transition"
                  >
                    <CheckCircle2
                      className={`w-4 h-4 ${
                        answered ? "text-primary" : "text-muted-foreground/40"
                      }`}
                    />
                    <span className="text-sm flex-1 truncate">
                      {idx + 1}. {isFR ? q.prompt_fr : q.prompt_en}
                    </span>
                  </button>
                );
              })}
            </div>
            {!session.requiredAnswered ? (
              <p className="text-sm text-amber-600 dark:text-amber-500 mb-4">
                {t("assessment.incompleteHint", {
                  answered: String(session.responsesArray.length),
                  total: String(session.totalQuestions),
                })}
              </p>
            ) : null}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="ghost"
                onClick={() => session.goToQuestion(0)}
                className="flex-1"
              >
                {t("assessment.backToQuestions")}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!session.requiredAnswered || submitting}
                className="flex-1"
              >
                {submitting && <Loader2 className="mr-2 w-4 h-4 animate-spin" />}
                {t("assessment.submit")}
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Question renderer                                                          */
/* -------------------------------------------------------------------------- */

function QuestionRenderer({
  question,
  value,
  onChange,
  isFR,
  t,
}: {
  question: RuntimeQuestion;
  value?: ResponseValue;
  onChange: (v: ResponseValue) => void;
  isFR: boolean;
  t: (key: string, vars?: Record<string, string>) => string;
}) {
  const prompt = isFR ? question.prompt_fr : question.prompt_en;
  const helper = isFR ? question.helper_fr : question.helper_en;
  const intensityEnabled =
    (question.meta as { intensityEnabled?: boolean } | undefined)?.intensityEnabled === true;

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-medium leading-snug">{prompt}</h3>
        {helper && <p className="text-xs text-muted-foreground mt-1">{helper}</p>}
      </div>

      {intensityEnabled &&
      (question.question_type === "single_choice" || question.question_type === "multiple_choice") ? (
        <IntensityMultipleChoice question={question} value={value} onChange={onChange} isFR={isFR} />
      ) : null}

      {question.question_type === "single_choice" && !intensityEnabled ? (
        <RadioGroup
          value={value?.selectedOptionIds?.[0] ?? ""}
          onValueChange={(v) =>
            onChange({ questionId: question.id, selectedOptionIds: [v] })
          }
          className="space-y-2"
        >
          {question.options.map((o) => (
            <Label
              key={o.id}
              className="flex items-start gap-3 p-3 rounded-lg border border-border/40 hover:bg-accent/20 cursor-pointer"
            >
              <RadioGroupItem value={o.id} className="mt-0.5" />
              <span className="text-sm">{isFR ? o.label_fr : o.label_en}</span>
            </Label>
          ))}
        </RadioGroup>
      ) : null}

      {question.question_type === "multiple_choice" && !intensityEnabled ? (
        <IntensityMultipleChoice question={question} value={value} onChange={onChange} isFR={isFR} />
      ) : null}

      {question.question_type === "likert_scale" && (
        <LikertScale question={question} value={value} onChange={onChange} isFR={isFR} t={t} />
      )}

      {question.question_type === "ranking" && (
        <Ranking question={question} value={value} onChange={onChange} isFR={isFR} t={t} />
      )}

      {question.question_type === "short_text" && (
        <Textarea
          value={value?.textValue ?? ""}
          maxLength={(question.meta as { maxLength?: number }).maxLength ?? 280}
          onChange={(e) =>
            onChange({ questionId: question.id, textValue: e.target.value })
          }
          placeholder={t("assessment.answerPlaceholder")}
          rows={4}
        />
      )}
    </div>
  );
}

function LikertScale({
  question,
  value,
  onChange,
  isFR,
  t,
}: {
  question: RuntimeQuestion;
  value?: ResponseValue;
  onChange: (v: ResponseValue) => void;
  isFR: boolean;
  t: (key: string, vars?: Record<string, string>) => string;
}) {
  const options = question.options;
  const selectedIdx = options.findIndex((o) => value?.selectedOptionIds?.includes(o.id));
  const idx = selectedIdx >= 0 ? selectedIdx : Math.floor(options.length / 2);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{t("assessment.likertMin")}</span>
        <span>{t("assessment.likertMax")}</span>
      </div>
      <Slider
        value={[idx]}
        min={0}
        max={options.length - 1}
        step={1}
        onValueChange={(v) => {
          const o = options[v[0]];
          if (o)
            onChange({
              questionId: question.id,
              selectedOptionIds: [o.id],
              numericValue: o.value ?? undefined,
            });
        }}
      />
      <p className="text-center text-sm font-medium">
        {selectedIdx >= 0 ? (isFR ? options[selectedIdx].label_fr : options[selectedIdx].label_en) : "—"}
      </p>
    </div>
  );
}

function Ranking({
  question,
  value,
  onChange,
  isFR,
  t,
}: {
  question: RuntimeQuestion;
  value?: ResponseValue;
  onChange: (v: ResponseValue) => void;
  isFR: boolean;
  t: (key: string, vars?: Record<string, string>) => string;
}) {
  const order =
    value?.selectedOptionIds && value.selectedOptionIds.length === question.options.length
      ? value.selectedOptionIds
      : question.options.map((o) => o.id);

  const move = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange({ questionId: question.id, selectedOptionIds: next });
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        {t("assessment.rankingHint")}
      </p>
      {order.map((id, idx) => {
        const o = question.options.find((x) => x.id === id);
        if (!o) return null;
        return (
          <div
            key={id}
            className="flex items-center gap-3 p-3 rounded-lg border border-border/40 bg-background/40"
          >
            <span className="text-xs font-mono w-6 text-muted-foreground">#{idx + 1}</span>
            <span className="flex-1 text-sm">{isFR ? o.label_fr : o.label_en}</span>
            <Button size="sm" variant="ghost" onClick={() => move(idx, -1)} disabled={idx === 0}>
              ▲
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => move(idx, 1)}
              disabled={idx === order.length - 1}
            >
              ▼
            </Button>
          </div>
        );
      })}
    </div>
  );
}
