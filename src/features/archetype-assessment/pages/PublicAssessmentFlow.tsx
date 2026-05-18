import { useEffect, useMemo, useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
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
  Clock,
  Loader2,
  Sparkles,
  X,
} from "lucide-react";
import {
  loadActiveTemplate,
  createSession,
  submitSession,
} from "../services/assessmentService";
import { computeRawScores } from "../domain/scoringEngine";
import { useAssessmentSession } from "../hooks/useAssessmentSession";
import type { LoadedTemplate } from "../services/assessmentService";
import { MiniRadarThumb } from "../components/MiniRadarThumb";
import { AssessmentQuestionRenderer } from "../components/AssessmentQuestionRenderer";

const SECONDS_PER_QUESTION = 18;

function formatMinutesRemaining(remainingQuestions: number, isFR: boolean): string {
  const seconds = Math.max(0, remainingQuestions) * SECONDS_PER_QUESTION;
  const minutes = Math.max(1, Math.round(seconds / 60));
  return isFR ? `~${minutes} min restantes` : `~${minutes} min remaining`;
}

export default function PublicAssessmentFlow() {
  const navigate = useNavigate();
  const { user, loading: authLoading, bootScreenActive } = useAuth();
  const { t, locale } = useLanguage();
  const isFR = locale === "fr";

  const [loaded, setLoaded] = useState<LoadedTemplate | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (authLoading || bootScreenActive || !user) return;
    let alive = true;
    loadActiveTemplate()
      .then((tpl) => {
        if (!alive) return;
        const required = tpl.questions.filter((q) => q.is_required !== false);
        setLoaded({ ...tpl, questions: required });
      })
      .catch((e) => alive && setLoadError(e.message ?? "Erreur de chargement"));
    return () => {
      alive = false;
    };
  }, [authLoading, bootScreenActive, user]);

  const session = useAssessmentSession({ questions: loaded?.questions ?? [] });

  if (!authLoading && !bootScreenActive && !user) {
    return <Navigate to="/auth?guest=1&redirect=%2Fquiz" replace />;
  }

  const handleStart = async () => {
    if (!user || !loaded) return;
    try {
      const sid = await createSession(user.id, loaded.template.id);
      setSessionId(sid);
      session.goToQuestions();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast({ title: t("toast.error"), description: msg, variant: "destructive" });
    }
  };

  const handleSubmit = async () => {
    if (!user || !sessionId || !loaded) return;
    setSubmitting(true);
    try {
      await submitSession({
        userId: user.id,
        sessionId,
        questions: loaded.questions,
        responses: session.responsesArray,
        startedAt: session.startedAt,
      });
      navigate("/visitor/report", { replace: true });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast({ title: t("toast.error"), description: msg, variant: "destructive" });
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
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <Card className="p-6 max-w-md">
          <p className="text-destructive">{loadError}</p>
          <Button className="mt-4" onClick={() => navigate("/visitor")}>
            {t("visitor.backToSpace")}
          </Button>
        </Card>
      </div>
    );
  }

  if (authLoading || bootScreenActive || !loaded || !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const { template } = loaded;
  const remaining = Math.max(0, session.totalQuestions - (session.questionIndex + 1));

  return (
    <div className="min-h-screen relative">
      <div className="absolute top-4 right-4 z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/visitor")}
          aria-label="close"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {session.step === "questions" && (
        <MiniRadarThumb isFR={isFR} rawScores={liveRawScores} />
      )}

      <div className="max-w-2xl mx-auto px-4 py-10 sm:py-16">
        {session.step === "welcome" && (
          <Card className="p-6 sm:p-10 backdrop-blur-3xl bg-card/40 border-border/40">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-6 h-6 text-primary" />
              <h1 className="text-2xl sm:text-3xl font-serif">
                {isFR ? template.title_fr : template.title_en}
              </h1>
            </div>
            <p className="text-muted-foreground mb-4">
              {isFR ? template.description_fr : template.description_en}
            </p>

            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 mb-4">
              <p className="text-sm font-medium mb-1">{t("quiz.public.badge")}</p>
              <p className="text-xs text-muted-foreground">{t("quiz.public.duration")}</p>
            </div>

            <ul className="space-y-2 text-sm text-muted-foreground mb-8">
              <li>• {t("quiz.public.bullet1")}</li>
              <li>• {t("quiz.public.bullet2")}</li>
              <li>• {t("quiz.public.bullet3")}</li>
            </ul>
            <Button size="lg" className="w-full" onClick={handleStart}>
              {t("quiz.public.start")} <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Card>
        )}

        {session.step === "questions" && session.currentQuestion && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>
                  {isFR
                    ? `Question ${session.questionIndex + 1} / ${session.totalQuestions}`
                    : `Question ${session.questionIndex + 1} / ${session.totalQuestions}`}
                </span>
                <span>{Math.round(session.progress * 100)}%</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-2">
                <Clock className="w-3 h-3" />
                <span>{formatMinutesRemaining(remaining, isFR)}</span>
              </div>
              <Progress value={session.progress * 100} />
            </div>

            <Card className="p-5 sm:p-7 backdrop-blur-3xl bg-card/40 border-border/40">
              <AssessmentQuestionRenderer
                question={session.currentQuestion}
                value={session.responses[session.currentQuestion.id]}
                onChange={session.setResponse}
                isFR={isFR}
              />
            </Card>

            <div className="flex items-center justify-between gap-3">
              <Button variant="ghost" onClick={session.previous}>
                <ArrowLeft className="mr-2 w-4 h-4" /> {isFR ? "Précédent" : "Previous"}
              </Button>
              <Button onClick={session.next} disabled={!session.isCurrentAnswered}>
                {session.questionIndex === session.totalQuestions - 1
                  ? isFR
                    ? "Revoir"
                    : "Review"
                  : isFR
                    ? "Suivant"
                    : "Next"}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {session.step === "review" && (
          <Card className="p-6 sm:p-8 backdrop-blur-3xl bg-card/40 border-border/40">
            <h2 className="text-xl sm:text-2xl font-serif mb-2">
              {isFR ? "Revue" : "Review"}
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              {isFR
                ? `${session.responsesArray.length} / ${session.totalQuestions} questions répondues.`
                : `${session.responsesArray.length} / ${session.totalQuestions} questions answered.`}
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
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="ghost"
                onClick={() => session.goToQuestion(0)}
                className="flex-1"
              >
                {isFR ? "Revenir aux questions" : "Back to questions"}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!session.requiredAnswered || submitting}
                className="flex-1"
              >
                {submitting && <Loader2 className="mr-2 w-4 h-4 animate-spin" />}
                {isFR ? "Voir mon rapport" : "View my report"}
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
