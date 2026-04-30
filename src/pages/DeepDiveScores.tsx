import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles, AlertTriangle, Loader2, RotateCcw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { type DeepDiveResult } from "@/features/archetype-deepdive-v2/domain/computeDeepDiveScores";
import { loadUnifiedDeepDiveResult } from "@/features/archetype-deepdive-v2/domain/loadUnifiedScores";
import { archLabel } from "@/features/archetype-deepdive-v2/domain/narrativeContent";

export default function DeepDiveScores() {
  const { user } = useAuth();
  const { t, locale } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<DeepDiveResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("deepdive_responses" as any)
        .select("question_code, option_codes")
        .eq("user_id", user.id);
      if (cancelled) return;
      if (error) {
        setError(error.message);
      } else {
        const raw = ((data ?? []) as unknown) as RawAnswer[];
        setResult(computeDeepDiveScores(raw));
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-primary" size={28} />
      </div>
    );
  }

  if (error) {
    return <p className="text-accent-danger text-sm">{error}</p>;
  }

  if (!result || result.answeredCount === 0) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <h1 className="text-neural-title text-2xl">
          {locale === "fr" ? "Aucun score à afficher" : "No scores yet"}
        </h1>
        <p className="text-text-secondary text-sm">
          {locale === "fr"
            ? "Réponds au questionnaire approfondi (70 questions) pour voir tes scores."
            : "Answer the deep questionnaire (70 questions) to see your scores."}
        </p>
        <Link
          to="/profile"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary/10 border border-primary/30 text-primary text-sm hover:bg-primary/20 transition-colors"
        >
          <Sparkles size={16} /> {locale === "fr" ? "Aller au questionnaire" : "Go to questionnaire"}
        </Link>
      </div>
    );
  }

  const top12 = result.archetypes.slice(0, 12);

  return (
    <div className="max-w-5xl mx-auto py-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <Link
            to="/profile"
            className="inline-flex items-center gap-1.5 text-xs text-text-tertiary hover:text-text-secondary transition-colors mb-2"
          >
            <ArrowLeft size={12} /> {locale === "fr" ? "Retour profil" : "Back to profile"}
          </Link>
          <h1 className="text-neural-title text-2xl md:text-3xl">
            {locale === "fr" ? "Mes scores Deep Dive" : "My Deep Dive scores"}
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            {locale === "fr"
              ? `${result.answeredCount} / ${result.totalQuestions} questions répondues (${Math.round(result.completionPct)}%)`
              : `${result.answeredCount} / ${result.totalQuestions} questions answered (${Math.round(result.completionPct)}%)`}
          </p>
        </div>
        <Link
          to="/profile"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-bg-elevated border border-border-subtle text-text-secondary text-xs hover:text-text-primary transition-colors"
        >
          <RotateCcw size={14} />
          {locale === "fr" ? "Reprendre / modifier" : "Resume / edit"}
        </Link>
      </div>

      {/* Top 3 */}
      <section>
        <h2 className="text-neural-label mb-3">{locale === "fr" ? "Top 3 archétypes" : "Top 3 archetypes"}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {result.topThree.map((arch, i) => {
            const score = result.archetypes.find((a) => a.archetype === arch)!;
            return (
              <motion.div
                key={arch}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="rounded-2xl border border-primary/20 bg-bg-surface/40 backdrop-blur-xl p-5"
              >
                <p className="text-[10px] uppercase tracking-[0.2em] text-text-tertiary">#{i + 1}</p>
                <p className="text-foreground text-xl font-medium mt-1">{archLabel(arch, locale)}</p>
                <div className="mt-3 space-y-1.5">
                  <Bar label="Light" value={score.light} max={Math.max(score.total, 1)} color="bg-primary/70" />
                  <Bar label="Shadow" value={score.shadow} max={Math.max(score.total, 1)} color="bg-accent-danger/60" />
                </div>
                <p className="text-xs text-text-tertiary mt-3">
                  {locale === "fr" ? "Intensité" : "Intensity"} :{" "}
                  <span className="text-foreground">{Math.round(score.intensity * 100)}%</span>
                </p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Shadow alerts */}
      {result.shadowAlerts.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={14} className="text-accent-warning" />
            <h2 className="text-neural-label">{locale === "fr" ? "Zones d'ombre actives" : "Active shadow zones"}</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {result.shadowAlerts.map((arch) => (
              <span
                key={arch}
                className="px-3 py-1.5 rounded-full text-xs bg-accent-warning/10 border border-accent-warning/30 text-accent-warning"
              >
                {archLabel(arch, locale)}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Full ranking */}
      <section>
        <h2 className="text-neural-label mb-3">{locale === "fr" ? "Classement complet" : "Full ranking"}</h2>
        <div className="overflow-x-auto rounded-2xl border border-border-subtle bg-bg-surface/40">
          <table className="w-full text-sm">
            <thead className="text-text-tertiary text-[10px] uppercase tracking-[0.18em]">
              <tr className="border-b border-border-subtle">
                <th className="text-left p-3">#</th>
                <th className="text-left p-3">{locale === "fr" ? "Archétype" : "Archetype"}</th>
                <th className="text-right p-3">Light</th>
                <th className="text-right p-3">Shadow</th>
                <th className="text-right p-3">{locale === "fr" ? "Net" : "Net"}</th>
                <th className="text-right p-3">{locale === "fr" ? "Intensité" : "Intensity"}</th>
              </tr>
            </thead>
            <tbody>
              {top12.map((a, i) => (
                <tr key={a.archetype} className="border-b border-border-subtle/40 last:border-b-0">
                  <td className="p-3 text-text-tertiary">{i + 1}</td>
                  <td className="p-3 text-foreground">{archLabel(a.archetype, locale)}</td>
                  <td className="p-3 text-right text-primary/80">{a.light.toFixed(1)}</td>
                  <td className="p-3 text-right text-accent-danger/80">{a.shadow.toFixed(1)}</td>
                  <td
                    className={`p-3 text-right ${a.net >= 0 ? "text-primary" : "text-accent-warning"}`}
                  >
                    {a.net >= 0 ? "+" : ""}
                    {a.net.toFixed(1)}
                  </td>
                  <td className="p-3 text-right text-text-secondary">{Math.round(a.intensity * 100)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Houses */}
      <section>
        <h2 className="text-neural-label mb-3">
          {locale === "fr" ? "Par maison (Caroline Myss)" : "Per house (Caroline Myss)"}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {result.houses.map((h) => (
            <div
              key={h.house}
              className="rounded-xl border border-border-subtle bg-bg-surface/40 p-4"
            >
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-foreground text-sm">
                  <span className="text-text-tertiary text-xs mr-1">M{h.house}</span>
                  {locale === "fr" ? h.label_fr : h.label_en}
                </p>
                <span className="text-[10px] text-text-tertiary">
                  {h.answered}/{h.total}
                </span>
              </div>
              {h.topArchetype ? (
                <p className="text-xs text-primary mt-2">
                  → {archLabel(h.topArchetype, locale)}{" "}
                  <span className="text-text-tertiary">({h.topArchetypeWeight.toFixed(1)})</span>
                </p>
              ) : (
                <p className="text-xs text-text-tertiary mt-2">
                  {locale === "fr" ? "—" : "—"}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-[10px] uppercase tracking-[0.15em] text-text-tertiary mb-0.5">
        <span>{label}</span>
        <span>{value.toFixed(1)}</span>
      </div>
      <div className="h-1.5 bg-bg-elevated rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
