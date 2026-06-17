import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, ArrowLeft, AlertTriangle, Info, TrendingUp, Crown, FileDown } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";
import {
  archetypeMeta,
  getLatestSubmittedSessionForUser,
  getSessionResultsSummary,
  getPreviousSubmittedSessionForUser,
  getSessionArchetypeScores,
  v4PoleAnalysisFromSummary,
  type AssessmentSessionRow,
  type SessionResultsSummary,
} from "../services/assessmentService";
import { exportProfileToPdf } from "../services/exportProfilePdf";
import type { Json } from "@/integrations/supabase/types";
import type { ArchetypeKey } from "../domain/types";
import { DualLayerRadar } from "../components/DualLayerRadar";
import { V4PoleCartographyZones } from "../components/V4PoleCartographyZones";
import { NarrativeProfileCard } from "../components/NarrativeProfileCard";
import { buildNarrative } from "../components/narrativeProfile";

const SHADOW_KEYS = ["child", "victim", "prostitute", "saboteur"] as const;

function clientMetaFromRecord(meta: Json | null | undefined): Record<string, unknown> {
  if (meta && typeof meta === "object" && !Array.isArray(meta)) {
    return meta as Record<string, unknown>;
  }
  return {};
}

function userDisplayFirstName(user: NonNullable<ReturnType<typeof useAuth>["user"]>): string {
  const meta = user.user_metadata as Record<string, unknown> | undefined;
  const first = typeof meta?.first_name === "string" ? meta.first_name : null;
  const full = typeof meta?.full_name === "string" ? meta.full_name.split(" ")[0] : null;
  return first ?? full ?? user.email?.split("@")?.[0] ?? "profil";
}

export default function AssessmentResults() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { locale, t } = useLanguage();
  const isFR = locale === "fr";

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SessionResultsSummary | null>(null);
  const [previousSession, setPreviousSession] = useState<AssessmentSessionRow | null>(null);
  const [previousScores, setPreviousScores] = useState<
    Array<{ archetype_key: string; normalized_score: number }> | null
  >(null);
  const [showPrevious, setShowPrevious] = useState(false);
  const [exporting, setExporting] = useState(false);
  const radarRef = useRef<HTMLDivElement>(null);

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

        const [details, prev] = await Promise.all([
          getSessionResultsSummary(session.id),
          getPreviousSubmittedSessionForUser(user.id, session.id),
        ]);
        if (!alive) return;
        setData(details);
        setLoading(false);

        if (prev) {
          setPreviousSession(prev);
          void getSessionArchetypeScores(prev.id).then((prevScores) => {
            if (alive) setPreviousScores(prevScores);
          });
        }
      } catch {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [user]);

  // --- Derived: dominant + growth archetype ---
  const { dominantKey, growthKey } = useMemo(() => {
    if (!data?.scores || !data?.analysis) return { dominantKey: null as ArchetypeKey | null, growthKey: null as ArchetypeKey | null };

    const scores = data.scores as Array<{ archetype_key: string; normalized_score: number; rank: number }>;
    const sorted = [...scores].sort((a, b) => Number(b.normalized_score) - Number(a.normalized_score));
    const dominant = (sorted[0]?.archetype_key as ArchetypeKey) ?? null;

    // Growth = archetype with biggest "shadow activation - light score" delta.
    // Shadow signals are 0..1; map them onto archetypes via the shared lexicon
    // (sovereign/control, victim/victim, lover&caregiver/prostitute, warrior/saboteur).
    const shadow = data.analysis.shadow_signals ?? {};
    const lightOf = (k: string) =>
      Number(scores.find((s) => s.archetype_key === k)?.normalized_score ?? 0);

    // Map each shadow to candidate archetypes whose growth edge it represents.
    const SHADOW_TO_ARCHETYPES: Record<string, ArchetypeKey[]> = {
      child: ["sovereign", "magician"],
      victim: ["healer", "rebel"],
      prostitute: ["lover", "caregiver"],
      saboteur: ["warrior", "creator"],
    };

    let bestKey: ArchetypeKey | null = null;
    let bestDelta = -Infinity;
    for (const sk of SHADOW_KEYS) {
      const intensity = (Number(shadow[sk] ?? 0) || 0) * 100; // 0..100
      const candidates = SHADOW_TO_ARCHETYPES[sk] ?? [];
      for (const a of candidates) {
        const delta = intensity - lightOf(a);
        if (delta > bestDelta) {
          bestDelta = delta;
          bestKey = a;
        }
      }
    }
    // Only meaningful if shadow actually outweighs the light.
    if (bestDelta <= 0) bestKey = null;

    return { dominantKey: dominant, growthKey: bestKey };
  }, [data]);

  const v4Analysis = useMemo(
    () => (data ? v4PoleAnalysisFromSummary(data) : null),
    [data],
  );

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
          <p className="mb-4">{t("assessment.noResults")}</p>
          <Button onClick={() => navigate("/onboarding/assessment")}>
            {t("assessment.takeAssessment")}
          </Button>
        </Card>
      </div>
    );
  }

  const { analysis, scores, recommendations, session } = data;
  const top: ArchetypeKey[] = (analysis.top_archetypes ?? []) as ArchetypeKey[];

  const confidence = Number(session?.confidence_score ?? 0);
  const lowConfidence = confidence > 0 && confidence < 60;
  const sessionMeta = clientMetaFromRecord(session?.client_meta);
  const consistencyWarning = sessionMeta?.consistency_warning === true
    ? (sessionMeta?.conflicting_pair as string[] | undefined)
    : null;

  const dominantMeta = dominantKey ? archetypeMeta(dominantKey) : null;
  const growthMeta = growthKey ? archetypeMeta(growthKey) : null;

  const previousDate = previousSession?.submitted_at
    ? new Date(previousSession.submitted_at).toLocaleDateString(isFR ? "fr-FR" : "en-US", {
        day: "numeric", month: "short", year: "numeric",
      })
    : null;

  return (
    <div className="min-h-screen max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Button variant="ghost" size="sm" onClick={() => navigate("/?welcome=post_assessment")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> {t("assessment.continueToAegis")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={exporting}
          onClick={async () => {
            try {
              setExporting(true);
              const firstName = user ? userDisplayFirstName(user) : "profil";
              await exportProfileToPdf({
                isFR,
                firstName,
                submittedAt: session?.submitted_at ? new Date(session.submitted_at) : new Date(),
                radarElement: radarRef.current,
                narrative: buildNarrative({
                  isFR,
                  topArchetypes: top,
                  shadowSignals: (analysis.shadow_signals ?? {}) as Record<string, number>,
                }),
                topScores: scores ?? [],
                dominantKey,
                growthKey,
              });
            } catch (e) {
              toast({
                title: t("assessment.exportFailed"),
                description: (e as Error)?.message ?? "",
                variant: "destructive",
              });
            } finally {
              setExporting(false);
            }
          }}
        >
          {exporting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <FileDown className="w-4 h-4 mr-2" />
          )}
          {t("assessment.exportProfile")}
        </Button>
      </div>

      <header className="text-center">
        <Sparkles className="w-8 h-8 text-primary mx-auto mb-2" />
        <h1 className="text-2xl sm:text-3xl font-serif">
            {t("assessment.dominantArchetypes")}
        </h1>
        <p className="text-muted-foreground text-sm mt-2 max-w-2xl mx-auto">
          {isFR ? analysis.summary_fr : analysis.summary_en}
        </p>

        {/* Profile summary badges */}
        {(dominantMeta || growthMeta) && (
          <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
            {dominantMeta && (
              <Badge
                variant="default"
                className="gap-1.5 px-3 py-1 text-xs"
                style={{ background: dominantMeta.color, color: "hsl(var(--background))" }}
              >
                <Crown className="w-3 h-3" />
                <span className="opacity-80">
                  {t("assessment.dominantArchetype")} ·
                </span>
                <strong>{isFR ? dominantMeta.name_fr : dominantMeta.name_en}</strong>
              </Badge>
            )}
            {growthMeta && (
              <Badge variant="outline" className="gap-1.5 px-3 py-1 text-xs border-dashed">
                <TrendingUp className="w-3 h-3" />
                <span className="text-muted-foreground">
                  {t("assessment.growthArchetype")} ·
                </span>
                <strong>{isFR ? growthMeta.name_fr : growthMeta.name_en}</strong>
              </Badge>
            )}
          </div>
        )}
      </header>

      {lowConfidence && (
        <Alert className="border-amber-500/40 bg-amber-500/5">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-sm">
            {t("assessment.partialProfile")}
            <span className="ml-2 text-muted-foreground">
              ({Math.round(confidence)}%)
            </span>
          </AlertDescription>
        </Alert>
      )}

      {consistencyWarning && (
        <TooltipProvider>
          <Alert className="border-primary/30 bg-primary/5">
            <Info className="h-4 w-4 text-primary" />
            <AlertDescription className="text-sm flex items-center gap-2 flex-wrap">
              <span>
                {t("assessment.contradictoryResponses")}
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="cursor-help text-xs">
                    {consistencyWarning.join(" ↔ ")}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  {t("assessment.polarityTooltip")}
                </TooltipContent>
              </Tooltip>
            </AlertDescription>
          </Alert>
        </TooltipProvider>
      )}

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

      {/* V4 triple cartography or legacy radar */}
      <Card className="p-4 sm:p-6 backdrop-blur-3xl bg-card/40 border-border/40">
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <h2 className="font-serif text-lg">
            {v4Analysis ? t("assessment.v4CartographyTitle") : t("assessment.lightShadowMap")}
          </h2>
          {!v4Analysis && previousSession && (
            <div className="flex items-center gap-2">
              <Switch
                id="compare-toggle"
                checked={showPrevious}
                onCheckedChange={setShowPrevious}
              />
              <Label htmlFor="compare-toggle" className="text-xs cursor-pointer">
                {t("assessment.comparePrevious")}
              </Label>
            </div>
          )}
        </div>

        {v4Analysis ? (
          <V4PoleCartographyZones isFR={isFR} analysis={v4Analysis} />
        ) : (
          <div ref={radarRef} className="bg-background/0">
            <DualLayerRadar
              isFR={isFR}
              lightScores={scores ?? []}
              shadowSignals={(analysis.shadow_signals ?? {}) as Record<string, number>}
              previousLightScores={previousScores}
              showPrevious={showPrevious}
            />

            {showPrevious && previousDate && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                {isFR
                  ? `Session actuelle vs ${previousDate}`
                  : `Current session vs ${previousDate}`}
              </p>
            )}
          </div>
        )}
      </Card>

      {/* Narrative profile card */}
      <NarrativeProfileCard
        isFR={isFR}
        topArchetypes={top}
        shadowSignals={(analysis.shadow_signals ?? {}) as Record<string, number>}
      />

      {/* Strengths & Watchouts */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card className="p-5 backdrop-blur-3xl bg-card/40 border-border/40">
          <h3 className="font-serif text-lg mb-2">{t("assessment.strengths")}</h3>
          <ul className="space-y-2 text-sm">
            {(isFR ? analysis.strengths_fr : analysis.strengths_en)?.map((s: string, i: number) => (
              <li key={i}>• {s}</li>
            ))}
          </ul>
        </Card>
        <Card className="p-5 backdrop-blur-3xl bg-card/40 border-border/40">
          <h3 className="font-serif text-lg mb-2">{t("assessment.watchOuts")}</h3>
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
          {t("assessment.recommendedPractices")}
        </h2>
        <div className="space-y-3">
          {recommendations.map((t) => (
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
              {t("assessment.noRecommendation")}
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
