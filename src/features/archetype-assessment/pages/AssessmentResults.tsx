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
  getSessionFullDetails,
  getPreviousSubmittedSessionForUser,
  getSessionArchetypeScores,
} from "../services/assessmentService";
import { exportProfileToPdf } from "../services/exportProfilePdf";
import type { ArchetypeKey } from "../domain/types";
import { DualLayerRadar } from "../components/DualLayerRadar";
import { NarrativeProfileCard, buildNarrative } from "../components/NarrativeProfileCard";

const SHADOW_KEYS = ["control", "victim", "prostitute", "saboteur"] as const;

export default function AssessmentResults() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { locale } = useLanguage();
  const isFR = locale === "fr";

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Awaited<ReturnType<typeof getSessionFullDetails>> | null>(null);
  const [previousSession, setPreviousSession] = useState<any | null>(null);
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
        const details = await getSessionFullDetails(session.id);
        if (!alive) return;
        setData(details);

        // Look up previous session for comparison.
        const prev = await getPreviousSubmittedSessionForUser(user.id, session.id);
        if (!alive) return;
        if (prev) {
          setPreviousSession(prev);
          const prevScores = await getSessionArchetypeScores(prev.id);
          if (alive) setPreviousScores(prevScores);
        }
        setLoading(false);
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
    const shadow = (data.analysis as any).shadow_signals ?? {};
    const lightOf = (k: string) =>
      Number(scores.find((s) => s.archetype_key === k)?.normalized_score ?? 0);

    // Map each shadow to candidate archetypes whose growth edge it represents.
    const SHADOW_TO_ARCHETYPES: Record<string, ArchetypeKey[]> = {
      control: ["sovereign", "magician"],
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

  const { analysis, scores, recommendations, session } = data;
  const top: ArchetypeKey[] = analysis.top_archetypes ?? [];

  const confidence = Number(session?.confidence_score ?? 0);
  const lowConfidence = confidence > 0 && confidence < 60;
  const sessionMeta = (session?.client_meta ?? {}) as Record<string, any>;
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
        <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> {isFR ? "Tableau de bord" : "Dashboard"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={exporting}
          onClick={async () => {
            try {
              setExporting(true);
              const firstName =
                (user?.user_metadata as any)?.first_name ||
                (user?.user_metadata as any)?.full_name?.split(" ")?.[0] ||
                user?.email?.split("@")?.[0] ||
                "profil";
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
                title: isFR ? "Export impossible" : "Export failed",
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
          {isFR ? "Exporter mon profil" : "Export my profile"}
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
                  {isFR ? "Archétype dominant" : "Dominant archetype"} ·
                </span>
                <strong>{isFR ? dominantMeta.name_fr : dominantMeta.name_en}</strong>
              </Badge>
            )}
            {growthMeta && (
              <Badge variant="outline" className="gap-1.5 px-3 py-1 text-xs border-dashed">
                <TrendingUp className="w-3 h-3" />
                <span className="text-muted-foreground">
                  {isFR ? "Archétype de croissance" : "Growth archetype"} ·
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
            {isFR
              ? "Ton profil est partiel. Réponds à plus de questions pour affiner tes archétypes."
              : "Your profile is partial. Answer more questions to refine your archetypes."}
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
                {isFR
                  ? "Certaines réponses semblent contradictoires — explore cette tension, elle est souvent révélatrice."
                  : "Some responses seem contradictory — explore this tension, it is often revealing."}
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="cursor-help text-xs">
                    {consistencyWarning.join(" ↔ ")}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  {isFR
                    ? "Polarité détectée entre ces deux signaux."
                    : "Polarity detected between these two signals."}
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

      {/* Dual-layer Radar */}
      <Card className="p-4 sm:p-6 backdrop-blur-3xl bg-card/40 border-border/40">
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <h2 className="font-serif text-lg">
            {isFR ? "Cartographie lumière & ombre" : "Light & shadow map"}
          </h2>
          {previousSession && (
            <div className="flex items-center gap-2">
              <Switch
                id="compare-toggle"
                checked={showPrevious}
                onCheckedChange={setShowPrevious}
              />
              <Label htmlFor="compare-toggle" className="text-xs cursor-pointer">
                {isFR ? "Comparer à la session précédente" : "Compare with previous session"}
              </Label>
            </div>
          )}
        </div>

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
