import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAdmin } from "@/hooks/use-admin";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles, AlertTriangle, Loader2, RotateCcw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { type DeepDiveResult } from "@/features/archetype-deepdive-v2/domain/computeDeepDiveScores";
import { loadUnifiedDeepDiveResult } from "@/features/archetype-deepdive-v2/domain/loadUnifiedScores";
import { archLabel } from "@/features/archetype-deepdive-v2/domain/narrativeContent";
import { MemberPageScaffold } from "@/layouts/MemberPageScaffold";

export default function DeepDiveScores() {
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const { t, locale } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<DeepDiveResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const r = await loadUnifiedDeepDiveResult(user.id);
        if (!cancelled) setResult(r);
      } catch (e: any) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!isAdmin) {
    return <Navigate to="/deep-dive" replace />;
  }

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
      <div className="max-w-2xl mx-auto px-3 sm:px-5 py-16 text-center space-y-4">
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
    <MemberPageScaffold width="wide" className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <Link
            to="/profile"
            className="inline-flex items-center gap-1.5 font-cinzel text-[10.5px] font-semibold uppercase tracking-[0.2em] text-[#9e7828] dark:text-[#c9a24b] hover:opacity-80 transition-opacity mb-2"
          >
            <ArrowLeft size={12} /> {locale === "fr" ? "Retour profil" : "Back to profile"}
          </Link>
          <h1 className="font-cormorant text-3xl md:text-4xl font-light text-foreground tracking-tight">
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
        <h2 className="font-cinzel text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9e7828] dark:text-[#c9a24b] mb-3 flex items-center gap-2">
          <Sparkles size={13} className="text-[#c9a24b]" />
          <span>{locale === "fr" ? "Top 3 archétypes directeurs" : "Top 3 ruling archetypes"}</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {result.topThree.map((arch, i) => {
            const score = result.archetypes.find((a) => a.archetype === arch)!;
            return (
              <motion.div
                key={arch}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="aegis-dock-tile rounded-2xl border border-[rgba(233,228,216,0.1)] p-5 space-y-3 shadow-sm relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <span className="font-cinzel text-[9.5px] font-semibold uppercase tracking-[0.2em] text-[#c9a24b]">
                    RANG #{i + 1}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {Math.round(score.intensity * 100)}% {locale === "fr" ? "intensité" : "intensity"}
                  </span>
                </div>
                <p className="font-cormorant text-2xl font-light text-foreground leading-tight">
                  {archLabel(arch, locale)}
                </p>
                <div className="space-y-2 pt-1">
                  <Bar label="Lumière" value={score.light} max={Math.max(score.total, 1)} color="bg-[#c9a24b]" />
                  <Bar label="Ombre" value={score.shadow} max={Math.max(score.total, 1)} color="bg-rose-500/80" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Shadow alerts */}
      {result.shadowAlerts.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={14} className="text-amber-400" />
            <h2 className="font-cinzel text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-400">
              {locale === "fr" ? "Zones d'ombre actives" : "Active shadow zones"}
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {result.shadowAlerts.map((arch) => (
              <span
                key={arch}
                className="px-3 py-1.5 rounded-xl font-cinzel text-[10px] uppercase tracking-wider bg-amber-500/10 border border-amber-500/30 text-amber-400"
              >
                {archLabel(arch, locale)}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Full ranking */}
      <section>
        <h2 className="font-cinzel text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-3">
          {locale === "fr" ? "Classement complet" : "Full ranking"}
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-[rgba(233,228,216,0.1)] aegis-dock-tile shadow-sm">
          <table className="w-full text-sm">
            <thead className="font-cinzel text-muted-foreground text-[9.5px] uppercase tracking-[0.18em]">
              <tr className="border-b border-white/[0.08]">
                <th className="text-left p-3.5">#</th>
                <th className="text-left p-3.5">{locale === "fr" ? "Archétype" : "Archetype"}</th>
                <th className="text-right p-3.5">Light</th>
                <th className="text-right p-3.5">Shadow</th>
                <th className="text-right p-3.5">{locale === "fr" ? "Net" : "Net"}</th>
                <th className="text-right p-3.5">{locale === "fr" ? "Intensité" : "Intensity"}</th>
              </tr>
            </thead>
            <tbody>
              {top12.map((a, i) => (
                <tr key={a.archetype} className="border-b border-white/[0.04] last:border-b-0 hover:bg-white/[0.02] transition-colors">
                  <td className="p-3.5 font-mono text-xs text-muted-foreground">{i + 1}</td>
                  <td className="p-3.5 font-medium text-foreground">{archLabel(a.archetype, locale)}</td>
                  <td className="p-3.5 text-right font-mono text-xs text-[#c9a24b]">{a.light.toFixed(1)}</td>
                  <td className="p-3.5 text-right font-mono text-xs text-rose-400/90">{a.shadow.toFixed(1)}</td>
                  <td
                    className={`p-3.5 text-right font-mono text-xs ${a.net >= 0 ? "text-[#c9a24b]" : "text-amber-400"}`}
                  >
                    {a.net >= 0 ? "+" : ""}
                    {a.net.toFixed(1)}
                  </td>
                  <td className="p-3.5 text-right font-mono text-xs text-muted-foreground">{Math.round(a.intensity * 100)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Houses */}
      <section>
        <h2 className="font-cinzel text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-3">
          {locale === "fr" ? "Par maison (Caroline Myss)" : "Per house (Caroline Myss)"}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {result.houses.map((h) => (
            <div
              key={h.house}
              className="aegis-dock-tile rounded-2xl border border-[rgba(233,228,216,0.08)] p-4 shadow-sm space-y-2"
            >
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-foreground text-sm font-medium">
                  <span className="font-cinzel text-[9.5px] uppercase tracking-wider text-[#c9a24b] mr-1.5">M{h.house}</span>
                  {locale === "fr" ? h.label_fr : h.label_en}
                </p>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {h.answered}/{h.total}
                </span>
              </div>
              {h.topArchetype ? (
                <p className="text-xs text-[#c9a24b] pt-1 flex items-center justify-between">
                  <span>→ {archLabel(h.topArchetype, locale)}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">({h.topArchetypeWeight.toFixed(1)})</span>
                </p>
              ) : (
                <p className="text-xs text-muted-foreground pt-1">
                  —
                </p>
              )}
            </div>
          ))}
        </div>
      </section>
    </MemberPageScaffold>
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
