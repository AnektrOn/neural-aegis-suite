import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, ChevronLeft } from "lucide-react";
import {
  listAllSessionsForAdmin,
  getSessionFullDetails,
  archetypeMeta,
} from "@/features/archetype-assessment/services/assessmentService";

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
        placeholder="Filtrer par user_id ou session_id…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="max-w-md"
      />
      <Card className="p-0 overflow-hidden backdrop-blur-3xl bg-card/40 border-border/40">
        <div className="divide-y divide-border/40">
          {filtered.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelected(s.id)}
              className="w-full text-left p-4 hover:bg-accent/20 transition flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="text-sm font-mono truncate">{s.user_id}</div>
                <div className="text-xs text-muted-foreground">
                  {s.submitted_at ? new Date(s.submitted_at).toLocaleString() : "—"}
                </div>
              </div>
              <Badge variant={s.status === "submitted" ? "default" : "secondary"}>
                {s.status}
              </Badge>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground">Aucune session.</p>
          )}
        </div>
      </Card>
    </div>
  );
}

function AssessmentDetail({
  details,
  loading,
  onBack,
}: {
  details: any;
  loading: boolean;
  onBack: () => void;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }
  const { session, analysis, scores, recommendations, responses } = details;
  return (
    <div className="space-y-4 p-4 sm:p-6">
      <Button variant="ghost" size="sm" onClick={onBack}>
        <ChevronLeft className="w-4 h-4 mr-1" /> Retour
      </Button>

      <Card className="p-4 backdrop-blur-3xl bg-card/40 border-border/40">
        <h2 className="font-serif text-xl mb-2">Session</h2>
        <div className="text-xs font-mono text-muted-foreground">{session.id}</div>
        <div className="text-sm mt-1">User : <span className="font-mono">{session.user_id}</span></div>
        <div className="text-sm">Statut : {session.status}</div>
        <div className="text-sm">
          Soumis : {session.submitted_at ? new Date(session.submitted_at).toLocaleString() : "—"}
        </div>
        <div className="text-sm">Durée : {session.duration_seconds ?? 0}s</div>
        <div className="text-sm">Réponses enregistrées : {responses?.length ?? 0}</div>
      </Card>

      {analysis && (
        <Card className="p-4 backdrop-blur-3xl bg-card/40 border-border/40">
          <h2 className="font-serif text-xl mb-2">Analyse</h2>
          <p className="text-sm mb-3">{analysis.summary_fr}</p>
          <h3 className="font-medium mt-3 mb-1">Top archétypes</h3>
          <div className="flex gap-2 flex-wrap">
            {(analysis.top_archetypes ?? []).map((k: string) => {
              const a = archetypeMeta(k as any);
              return (
                <Badge key={k} variant="secondary">
                  {a?.name_fr ?? k}
                </Badge>
              );
            })}
          </div>

          <h3 className="font-medium mt-4 mb-1">Dimensions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {Object.entries(analysis.dimension_scores ?? {}).map(([k, v]: any) => (
              <div key={k} className="p-2 rounded border border-border/40">
                <div className="text-muted-foreground">{k}</div>
                <div className="font-mono">{Math.round(Number(v) * 100)}%</div>
              </div>
            ))}
          </div>

          <h3 className="font-medium mt-4 mb-1">Signaux d'ombre</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            {Object.entries(analysis.shadow_signals ?? {}).map(([k, v]: any) => (
              <div key={k} className="p-2 rounded border border-border/40">
                <div className="text-muted-foreground">{k}</div>
                <div className="font-mono">{Math.round(Number(v) * 100)}%</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="p-4 backdrop-blur-3xl bg-card/40 border-border/40">
        <h2 className="font-serif text-xl mb-2">Scores complets</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
          {scores.map((s: any) => {
            const a = archetypeMeta(s.archetype_key);
            return (
              <div key={s.id} className="p-2 rounded border border-border/40">
                <div className="font-medium">{a?.name_fr ?? s.archetype_key}</div>
                <div className="text-muted-foreground">
                  rang #{s.rank} · brut {Number(s.raw_score).toFixed(1)} · norm {Math.round(Number(s.normalized_score) * 100)}%
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-4 backdrop-blur-3xl bg-card/40 border-border/40">
        <h2 className="font-serif text-xl mb-2">Recommandations</h2>
        <div className="space-y-2">
          {recommendations.map((r: any) => (
            <div key={r.id} className="p-3 rounded border border-border/40">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="text-xs">{r.tool_type}</Badge>
                <span className="font-medium">{r.title_fr}</span>
                {r.duration_fr && <span className="text-xs text-muted-foreground">· {r.duration_fr}</span>}
                {r.rule_key && <Badge variant="outline" className="text-xs">{r.rule_key}</Badge>}
              </div>
              <p className="text-sm text-muted-foreground mt-1">{r.rationale_fr}</p>
            </div>
          ))}
          {recommendations.length === 0 && <p className="text-sm text-muted-foreground">—</p>}
        </div>
      </Card>
    </div>
  );
}
