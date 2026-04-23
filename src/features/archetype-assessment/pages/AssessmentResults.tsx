import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, ArrowLeft } from "lucide-react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import {
  archetypeMeta,
  getLatestSubmittedSessionForUser,
  getSessionFullDetails,
} from "../services/assessmentService";
import type { ArchetypeKey } from "../domain/types";

export default function AssessmentResults() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { locale } = useLanguage();
  const isFR = locale === "fr";

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Awaited<ReturnType<typeof getSessionFullDetails>> | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!user) return;
      try {
        const session = await getLatestSubmittedSessionForUser(user.id);
        if (!session) {
          if (alive) setLoading(false);
          return;
        }
        const details = await getSessionFullDetails(session.id);
        if (alive) {
          setData(details);
          setLoading(false);
        }
      } catch {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!data || !data.analysis) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="p-6 max-w-md text-center">
          <p className="mb-4">{isFR ? "Aucun résultat trouvé." : "No results found."}</p>
          <Button onClick={() => navigate("/onboarding/assessment")}>
            {isFR ? "Faire l'évaluation" : "Take the assessment"}
          </Button>
        </Card>
      </div>
    );
  }

  const { analysis, scores, recommendations } = data;
  const top: ArchetypeKey[] = analysis.top_archetypes ?? [];

  const radarData = (scores ?? []).map((s: any) => {
    const meta = archetypeMeta(s.archetype_key);
    return {
      key: s.archetype_key,
      name: isFR ? meta?.name_fr ?? s.archetype_key : meta?.name_en ?? s.archetype_key,
      score: Math.round(Number(s.normalized_score ?? 0) * 100),
    };
  });

  return (
    <div className="min-h-screen max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> {isFR ? "Tableau de bord" : "Dashboard"}
        </Button>
      </div>

      <header className="text-center">
        <Sparkles className="w-8 h-8 text-primary mx-auto mb-2" />
        <h1 className="text-2xl sm:text-3xl font-serif">
          {isFR ? "Vos archétypes dominants" : "Your dominant archetypes"}
        </h1>
        <p className="text-muted-foreground text-sm mt-2 max-w-2xl mx-auto">
          {isFR ? analysis.summary_fr : analysis.summary_en}
        </p>
      </header>

      {/* Top 3 cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        {top.map((k, idx) => {
          const a = archetypeMeta(k);
          if (!a) return null;
          return (
            <Card key={k} className="p-5 backdrop-blur-3xl bg-card/40 border-border/40">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ background: a.color }}
                />
                <span className="text-xs text-muted-foreground">#{idx + 1}</span>
              </div>
              <h3 className="font-serif text-lg">{isFR ? a.name_fr : a.name_en}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {isFR ? a.shortDescription_fr : a.shortDescription_en}
              </p>
            </Card>
          );
        })}
      </div>

      {/* Radar */}
      <Card className="p-4 sm:p-6 backdrop-blur-3xl bg-card/40 border-border/40">
        <h2 className="font-serif text-lg mb-3">
          {isFR ? "Cartographie des 12 archétypes" : "12-archetype map"}
        </h2>
        <div className="w-full h-[360px]">
          <ResponsiveContainer>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="name" tick={{ fontSize: 11 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Radar
                name="Score"
                dataKey="score"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.35}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Strengths & Watchouts */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card className="p-5 backdrop-blur-3xl bg-card/40 border-border/40">
          <h3 className="font-serif text-lg mb-2">{isFR ? "Forces" : "Strengths"}</h3>
          <ul className="space-y-2 text-sm">
            {(isFR ? analysis.strengths_fr : analysis.strengths_en)?.map((s: string, i: number) => (
              <li key={i}>• {s}</li>
            ))}
          </ul>
        </Card>
        <Card className="p-5 backdrop-blur-3xl bg-card/40 border-border/40">
          <h3 className="font-serif text-lg mb-2">{isFR ? "Points de vigilance" : "Watch-outs"}</h3>
          <ul className="space-y-2 text-sm">
            {(isFR ? analysis.watchouts_fr : analysis.watchouts_en)?.map((s: string, i: number) => (
              <li key={i}>• {s}</li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Recommended tools */}
      <Card className="p-5 backdrop-blur-3xl bg-card/40 border-border/40">
        <h2 className="font-serif text-lg mb-4">
          {isFR ? "Pratiques recommandées" : "Recommended practices"}
        </h2>
        <div className="space-y-3">
          {recommendations.map((t: any) => (
            <div
              key={t.id}
              className="p-4 rounded-lg border border-border/40 bg-background/40"
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className="text-xs">{t.tool_type}</Badge>
                    <h4 className="font-medium">{isFR ? t.title_fr : t.title_en}</h4>
                    {t.duration_fr && (
                      <span className="text-xs text-muted-foreground">
                        · {isFR ? t.duration_fr : t.duration_en}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isFR ? t.rationale_fr : t.rationale_en}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {recommendations.length === 0 && (
            <p className="text-sm text-muted-foreground">
              {isFR ? "Aucune recommandation." : "No recommendation."}
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
