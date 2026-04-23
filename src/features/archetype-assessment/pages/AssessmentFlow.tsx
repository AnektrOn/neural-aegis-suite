import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
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
  Layers,
  Check,
  Clock,
} from "lucide-react";
import {
  loadActiveTemplate,
  createSession,
  submitSession,
  submitAppendixResponses,
} from "../services/assessmentService";
import { computeRawScores } from "../domain/scoringEngine";
import { useAssessmentSession } from "../hooks/useAssessmentSession";
import type { LoadedTemplate } from "../services/assessmentService";
import type { ResponseValue, RuntimeQuestion } from "../domain/types";
import { MiniRadarThumb } from "../components/MiniRadarThumb";
import {
  loadAppendix,
  loadUserResponses,
} from "@/features/appendix/service";
import type {
  AppendixCategoryWithQuestions,
  AppendixQuestion,
} from "@/features/appendix/types";

const SECONDS_PER_QUESTION = 18;

function formatMinutesRemaining(remainingQuestions: number, isFR: boolean): string {
  const seconds = Math.max(0, remainingQuestions) * SECONDS_PER_QUESTION;
  const minutes = Math.max(1, Math.round(seconds / 60));
  return isFR ? `~${minutes} min restantes` : `~${minutes} min remaining`;
}

type FlowStage = "phase1" | "phase2-hub" | "phase2-category";

export default function AssessmentFlow() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { locale } = useLanguage();
  const isFR = locale === "fr";

  const [loaded, setLoaded] = useState<LoadedTemplate | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [stage, setStage] = useState<FlowStage>("phase1");

  // --- Phase 2 state ---
  const [appendixCats, setAppendixCats] = useState<AppendixCategoryWithQuestions[]>([]);
  const [appendixLoading, setAppendixLoading] = useState(false);
  const [completedCatIds, setCompletedCatIds] = useState<Set<string>>(new Set());
  const [activeCatId, setActiveCatId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    loadActiveTemplate()
      .then((t) => {
        if (!alive) return;
        // Phase 1 = ONLY required core questions
        const required = t.questions.filter((q) => q.is_required !== false);
        setLoaded({ ...t, questions: required });
      })
      .catch((e) => alive && setLoadError(e.message ?? "Erreur de chargement"));
    return () => {
      alive = false;
    };
  }, []);

  const session = useAssessmentSession({ questions: loaded?.questions ?? [] });

  const handleStart = async () => {
    if (!user || !loaded) return;
    try {
      const sid = await createSession(user.id, loaded.template.id);
      setSessionId(sid);
      session.goToQuestions();
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
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
      // Move to Phase 2 hub instead of jumping straight to results
      setStage("phase2-hub");
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  // Load appendix categories when entering Phase 2
  useEffect(() => {
    if (stage !== "phase2-hub" || !user || appendixCats.length > 0) return;
    setAppendixLoading(true);
    Promise.all([loadAppendix(), loadUserResponses(user.id)])
      .then(([cats, resps]) => {
        setAppendixCats(cats);
        // A category counts as "completed" if all its required questions are answered
        const done = new Set<string>();
        for (const c of cats) {
          const req = c.questions.filter((q) => q.is_required);
          const allAnswered =
            req.length > 0 &&
            req.every((q) => resps.has(q.id));
          if (allAnswered) done.add(c.id);
        }
        setCompletedCatIds(done);
      })
      .catch((e) =>
        toast({ title: "Erreur", description: e.message, variant: "destructive" })
      )
      .finally(() => setAppendixLoading(false));
  }, [stage, user, appendixCats.length]);

  // --- Live emerging archetype scores from current Phase 1 responses ---
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
            {isFR ? "Retour" : "Back"}
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

  const { template } = loaded;

  // ───────────────────────── Phase 2 (category runner) ─────────────────────────
  if (stage === "phase2-category" && activeCatId && sessionId && user) {
    const cat = appendixCats.find((c) => c.id === activeCatId);
    if (!cat) {
      setStage("phase2-hub");
      return null;
    }
    return (
      <AppendixCategoryRunner
        category={cat}
        sessionId={sessionId}
        userId={user.id}
        isFR={isFR}
        onClose={() => setStage("phase2-hub")}
        onCompleted={() => {
          setCompletedCatIds((prev) => new Set(prev).add(cat.id));
          setStage("phase2-hub");
          toast({
            title: isFR ? "Catégorie complétée" : "Category completed",
          });
        }}
      />
    );
  }

  // ───────────────────────── Phase 2 hub ─────────────────────────
  if (stage === "phase2-hub") {
    return (
      <div className="min-h-screen relative">
        <div className="absolute top-4 right-4 z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/onboarding/results")}
            aria-label="close"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-10 sm:py-16 space-y-6">
          <header className="text-center">
            <Layers className="w-7 h-7 text-primary mx-auto mb-2" />
            <h1 className="text-2xl sm:text-3xl font-serif">
              {isFR ? "Approfondir mon profil" : "Deepen my profile"}
            </h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-xl mx-auto">
              {isFR
                ? "Choisis une catégorie pour affiner tes archétypes. Ton radar évolue à chaque catégorie complétée."
                : "Pick a category to refine your archetypes. Your radar evolves with every category completed."}
            </p>
          </header>

          {appendixLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : appendixCats.length === 0 ? (
            <Card className="p-6 text-center text-sm text-muted-foreground">
              {isFR
                ? "Aucune catégorie d'approfondissement disponible."
                : "No deepening categories available."}
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {appendixCats.map((c) => {
                const done = completedCatIds.has(c.id);
                const count = c.questions.length;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setActiveCatId(c.id);
                      setStage("phase2-category");
                    }}
                    className="text-left p-5 rounded-2xl border border-border/40 bg-card/40
                               backdrop-blur-3xl hover:border-primary/40 transition group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-serif text-lg leading-snug">
                          {isFR ? c.label_fr : c.label_en}
                        </h3>
                        {(c.description_fr || c.description_en) && (
                          <p className="text-xs text-muted-foreground mt-1.5 line-clamp-3">
                            {isFR ? c.description_fr : c.description_en}
                          </p>
                        )}
                        <p className="text-[11px] text-muted-foreground mt-2">
                          {count}{" "}
                          {isFR
                            ? count > 1
                              ? "questions"
                              : "question"
                            : count > 1
                            ? "questions"
                            : "question"}
                        </p>
                      </div>
                      {done ? (
                        <span className="shrink-0 w-7 h-7 rounded-full bg-primary/15 border border-primary/40 flex items-center justify-center">
                          <Check className="w-4 h-4 text-primary" strokeWidth={2} />
                        </span>
                      ) : (
                        <span className="shrink-0 w-7 h-7 rounded-full border border-border/40 flex items-center justify-center text-muted-foreground group-hover:text-primary transition">
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex justify-center pt-4">
            <Button onClick={() => navigate("/onboarding/results")} variant="outline">
              {isFR ? "Voir mes résultats" : "View my results"}{" "}
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ───────────────────────── Phase 1 ─────────────────────────
  const remaining = Math.max(0, session.totalQuestions - (session.questionIndex + 1));

  return (
    <div className="min-h-screen relative">
      <div className="absolute top-4 right-4 z-10">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")} aria-label="close">
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Mini emerging-profile widget — visible while answering */}
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
              <p className="text-sm font-medium mb-1">
                {isFR ? "Évaluation essentielle (~10 min)" : "Core Assessment (~10 min)"}
              </p>
              <p className="text-xs text-muted-foreground">
                {isFR
                  ? `${session.totalQuestions} questions essentielles pour révéler tes archétypes dominants.`
                  : `${session.totalQuestions} essential questions to reveal your dominant archetypes.`}
              </p>
            </div>

            <ul className="space-y-2 text-sm text-muted-foreground mb-8">
              <li>
                •{" "}
                {isFR
                  ? "Phase 2 optionnelle pour approfondir ton profil"
                  : "Optional Phase 2 to deepen your profile"}
              </li>
              <li>
                •{" "}
                {isFR
                  ? "Tes 3 archétypes dominants + pratiques recommandées"
                  : "Your top 3 archetypes + recommended practices"}
              </li>
            </ul>
            <Button size="lg" className="w-full" onClick={handleStart}>
              {isFR ? "Commencer" : "Start"} <ArrowRight className="ml-2 w-4 h-4" />
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
              <QuestionRenderer
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
                {isFR ? "Soumettre" : "Submit"}
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Phase 2 — single-category runner                                           */
/* -------------------------------------------------------------------------- */

function AppendixCategoryRunner({
  category,
  sessionId,
  userId,
  isFR,
  onClose,
  onCompleted,
}: {
  category: AppendixCategoryWithQuestions;
  sessionId: string;
  userId: string;
  isFR: boolean;
  onClose: () => void;
  onCompleted: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const [responses, setResponses] = useState<Record<string, ResponseValue>>({});
  const [submitting, setSubmitting] = useState(false);

  const total = category.questions.length;
  const current = category.questions[idx];

  // Convert AppendixQuestion -> RuntimeQuestion shape for the renderer
  const runtimeQ: RuntimeQuestion | undefined = current
    ? appendixToRuntime(current)
    : undefined;

  // Live emerging scores from Phase 2 answers
  const liveRawScores = useMemo<Record<string, number>>(() => {
    const runtimeAll = category.questions.map(appendixToRuntime);
    const { archetypeScores } = computeRawScores(
      runtimeAll,
      Object.values(responses)
    );
    return archetypeScores as Record<string, number>;
  }, [category.questions, responses]);

  const setResponse = (v: ResponseValue) =>
    setResponses((prev) => ({ ...prev, [v.questionId]: v }));

  const remaining = Math.max(0, total - (idx + 1));

  const isCurrentAnswered = (() => {
    if (!current) return false;
    if (!current.is_required) return true;
    const r = responses[current.id];
    if (!r) return false;
    if (current.question_type === "short_text") {
      return Boolean(r.textValue && r.textValue.trim().length > 0);
    }
    return (r.selectedOptionIds?.length ?? 0) > 0;
  })();

  const handleNext = async () => {
    if (idx < total - 1) {
      setIdx((i) => i + 1);
      return;
    }
    // Last question — persist and finalize this category
    setSubmitting(true);
    try {
      const runtimeAll = category.questions.map(appendixToRuntime);
      await submitAppendixResponses({
        userId,
        sessionId,
        questions: runtimeAll,
        responses: Object.values(responses),
      });
      onCompleted();
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative">
      <div className="absolute top-4 right-4 z-10">
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="close">
          <X className="w-5 h-5" />
        </Button>
      </div>

      <MiniRadarThumb isFR={isFR} rawScores={liveRawScores} />

      <div className="max-w-2xl mx-auto px-4 py-10 sm:py-16 space-y-6">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
            {isFR ? category.label_fr : category.label_en}
          </p>
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>
              {isFR
                ? `Question ${idx + 1} / ${total}`
                : `Question ${idx + 1} / ${total}`}
            </span>
            <span>{Math.round(((idx + 1) / total) * 100)}%</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-2">
            <Clock className="w-3 h-3" />
            <span>{formatMinutesRemaining(remaining, isFR)}</span>
          </div>
          <Progress value={((idx + 1) / total) * 100} />
        </div>

        {runtimeQ && (
          <Card className="p-5 sm:p-7 backdrop-blur-3xl bg-card/40 border-border/40">
            <QuestionRenderer
              question={runtimeQ}
              value={responses[runtimeQ.id]}
              onChange={setResponse}
              isFR={isFR}
            />
          </Card>
        )}

        <div className="flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            onClick={() => (idx > 0 ? setIdx((i) => i - 1) : onClose())}
          >
            <ArrowLeft className="mr-2 w-4 h-4" />
            {idx > 0 ? (isFR ? "Précédent" : "Previous") : isFR ? "Quitter" : "Exit"}
          </Button>
          <Button onClick={handleNext} disabled={!isCurrentAnswered || submitting}>
            {submitting && <Loader2 className="mr-2 w-4 h-4 animate-spin" />}
            {idx === total - 1
              ? isFR
                ? "Terminer la catégorie"
                : "Finish category"
              : isFR
              ? "Suivant"
              : "Next"}
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function appendixToRuntime(q: AppendixQuestion): RuntimeQuestion {
  return {
    id: q.id,
    position: q.position,
    question_type: q.question_type,
    prompt_fr: q.prompt_fr,
    prompt_en: q.prompt_en,
    helper_fr: q.helper_fr,
    helper_en: q.helper_en,
    dimension: null as any,
    is_required: q.is_required,
    meta: {},
    options: (q.options ?? []).map((o) => ({
      id: o.id,
      position: o.position,
      label_fr: o.label_fr,
      label_en: o.label_en,
      archetype_weights: (o as any).archetype_weights ?? {},
      shadow_weights: (o as any).shadow_weights ?? {},
      value: o.value,
    })),
  };
}

/* -------------------------------------------------------------------------- */
/* Question renderer                                                          */
/* -------------------------------------------------------------------------- */

function QuestionRenderer({
  question,
  value,
  onChange,
  isFR,
}: {
  question: RuntimeQuestion;
  value?: ResponseValue;
  onChange: (v: ResponseValue) => void;
  isFR: boolean;
}) {
  const prompt = isFR ? question.prompt_fr : question.prompt_en;
  const helper = isFR ? question.helper_fr : question.helper_en;

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-medium leading-snug">{prompt}</h3>
        {helper && <p className="text-xs text-muted-foreground mt-1">{helper}</p>}
      </div>

      {question.question_type === "single_choice" && (
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
      )}

      {question.question_type === "multiple_choice" && (
        <MultipleChoice question={question} value={value} onChange={onChange} isFR={isFR} />
      )}

      {question.question_type === "likert_scale" && (
        <LikertScale question={question} value={value} onChange={onChange} isFR={isFR} />
      )}

      {question.question_type === "ranking" && (
        <Ranking question={question} value={value} onChange={onChange} isFR={isFR} />
      )}

      {question.question_type === "short_text" && (
        <Textarea
          value={value?.textValue ?? ""}
          maxLength={(question.meta as any)?.maxLength ?? 280}
          onChange={(e) =>
            onChange({ questionId: question.id, textValue: e.target.value })
          }
          placeholder={isFR ? "Votre réponse…" : "Your answer…"}
          rows={4}
        />
      )}
    </div>
  );
}

function MultipleChoice({
  question,
  value,
  onChange,
  isFR,
}: {
  question: RuntimeQuestion;
  value?: ResponseValue;
  onChange: (v: ResponseValue) => void;
  isFR: boolean;
}) {
  const max = (question.meta as any)?.maxSelect ?? question.options.length;
  const selected = value?.selectedOptionIds ?? [];
  const toggle = (id: string) => {
    let next: string[];
    if (selected.includes(id)) {
      next = selected.filter((x) => x !== id);
    } else {
      if (selected.length >= max) return;
      next = [...selected, id];
    }
    onChange({ questionId: question.id, selectedOptionIds: next });
  };
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        {isFR ? `Sélection max : ${max}` : `Max select: ${max}`}
      </p>
      {question.options.map((o) => (
        <Label
          key={o.id}
          className="flex items-start gap-3 p-3 rounded-lg border border-border/40 hover:bg-accent/20 cursor-pointer"
        >
          <Checkbox
            checked={selected.includes(o.id)}
            onCheckedChange={() => toggle(o.id)}
            className="mt-0.5"
          />
          <span className="text-sm">{isFR ? o.label_fr : o.label_en}</span>
        </Label>
      ))}
    </div>
  );
}

function LikertScale({
  question,
  value,
  onChange,
  isFR,
}: {
  question: RuntimeQuestion;
  value?: ResponseValue;
  onChange: (v: ResponseValue) => void;
  isFR: boolean;
}) {
  const options = question.options;
  const selectedIdx = options.findIndex((o) => value?.selectedOptionIds?.includes(o.id));
  const idx = selectedIdx >= 0 ? selectedIdx : Math.floor(options.length / 2);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{isFR ? "Pas du tout" : "Not at all"}</span>
        <span>{isFR ? "Tout à fait" : "Totally"}</span>
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
              numericValue: (o.value ?? null) as any,
            });
        }}
      />
      <p className="text-center text-sm font-medium">
        {selectedIdx >= 0 ? options[selectedIdx].label_fr : "—"}
      </p>
    </div>
  );
}

function Ranking({
  question,
  value,
  onChange,
  isFR,
}: {
  question: RuntimeQuestion;
  value?: ResponseValue;
  onChange: (v: ResponseValue) => void;
  isFR: boolean;
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
        {isFR
          ? "Utilisez ▲ ▼ pour ordonner du plus fort au plus faible."
          : "Use ▲ ▼ to order strongest to weakest."}
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
