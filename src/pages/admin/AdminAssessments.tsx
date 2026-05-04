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
import { AdminSnapshotHistoryTab } from "@/features/archetype-assessment/components/AdminSnapshotHistoryTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ARCHETYPES } from "@/features/archetype-assessment/domain/archetypes";
import type { ArchetypeKey } from "@/features/archetype-assessment/domain/types";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import type { Locale } from "@/i18n/translations";
import type { TranslationKey } from "@/i18n/translations";

type TFn = (key: TranslationKey, params?: Record<string, string | number>) => string;

const KNOWN_DIMENSION_KEYS = new Set<string>([
  "learning_style",
  "relational_style",
  "activation_style",
  "regulation_need",
  "self_trust",
  "expression_need",
  "structure_need",
]);

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function sessionStatusLabel(status: string | undefined, t: TFn): string {
  const s = (status ?? "").toLowerCase();
  if (s === "submitted") return t("admin.assessments.status.submitted");
  if (s === "draft") return t("admin.assessments.status.draft");
  return status ?? "—";
}

function dimensionAxisLabel(key: string, t: TFn): string {
  if (!KNOWN_DIMENSION_KEYS.has(key)) return key;
  return t(`admin.assessments.dim.${key}.name` as TranslationKey);
}

function archetypeName(
  a: { name_fr: string; name_en: string } | null | undefined,
  locale: Locale
): string {
  if (!a) return "—";
  return locale === "fr" ? a.name_fr : a.name_en;
}

function intensityLabel(value: number, t: TFn): { label: string; tone: "low" | "medium" | "high" } {
  if (value >= 0.6) return { label: t("admin.assessments.intensity.high"), tone: "high" };
  if (value >= 0.3) return { label: t("admin.assessments.intensity.medium"), tone: "medium" };
  return { label: t("admin.assessments.intensity.low"), tone: "low" };
}

function readDimension(key: string, normalized: number, t: TFn): string {
  const pct = Math.round(normalized * 100);
  if (!KNOWN_DIMENSION_KEYS.has(key)) {
    return t("admin.assessments.readDimension.fallback", { key, pct });
  }
  const name = t(`admin.assessments.dim.${key}.name` as TranslationKey);
  const highLine = t(`admin.assessments.dim.${key}.high` as TranslationKey);
  const lowLine = t(`admin.assessments.dim.${key}.low` as TranslationKey);
  if (normalized >= 0.6) return t("admin.assessments.readDimension.high", { name, pct, line: highLine });
  if (normalized <= 0.4) return t("admin.assessments.readDimension.low", { name, pct, line: lowLine });
  return t("admin.assessments.readDimension.balanced", { name, pct });
}

function buildArchetypeInterpretation(
  key: ArchetypeKey,
  normalized: number,
  rank: number,
  t: TFn,
  locale: Locale
): string {
  const a = archetypeMeta(key);
  if (!a) return "";
  const pct = Math.round(normalized * 100);
  const rankLabel = t(
    rank === 1
      ? "admin.assessments.rank.dominant"
      : rank === 2
        ? "admin.assessments.rank.secondary"
        : "admin.assessments.rank.tertiary"
  );
  const desc = locale === "fr" ? a.shortDescription_fr : a.shortDescription_en;
  const light = (locale === "fr" ? a.lightAspect_fr : a.lightAspect_en).toLowerCase();
  const shadow = (locale === "fr" ? a.shadowAspect_fr : a.shadowAspect_en).toLowerCase();
  return t("admin.assessments.interpretation", { rank: rankLabel, pct, desc, light, shadow });
}

function shadowLabel(key: string, t: TFn): string {
  const map: Record<string, TranslationKey> = {
    control: "admin.assessments.shadow.control",
    withdrawal: "admin.assessments.shadow.withdrawal",
    people_pleasing: "admin.assessments.shadow.people_pleasing",
    self_doubt: "admin.assessments.shadow.self_doubt",
    perfectionism: "admin.assessments.shadow.perfectionism",
    avoidance: "admin.assessments.shadow.avoidance",
  };
  const tk = map[key];
  return tk ? t(tk) : key;
}

function initials(name?: string | null, fallback?: string): string {
  const src = (name || fallback || "?").trim();
  const parts = src.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
}

function answerLabel(response: any, question: any, locale: Locale): string {
  if (!question) return "—";
  const opts = question.assessment_options ?? [];
  if (response.numeric_value !== null && response.numeric_value !== undefined) {
    return String(response.numeric_value);
  }
  if (response.text_value) return response.text_value;
  const ids: string[] = response.selected_option_ids ?? [];
  if (ids.length === 0) return "—";
  return ids
    .map((id) => {
      const o = opts.find((x: any) => x.id === id);
      if (!o) return "?";
      return locale === "fr" ? o.label_fr : o.label_en ?? o.label_fr;
    })
    .join(", ");
}

/* -------------------------------------------------------------------------- */
/* List view                                                                  */
/* -------------------------------------------------------------------------- */

export default function AdminAssessments() {
  const { t, locale } = useLanguage();
  const dateLocale = locale === "fr" ? "fr-FR" : "en-US";
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
      <h1 className="text-2xl font-serif">{t("admin.assessments.title")}</h1>
      <Input
        placeholder={t("admin.assessments.filterPlaceholder")}
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
                <th className="text-left p-3">{t("admin.assessments.colStudent")}</th>
                <th className="text-left p-3">{t("admin.assessments.colCompany")}</th>
                <th className="text-left p-3">{t("admin.assessments.colDate")}</th>
                <th className="text-left p-3">{t("admin.assessments.colArchetype")}</th>
                <th className="text-left p-3">{t("admin.assessments.colStatus")}</th>
                <th className="text-left p-3">{t("admin.assessments.colShadow")}</th>
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
                      {s.submitted_at
                        ? new Date(s.submitted_at).toLocaleDateString(dateLocale)
                        : "—"}
                    </td>
                    <td className="p-3">
                      {a ? (
                        <Badge
                          variant="outline"
                          style={{ borderColor: a.color, color: a.color }}
                        >
                          {archetypeName(a, locale)}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="p-3">
                      <Badge variant={s.status === "submitted" ? "default" : "secondary"}>
                        {sessionStatusLabel(s.status, t)}
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
                        <Eye className="w-4 h-4 mr-1" /> {t("admin.assessments.view")}
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
                      {s.submitted_at
                        ? new Date(s.submitted_at).toLocaleDateString(dateLocale)
                        : "—"}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={s.status === "submitted" ? "default" : "secondary"}>
                      {sessionStatusLabel(s.status, t)}
                    </Badge>
                    {a && (
                      <Badge
                        variant="outline"
                        style={{ borderColor: a.color, color: a.color }}
                      >
                        {archetypeName(a, locale)}
                      </Badge>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground">{t("admin.assessments.noSessions")}</p>
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
  const { t, locale } = useLanguage();
  const dateLocale = locale === "fr" ? "fr-FR" : "en-US";
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
      toast({ title: t("admin.assessments.noteSaved") });
    } catch (e: any) {
      toast({ title: t("toast.error"), description: e.message, variant: "destructive" });
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <Button variant="ghost" size="sm" onClick={onBack}>
        <ChevronLeft className="w-4 h-4 mr-1" /> {t("admin.assessments.back")}
      </Button>

      <Tabs defaultValue="analysis" className="space-y-4">
        <TabsList>
          <TabsTrigger value="analysis">{t("admin.assessments.tabAnalysis")}</TabsTrigger>
          <TabsTrigger value="history">{t("admin.assessments.tabHistory")}</TabsTrigger>
        </TabsList>

        <TabsContent value="analysis" className="space-y-4 mt-0">
      {/* Student identity */}
      <Card className="p-4 backdrop-blur-3xl bg-card/40 border-border/40">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-full bg-primary/15 text-primary flex items-center justify-center text-lg font-semibold shrink-0">
            {initials(profile?.display_name, session.user_id)}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm flex-1">
            <div>
              <div className="text-xs uppercase text-muted-foreground">{t("admin.assessments.fieldName")}</div>
              <div className="font-medium">{profile?.display_name ?? "—"}</div>
            </div>
            <div>
              <div className="text-xs uppercase text-muted-foreground">{t("admin.assessments.fieldEmail")}</div>
              <div className="font-mono text-xs truncate">—</div>
            </div>
            <div>
              <div className="text-xs uppercase text-muted-foreground">{t("admin.assessments.fieldCompany")}</div>
              <div>{company?.name ?? "—"}</div>
            </div>
            <div>
              <div className="text-xs uppercase text-muted-foreground">{t("admin.assessments.fieldRole")}</div>
              <div>—</div>
            </div>
            <div>
              <div className="text-xs uppercase text-muted-foreground">{t("admin.assessments.fieldEvalDate")}</div>
              <div>
                {session.submitted_at
                  ? new Date(session.submitted_at).toLocaleString(dateLocale)
                  : "—"}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase text-muted-foreground">{t("admin.assessments.fieldStatus")}</div>
              <Badge variant={session.status === "submitted" ? "default" : "secondary"}>
                {sessionStatusLabel(session.status, t)}
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Double reading — Light & Shadow per archetype */}
      {top.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-serif text-xl">{t("admin.assessments.doubleReadTitle")}</h2>
          {top.map((key) => {
            const a = archetypeMeta(key);
            if (!a) return null;
            const score = scores.find((s: any) => s.archetype_key === key);
            const normalized = score?.normalized_score ?? 0;
            // Shadow intensity: take max relevant shadow signal as proxy
            const maxShadow = Math.max(0, ...Object.values(shadowSignals).map(Number));
            const intensity = intensityLabel(maxShadow, t);
            const lightAspect = locale === "fr" ? a.lightAspect_fr : a.lightAspect_en;
            const shadowAspect = locale === "fr" ? a.shadowAspect_fr : a.shadowAspect_en;
            const coreNeed = locale === "fr" ? a.coreNeed_fr : a.coreNeed_en;
            const fearPattern = locale === "fr" ? a.fearPattern_fr : a.fearPattern_en;
            const shortDesc = locale === "fr" ? a.shortDescription_fr : a.shortDescription_en;
            const displayName = archetypeName(a, locale);
            const archetypeForHint =
              locale === "fr" ? a.name_fr.toLowerCase() : a.name_en.toLowerCase();

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
                  <span className="font-medium">{displayName}</span>
                  <Badge variant="outline">{Math.round(normalized * 100)}%</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2">
                  {/* Lumière */}
                    <div className="p-4 bg-primary/[0.04] md:border-r border-border/40">
                    <div className="flex items-center gap-2 mb-3 text-primary">
                      <Sun className="w-4 h-4" />
                      <span className="font-serif text-sm uppercase tracking-wider">
                        {t("admin.assessments.light")}
                      </span>
                    </div>
                    <p className="text-sm mb-3 text-foreground">{lightAspect}</p>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-xs uppercase text-muted-foreground">
                          {t("admin.assessments.coreNeed")}
                        </span>
                        <p>{coreNeed}</p>
                      </div>
                      <div>
                        <span className="text-xs uppercase text-muted-foreground">
                          {t("admin.assessments.coachingStyle")}
                        </span>
                        <p className="text-muted-foreground">
                          {t("admin.assessments.coachingStyleHint", { archetype: archetypeForHint })}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs uppercase text-muted-foreground">
                          {t("admin.assessments.whatWorks")}
                        </span>
                        <p className="text-muted-foreground">{shortDesc}</p>
                      </div>
                    </div>
                  </div>
                  {/* Ombre */}
                  <div className="p-4 bg-muted/40 dark:bg-background/60">
                    <div className="flex items-center gap-2 mb-3 text-foreground/80">
                      <Moon className="w-4 h-4" />
                      <span className="font-serif text-sm uppercase tracking-wider">
                        {t("admin.assessments.shadowSection")}
                      </span>
                    </div>
                    <p className="text-sm mb-3 text-foreground">{shadowAspect}</p>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-xs uppercase text-muted-foreground">
                          {t("admin.assessments.fearPattern")}
                        </span>
                        <p>{fearPattern}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs uppercase text-muted-foreground">
                          {t("admin.assessments.shadowIntensity")}
                        </span>
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
                        <span className="text-xs uppercase text-muted-foreground">
                          {t("admin.assessments.watchFor")}
                        </span>
                        <p className="text-muted-foreground flex gap-1">
                          <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                          <span>{shadowAspect}</span>
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
      <h2 className="font-serif text-xl pt-2">{t("admin.assessments.rawAndInterp")}</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* LEFT — Raw data */}
        <Card className="p-4 backdrop-blur-3xl bg-card/40 border-border/40 space-y-4">
          <h3 className="font-serif text-base">{t("admin.assessments.rawData")}</h3>

          {/* Responses */}
          <div>
            <h4 className="text-xs uppercase text-muted-foreground mb-2">{t("admin.assessments.responses")}</h4>
            <div className="space-y-2 max-h-64 overflow-auto pr-2">
              {responses.map((r: any) => {
                const q = questions.find((x: any) => x.id === r.question_id);
                const prompt =
                  locale === "fr"
                    ? q?.prompt_fr ?? r.question_id
                    : q?.prompt_en ?? q?.prompt_fr ?? r.question_id;
                return (
                  <div key={r.id} className="text-xs border border-border/40 rounded p-2">
                    <div className="text-muted-foreground">{prompt}</div>
                    <div className="font-medium mt-1">{answerLabel(r, q, locale)}</div>
                  </div>
                );
              })}
              {responses.length === 0 && (
                <p className="text-xs text-muted-foreground">{t("admin.assessments.noResponses")}</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Dimension bars */}
          <div>
            <h4 className="text-xs uppercase text-muted-foreground mb-2">
              {t("admin.assessments.dimensionScores")}
            </h4>
            <div className="space-y-2">
              {Object.entries(dimensionScores).map(([k, v]) => {
                const pct = Math.round(Number(v) * 100);
                return (
                  <div key={k}>
                    <div className="flex justify-between text-xs mb-1">
                      <span>{dimensionAxisLabel(k, t)}</span>
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
              {t("admin.assessments.rawScores12")}
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
                      {archetypeName(a, locale)}
                    </span>
                    <span className="font-mono text-muted-foreground">
                      {t("admin.assessments.scoreLine", {
                        rank: s?.rank ?? "—",
                        raw: s ? Number(s.raw_score).toFixed(1) : "—",
                        pct: s ? Math.round(Number(s.normalized_score) * 100) : "—",
                      })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Shadow signals */}
          <div>
            <h4 className="text-xs uppercase text-muted-foreground mb-2">
              {t("admin.assessments.shadowSignals")}
            </h4>
            <div className="space-y-1 text-xs">
              {Object.entries(shadowSignals).map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span>{shadowLabel(k, t)}</span>
                  <span className="font-mono text-muted-foreground">
                    {Math.round(Number(v) * 100)}% · {intensityLabel(Number(v), t).label}
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
          <h3 className="font-serif text-base">{t("admin.assessments.qualitativeInterp")}</h3>

          {/* Top archetype paragraphs */}
          <div className="space-y-2">
            <h4 className="text-xs uppercase text-muted-foreground">
              {t("admin.assessments.dominantArchetypes")}
            </h4>
            {top.map((key) => {
              const s = scores.find((x: any) => x.archetype_key === key);
              const a = archetypeMeta(key);
              if (!a) return null;
              return (
                <div key={key} className="border-l-2 pl-3" style={{ borderColor: a.color }}>
                  <div className="font-medium text-sm">{archetypeName(a, locale)}</div>
                  <p className="text-sm text-muted-foreground">
                    {buildArchetypeInterpretation(
                      key,
                      s?.normalized_score ?? 0,
                      s?.rank ?? 0,
                      t,
                      locale
                    )}
                  </p>
                </div>
              );
            })}
          </div>

          <Separator />

          {/* Dimensions reading */}
          <div className="space-y-1">
            <h4 className="text-xs uppercase text-muted-foreground">
              {t("admin.assessments.dimensionReading")}
            </h4>
            {Object.entries(dimensionScores).map(([k, v]) => (
              <p key={k} className="text-sm text-muted-foreground">
                • {readDimension(k, Number(v), t)}
              </p>
            ))}
          </div>

          <Separator />

          {/* Recommendations */}
          <div className="space-y-2">
            <h4 className="text-xs uppercase text-muted-foreground">
              {t("admin.assessments.recommendedTools")}
            </h4>
            {recommendations.map((r: any) => (
              <div key={r.id} className="border border-border/40 rounded p-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-xs">{r.tool_type}</Badge>
                  <span className="font-medium text-sm">
                    {locale === "fr" ? r.title_fr : r.title_en ?? r.title_fr}
                  </span>
                  {(locale === "fr" ? r.duration_fr : r.duration_en ?? r.duration_fr) && (
                    <span className="text-xs text-muted-foreground">
                      · {locale === "fr" ? r.duration_fr : r.duration_en ?? r.duration_fr}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {locale === "fr" ? r.rationale_fr : r.rationale_en ?? r.rationale_fr}
                </p>
              </div>
            ))}
            {recommendations.length === 0 && (
              <p className="text-xs text-muted-foreground">{t("admin.assessments.noRecommendations")}</p>
            )}
          </div>

          <Separator />

          {/* Admin note */}
          <div>
            <h4 className="text-xs uppercase text-muted-foreground mb-2">
              {t("admin.assessments.adminNote")}{" "}
              {savingNote && <Loader2 className="inline w-3 h-3 animate-spin ml-1" />}
            </h4>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onBlur={handleNoteBlur}
              placeholder={t("admin.assessments.coachNotesPlaceholder")}
              rows={5}
              className="text-sm"
            />
          </div>
          </Card>
        </div>
        </TabsContent>

        <TabsContent value="history" className="mt-0">
          <AdminSnapshotHistoryTab userId={session.user_id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
