import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ChevronLeft, Sun, Moon, Eye, AlertTriangle } from "lucide-react";
import {
  listAllSessionsForAdmin,
  getSessionFullDetails,
  archetypeMeta,
  saveAdminNote,
} from "@/features/archetype-assessment/services/assessmentService";
import { ARCHETYPES } from "@/features/archetype-assessment/domain/archetypes";
import type { ArchetypeKey, DimensionKey } from "@/features/archetype-assessment/domain/types";
import { useToast } from "@/hooks/use-toast";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const DIMENSION_LABELS_FR: Record<DimensionKey, { name: string; high: string; low: string }> = {
  learning_style: {
    name: "Style d'apprentissage",
    high: "préfère l'expérimentation guidée et les itérations rapides",
    low: "préfère intégrer la théorie avant d'agir",
  },
  relational_style: {
    name: "Style relationnel",
    high: "puise son énergie dans le collectif et les échanges",
    low: "a besoin de solitude pour se ressourcer",
  },
  activation_style: {
    name: "Style d'activation",
    high: "passe à l'action rapidement, parfois avant d'être prêt",
    low: "prend le temps de mûrir avant d'agir",
  },
  regulation_need: {
    name: "Besoin de régulation",
    high: "a besoin de pratiques régulières pour apaiser le système nerveux",
    low: "régule naturellement son énergie",
  },
  self_trust: {
    name: "Confiance en soi",
    high: "s'appuie solidement sur son jugement intérieur",
    low: "tend à douter et chercher validation externe",
  },
  expression_need: {
    name: "Besoin d'expression",
    high: "doit créer et exprimer pour exister pleinement",
    low: "exprime peu mais avec intention",
  },
  structure_need: {
    name: "Besoin de structure",
    high: "bénéficie de cadres clairs et de plans étape par étape",
    low: "préfère la fluidité et l'adaptation au moment",
  },
};

const SHADOW_LABELS_FR: Record<string, string> = {
  control: "Contrôle",
  withdrawal: "Retrait",
  people_pleasing: "Plaire à tout prix",
  self_doubt: "Doute de soi",
  perfectionism: "Perfectionnisme",
  avoidance: "Évitement",
};

function intensityLabel(value: number): { label: string; tone: "low" | "medium" | "high" } {
  if (value >= 0.6) return { label: "élevée", tone: "high" };
  if (value >= 0.3) return { label: "moyenne", tone: "medium" };
  return { label: "faible", tone: "low" };
}

function readDimension(key: DimensionKey, normalized: number): string {
  const def = DIMENSION_LABELS_FR[key];
  if (!def) return `${key}: ${Math.round(normalized * 100)}%`;
  const pct = Math.round(normalized * 100);
  if (normalized >= 0.6) return `${def.name} : ${pct}% — ${def.high}.`;
  if (normalized <= 0.4) return `${def.name} : ${pct}% — ${def.low}.`;
  return `${def.name} : ${pct}% — équilibré.`;
}

function buildArchetypeInterpretation(
  key: ArchetypeKey,
  normalized: number,
  rank: number
): string {
  const a = archetypeMeta(key);
  if (!a) return "";
  const pct = Math.round(normalized * 100);
  const rankLabel = rank === 1 ? "dominant" : rank === 2 ? "secondaire" : "tertiaire";
  return `Archétype ${rankLabel} (${pct}%). ${a.shortDescription_fr} En lumière : ${a.lightAspect_fr.toLowerCase()} À surveiller : ${a.shadowAspect_fr.toLowerCase()}`;
}

function initials(name?: string | null, fallback?: string): string {
  const src = (name || fallback || "?").trim();
  const parts = src.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
}

function answerLabel(response: any, question: any): string {
  if (!question) return "—";
  const opts = question.assessment_options ?? [];
  if (response.numeric_value !== null && response.numeric_value !== undefined) {
    return String(response.numeric_value);
  }
  if (response.text_value) return response.text_value;
  const ids: string[] = response.selected_option_ids ?? [];
  if (ids.length === 0) return "—";
  return ids
    .map((id) => opts.find((o: any) => o.id === id)?.label_fr ?? "?")
    .join(", ");
}

/* -------------------------------------------------------------------------- */
/* List view                                                                  */
/* -------------------------------------------------------------------------- */

export default function AdminAssessments() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [details, setDetails] = useState<any | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    listAllSessionsForAdmin()
      .then(setSessions)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selected) {
      setDetails(null);
      return;
    }
    setDetailsLoading(true);
    getSessionFullDetails(selected)
      .then(setDetails)
      .finally(() => setDetailsLoading(false));
  }, [selected]);

  const filtered = useMemo(() => {
    if (!filter.trim()) return sessions;
    const q = filter.toLowerCase();
    return sessions.filter((s) =>
      (s.profile?.display_name ?? "").toLowerCase().includes(q) ||
      (s.company?.name ?? "").toLowerCase().includes(q) ||
      (s.user_id ?? "").toLowerCase().includes(q) ||
      (s.id ?? "").toLowerCase().includes(q)
    );
  }, [sessions, filter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (selected && details) {
    return (
      <AssessmentDetail
        details={details}
        loading={detailsLoading}
        onBack={() => setSelected(null)}
      />
    );
  }

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <h1 className="text-2xl font-serif">Évaluations Archétypes</h1>
      <Input
        placeholder="Filtrer par nom, entreprise, id…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="max-w-md"
      />

      <Card className="p-0 overflow-hidden backdrop-blur-3xl bg-card/40 border-border/40">
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left p-3">Étudiant</th>
                <th className="text-left p-3">Entreprise</th>
                <th className="text-left p-3">Date</th>
                <th className="text-left p-3">Archétype</th>
                <th className="text-left p-3">Statut</th>
                <th className="text-left p-3">Ombre</th>
                <th className="text-right p-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filtered.map((s) => {
                const a = s.top_archetype ? archetypeMeta(s.top_archetype) : null;
                const shadowOver = (s.shadow_count ?? 0) > 2;
                return (
                  <tr key={s.id} className="hover:bg-accent/20 transition">
                    <td className="p-3">
                      <div className="font-medium">{s.profile?.display_name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground font-mono truncate max-w-[14rem]">
                        {s.user_id}
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground">{s.company?.name ?? "—"}</td>
                    <td className="p-3 text-muted-foreground">
                      {s.submitted_at ? new Date(s.submitted_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="p-3">
                      {a ? (
                        <Badge
                          variant="outline"
                          style={{ borderColor: a.color, color: a.color }}
                        >
                          {a.name_fr}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="p-3">
                      <Badge variant={s.status === "submitted" ? "default" : "secondary"}>
                        {s.status}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <span
                        className={`text-sm font-mono ${
                          shadowOver ? "text-destructive font-bold" : "text-muted-foreground"
                        }`}
                      >
                        {s.shadow_count ?? 0}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <Button size="sm" variant="ghost" onClick={() => setSelected(s.id)}>
                        <Eye className="w-4 h-4 mr-1" /> Voir
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-border/40">
          {filtered.map((s) => {
            const a = s.top_archetype ? archetypeMeta(s.top_archetype) : null;
            return (
              <button
                key={s.id}
                onClick={() => setSelected(s.id)}
                className="w-full text-left p-4 hover:bg-accent/20 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{s.profile?.display_name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {s.company?.name ?? "—"}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {s.submitted_at ? new Date(s.submitted_at).toLocaleDateString() : "—"}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={s.status === "submitted" ? "default" : "secondary"}>
                      {s.status}
                    </Badge>
                    {a && (
                      <Badge
                        variant="outline"
                        style={{ borderColor: a.color, color: a.color }}
                      >
                        {a.name_fr}
                      </Badge>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground">Aucune session.</p>
        )}
      </Card>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Detail view                                                                */
/* -------------------------------------------------------------------------- */

function AssessmentDetail({
  details,
  loading,
  onBack,
}: {
  details: any;
  loading: boolean;
  onBack: () => void;
}) {
  const { toast } = useToast();
  const { session, analysis, scores, recommendations, responses, questions, profile, company } = details;
  const [note, setNote] = useState<string>(analysis?.admin_notes ?? "");
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    setNote(analysis?.admin_notes ?? "");
  }, [analysis?.admin_notes]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const top: ArchetypeKey[] = analysis?.top_archetypes ?? [];
  const dimensionScores: Record<string, number> = analysis?.dimension_scores ?? {};
  const shadowSignals: Record<string, number> = analysis?.shadow_signals ?? {};

  const handleNoteBlur = async () => {
    if (note === (analysis?.admin_notes ?? "")) return;
    setSavingNote(true);
    try {
      await saveAdminNote(session.id, note);
      toast({ title: "Note enregistrée" });
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <Button variant="ghost" size="sm" onClick={onBack}>
        <ChevronLeft className="w-4 h-4 mr-1" /> Retour
      </Button>

      {/* Student identity */}
      <Card className="p-4 backdrop-blur-3xl bg-card/40 border-border/40">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-full bg-primary/15 text-primary flex items-center justify-center text-lg font-semibold shrink-0">
            {initials(profile?.display_name, session.user_id)}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm flex-1">
            <div>
              <div className="text-xs uppercase text-muted-foreground">Nom</div>
              <div className="font-medium">{profile?.display_name ?? "—"}</div>
            </div>
            <div>
              <div className="text-xs uppercase text-muted-foreground">Email</div>
              <div className="font-mono text-xs truncate">—</div>
            </div>
            <div>
              <div className="text-xs uppercase text-muted-foreground">Entreprise</div>
              <div>{company?.name ?? "—"}</div>
            </div>
            <div>
              <div className="text-xs uppercase text-muted-foreground">Rôle</div>
              <div>—</div>
            </div>
            <div>
              <div className="text-xs uppercase text-muted-foreground">Date d'évaluation</div>
              <div>
                {session.submitted_at ? new Date(session.submitted_at).toLocaleString() : "—"}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase text-muted-foreground">Statut</div>
              <Badge variant={session.status === "submitted" ? "default" : "secondary"}>
                {session.status}
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Double reading — Light & Shadow per archetype */}
      {top.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-serif text-xl">Double lecture des archétypes dominants</h2>
          {top.map((key) => {
            const a = archetypeMeta(key);
            if (!a) return null;
            const score = scores.find((s: any) => s.archetype_key === key);
            const normalized = score?.normalized_score ?? 0;
            // Shadow intensity: take max relevant shadow signal as proxy
            const maxShadow = Math.max(0, ...Object.values(shadowSignals).map(Number));
            const intensity = intensityLabel(maxShadow);

            return (
              <Card
                key={key}
                className="overflow-hidden backdrop-blur-3xl bg-card/40 border-border/40"
              >
                <div className="p-4 flex items-center gap-3 border-b border-border/40">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ background: a.color }}
                  />
                  <span className="font-medium">{a.name_fr}</span>
                  <Badge variant="outline">{Math.round(normalized * 100)}%</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2">
                  {/* Lumière */}
                  <div className="p-4 bg-amber-500/5 dark:bg-amber-500/[0.03] md:border-r border-border/40">
                    <div className="flex items-center gap-2 mb-3 text-amber-600 dark:text-amber-400">
                      <Sun className="w-4 h-4" />
                      <span className="font-serif text-sm uppercase tracking-wider">Lumière</span>
                    </div>
                    <p className="text-sm mb-3">{a.lightAspect_fr}</p>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-xs uppercase text-muted-foreground">Besoin essentiel</span>
                        <p>{a.coreNeed_fr}</p>
                      </div>
                      <div>
                        <span className="text-xs uppercase text-muted-foreground">Style de coaching</span>
                        <p className="text-muted-foreground">
                          Valoriser ses forces, lui donner de l'espace pour incarner {a.name_fr.toLowerCase()}.
                        </p>
                      </div>
                      <div>
                        <span className="text-xs uppercase text-muted-foreground">Ce qui marche</span>
                        <p className="text-muted-foreground">
                          {a.shortDescription_fr}
                        </p>
                      </div>
                    </div>
                  </div>
                  {/* Ombre */}
                  <div className="p-4 bg-slate-900/30 dark:bg-slate-950/40">
                    <div className="flex items-center gap-2 mb-3 text-indigo-300 dark:text-indigo-300">
                      <Moon className="w-4 h-4" />
                      <span className="font-serif text-sm uppercase tracking-wider">Ombre</span>
                    </div>
                    <p className="text-sm mb-3">{a.shadowAspect_fr}</p>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-xs uppercase text-muted-foreground">Pattern de peur</span>
                        <p>{a.fearPattern_fr}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs uppercase text-muted-foreground">Intensité ombre</span>
                        <Badge
                          variant={
                            intensity.tone === "high"
                              ? "destructive"
                              : intensity.tone === "medium"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {intensity.label}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-xs uppercase text-muted-foreground">À surveiller</span>
                        <p className="text-muted-foreground flex gap-1">
                          <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                          <span>{a.shadowAspect_fr}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Raw data + Interpretation */}
      <h2 className="font-serif text-xl pt-2">Données brutes et interprétation</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* LEFT — Raw data */}
        <Card className="p-4 backdrop-blur-3xl bg-card/40 border-border/40 space-y-4">
          <h3 className="font-serif text-base">Données brutes</h3>

          {/* Responses */}
          <div>
            <h4 className="text-xs uppercase text-muted-foreground mb-2">Réponses</h4>
            <div className="space-y-2 max-h-64 overflow-auto pr-2">
              {responses.map((r: any) => {
                const q = questions.find((x: any) => x.id === r.question_id);
                return (
                  <div key={r.id} className="text-xs border border-border/40 rounded p-2">
                    <div className="text-muted-foreground">{q?.prompt_fr ?? r.question_id}</div>
                    <div className="font-medium mt-1">{answerLabel(r, q)}</div>
                  </div>
                );
              })}
              {responses.length === 0 && (
                <p className="text-xs text-muted-foreground">Aucune réponse.</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Dimension bars */}
          <div>
            <h4 className="text-xs uppercase text-muted-foreground mb-2">Scores par dimension</h4>
            <div className="space-y-2">
              {Object.entries(dimensionScores).map(([k, v]) => {
                const pct = Math.round(Number(v) * 100);
                return (
                  <div key={k}>
                    <div className="flex justify-between text-xs mb-1">
                      <span>{DIMENSION_LABELS_FR[k as DimensionKey]?.name ?? k}</span>
                      <span className="font-mono">{pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* All 12 archetype scores */}
          <div>
            <h4 className="text-xs uppercase text-muted-foreground mb-2">
              Scores bruts (12 archétypes)
            </h4>
            <div className="space-y-1 text-xs">
              {ARCHETYPES.map((a) => {
                const s = scores.find((x: any) => x.archetype_key === a.key);
                return (
                  <div
                    key={a.key}
                    className="flex justify-between border-b border-border/20 py-1"
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ background: a.color }}
                      />
                      {a.name_fr}
                    </span>
                    <span className="font-mono text-muted-foreground">
                      #{s?.rank ?? "—"} · brut {s ? Number(s.raw_score).toFixed(1) : "—"} ·{" "}
                      {s ? Math.round(Number(s.normalized_score) * 100) : "—"}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Shadow signals */}
          <div>
            <h4 className="text-xs uppercase text-muted-foreground mb-2">Signaux d'ombre</h4>
            <div className="space-y-1 text-xs">
              {Object.entries(shadowSignals).map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span>{SHADOW_LABELS_FR[k] ?? k}</span>
                  <span className="font-mono text-muted-foreground">
                    {Math.round(Number(v) * 100)}% · {intensityLabel(Number(v)).label}
                  </span>
                </div>
              ))}
              {Object.keys(shadowSignals).length === 0 && (
                <p className="text-xs text-muted-foreground">—</p>
              )}
            </div>
          </div>
        </Card>

        {/* RIGHT — Interpretation */}
        <Card className="p-4 backdrop-blur-3xl bg-card/40 border-border/40 space-y-4">
          <h3 className="font-serif text-base">Interprétation qualitative</h3>

          {/* Top archetype paragraphs */}
          <div className="space-y-2">
            <h4 className="text-xs uppercase text-muted-foreground">Archétypes dominants</h4>
            {top.map((key) => {
              const s = scores.find((x: any) => x.archetype_key === key);
              const a = archetypeMeta(key);
              if (!a) return null;
              return (
                <div key={key} className="border-l-2 pl-3" style={{ borderColor: a.color }}>
                  <div className="font-medium text-sm">{a.name_fr}</div>
                  <p className="text-sm text-muted-foreground">
                    {buildArchetypeInterpretation(
                      key,
                      s?.normalized_score ?? 0,
                      s?.rank ?? 0
                    )}
                  </p>
                </div>
              );
            })}
          </div>

          <Separator />

          {/* Dimensions reading */}
          <div className="space-y-1">
            <h4 className="text-xs uppercase text-muted-foreground">Lecture des dimensions</h4>
            {Object.entries(dimensionScores).map(([k, v]) => (
              <p key={k} className="text-sm text-muted-foreground">
                • {readDimension(k as DimensionKey, Number(v))}
              </p>
            ))}
          </div>

          <Separator />

          {/* Recommendations */}
          <div className="space-y-2">
            <h4 className="text-xs uppercase text-muted-foreground">Outils recommandés</h4>
            {recommendations.map((r: any) => (
              <div key={r.id} className="border border-border/40 rounded p-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-xs">{r.tool_type}</Badge>
                  <span className="font-medium text-sm">{r.title_fr}</span>
                  {r.duration_fr && (
                    <span className="text-xs text-muted-foreground">· {r.duration_fr}</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{r.rationale_fr}</p>
              </div>
            ))}
            {recommendations.length === 0 && (
              <p className="text-xs text-muted-foreground">Aucune recommandation.</p>
            )}
          </div>

          <Separator />

          {/* Admin note */}
          <div>
            <h4 className="text-xs uppercase text-muted-foreground mb-2">
              Note admin {savingNote && <Loader2 className="inline w-3 h-3 animate-spin ml-1" />}
            </h4>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onBlur={handleNoteBlur}
              placeholder="Observations, prochaines étapes, contexte coaching…"
              rows={5}
              className="text-sm"
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
