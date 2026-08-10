import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  CreditCard,
  ArrowRight,
  CheckCircle2,
  Circle,
  Mail,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { NeuralCard } from "@/components/ui/neural-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import {
  getLatestSubmittedSessionForUser,
  archetypeMeta,
} from "@/features/archetype-assessment/services/assessmentService";
import { VISITOR_PAYMENT_CTA_URL } from "@/lib/authVisitor";
import type { ArchetypeKey } from "@/features/archetype-assessment/domain/types";

export default function VisitorDashboard() {
  const { user } = useAuth();
  const { t, locale } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isFR = locale === "fr";

  const [quizDone, setQuizDone] = useState<boolean | null>(null);
  const [topArchetype, setTopArchetype] = useState<ArchetypeKey | null>(null);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    if (!user?.id) return;

    (async () => {
      try {
        const session = await getLatestSubmittedSessionForUser(user.id);
        if (!alive) return;
        if (!session) {
          setQuizDone(false);
          return;
        }
        setQuizDone(true);
        setSubmittedAt(session.submitted_at);
        const { data: scoreRow } = await supabase
          .from("archetype_scores")
          .select("archetype_key")
          .eq("user_id", user.id)
          .eq("session_id", session.id)
          .order("rank", { ascending: true })
          .limit(1)
          .maybeSingle();
        if (scoreRow?.archetype_key) {
          setTopArchetype(scoreRow.archetype_key as ArchetypeKey);
        }
      } catch {
        if (alive) setQuizDone(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [user?.id]);

  const handlePayment = () => {
    if (VISITOR_PAYMENT_CTA_URL) {
      window.open(VISITOR_PAYMENT_CTA_URL, "_blank", "noopener,noreferrer");
      return;
    }
    toast({
      title: t("visitor.payment.soonTitle"),
      description: t("visitor.payment.soonDesc"),
    });
  };

  const archetypeName = topArchetype
    ? isFR
      ? archetypeMeta(topArchetype).name_fr
      : archetypeMeta(topArchetype).name_en
    : null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">
      <header className="space-y-2 text-center sm:text-left">
        <Badge variant="outline" className="border-primary/30 text-primary uppercase tracking-widest text-[10px]">
          {t("visitor.dashboard.badge")}
        </Badge>
        <h1 className="font-display text-2xl sm:text-3xl tracking-wide text-foreground">
          {t("visitor.dashboard.title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("visitor.dashboard.subtitle")}</p>
      </header>

      <NeuralCard variant="elevated" glow="warm" className="p-5 space-y-4">
        <div className="flex items-start gap-3">
          <Mail className="w-5 h-5 text-accent-primary shrink-0 mt-0.5" aria-hidden />
          <div className="flex-1 min-w-0">
            <h2 className="font-serif text-lg">{t("auth.newsletter.cardTitle")}</h2>
            <p className="text-sm text-muted-foreground mt-1">{t("auth.newsletter.cardDesc")}</p>
          </div>
        </div>
        <Button asChild className="w-full min-h-[44px]">
          <Link to="/newsletter">
            {t("auth.newsletter.cta")}
            <ArrowRight className="w-4 h-4 ml-2" aria-hidden />
          </Link>
        </Button>
      </NeuralCard>

      <NeuralCard variant="elevated" glow="blue" className="p-5 space-y-4">
        <div className="flex items-start gap-3">
          {quizDone ? (
            <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          ) : (
            <Circle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            <h2 className="font-serif text-lg">{t("visitor.quizStatus.title")}</h2>
            {quizDone === null ? (
              <p className="text-xs text-muted-foreground mt-1">{t("visitor.loading")}</p>
            ) : quizDone ? (
              <>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("visitor.quizStatus.done")}
                  {archetypeName && (
                    <span className="text-foreground font-medium"> — {archetypeName}</span>
                  )}
                </p>
                {submittedAt && (
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {new Date(submittedAt).toLocaleDateString(isFR ? "fr-FR" : "en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground mt-1">{t("visitor.quizStatus.pending")}</p>
            )}
          </div>
        </div>
        <Button
          className="w-full"
          onClick={() => navigate(quizDone ? "/visitor/report" : "/quiz")}
          disabled={quizDone === null}
        >
          <Sparkles className="w-4 h-4 mr-2" />
          {quizDone ? t("visitor.viewReport") : t("visitor.startQuiz")}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </NeuralCard>

      <NeuralCard className="p-5 space-y-3">
        <CreditCard className="w-5 h-5 text-primary" />
        <h3 className="font-serif">{t("visitor.payment.title")}</h3>
        <p className="text-xs text-muted-foreground">{t("visitor.payment.desc")}</p>
        <Button variant="outline" className="w-full" onClick={handlePayment}>
          {t("visitor.payment.cta")}
        </Button>
      </NeuralCard>
    </div>
  );
}
