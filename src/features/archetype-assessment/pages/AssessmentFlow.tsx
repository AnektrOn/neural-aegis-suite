import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Sparkles, X } from "lucide-react";
import {
  loadActiveTemplate,
  createSession,
  submitSession,
} from "../services/assessmentService";
import { useAssessmentSession } from "../hooks/useAssessmentSession";
import type { LoadedTemplate } from "../services/assessmentService";
import type { ResponseValue, RuntimeQuestion } from "../domain/types";

export default function AssessmentFlow() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language } = useLanguage();
  const isFR = language === "fr";

  const [loaded, setLoaded] = useState<LoadedTemplate | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let alive = true;
    loadActiveTemplate()
      .then((t) => alive && setLoaded(t))
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
      navigate("/onboarding/results");
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
      setSubmitting(false);
    }
  };

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="p-6 max-w-md">
          <p className="text-destructive">{loadError}</p>
          <Button className="mt-4" onClick={() => navigate("/")}>{isFR ? "Retour" : "Back"}</Button>
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

  return (
    <div className="min-h-screen relative">
      <div className="absolute top-4 right-4 z-10">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")} aria-label="close">
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10 sm:py-16">
        {session.step === "welcome" && (
          <Card className="p-6 sm:p-10 backdrop-blur-3xl bg-card/40 border-border/40">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-6 h-6 text-primary" />
              <h1 className="text-2xl sm:text-3xl font-serif">
                {isFR ? template.title_fr : template.title_en}
              </h1>
            </div>
            <p className="text-muted-foreground mb-6">
              {isFR ? template.description_fr : template.description_en}
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground mb-8">
              <li>• {isFR ? `${session.totalQuestions} questions` : `${session.totalQuestions} questions`}</li>
              <li>• {isFR ? "≈ 8 minutes" : "≈ 8 minutes"}</li>
              <li>• {isFR ? "Vous obtiendrez vos 3 archétypes dominants + pratiques recommandées" : "You'll get your top 3 archetypes + recommended practices"}</li>
            </ul>
            <Button size="lg" className="w-full" onClick={handleStart}>
              {isFR ? "Commencer" : "Start"} <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Card>
        )}

        {session.step === "questions" && session.currentQuestion && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span>{session.questionIndex + 1} / {session.totalQuestions}</span>
                <span>{Math.round(session.progress * 100)}%</span>
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
                  ? (isFR ? "Revoir" : "Review")
                  : (isFR ? "Suivant" : "Next")}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {session.step === "review" && (
          <Card className="p-6 sm:p-8 backdrop-blur-3xl bg-card/40 border-border/40">
            <h2 className="text-xl sm:text-2xl font-serif mb-2">{isFR ? "Revue" : "Review"}</h2>
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
                      className={`w-4 h-4 ${answered ? "text-primary" : "text-muted-foreground/40"}`}
                    />
                    <span className="text-sm flex-1 truncate">
                      {idx + 1}. {isFR ? q.prompt_fr : q.prompt_en}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="ghost" onClick={() => session.goToQuestion(0)} className="flex-1">
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
          if (o) onChange({ questionId: question.id, selectedOptionIds: [o.id], numericValue: o.value ?? null as any });
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
  const order = value?.selectedOptionIds && value.selectedOptionIds.length === question.options.length
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
        {isFR ? "Utilisez ▲ ▼ pour ordonner du plus fort au plus faible." : "Use ▲ ▼ to order strongest to weakest."}
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
            <Button size="sm" variant="ghost" onClick={() => move(idx, -1)} disabled={idx === 0}>▲</Button>
            <Button size="sm" variant="ghost" onClick={() => move(idx, 1)} disabled={idx === order.length - 1}>▼</Button>
          </div>
        );
      })}
    </div>
  );
}
