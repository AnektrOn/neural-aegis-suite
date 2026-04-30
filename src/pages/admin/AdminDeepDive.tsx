import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Search, Sparkles, ChevronDown, ChevronRight } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import {
  type DeepDiveResult,
} from "@/features/archetype-deepdive-v2/domain/computeDeepDiveScores";
import { loadUnifiedDeepDiveResultsForAllUsers } from "@/features/archetype-deepdive-v2/domain/loadUnifiedScores";
import { archLabel } from "@/features/archetype-deepdive-v2/domain/narrativeContent";

interface UserRow {
  id: string;
  display_name: string | null;
}

interface UserScore {
  user: UserRow;
  result: DeepDiveResult;
}

export default function AdminDeepDive() {
  const { locale } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<UserScore[]>([]);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [profilesRes, resultsByUser] = await Promise.all([
          supabase.from("profiles").select("id, display_name"),
          loadUnifiedDeepDiveResultsForAllUsers(),
        ]);
        if (profilesRes.error) throw profilesRes.error;

        const profilesById = new Map<string, UserRow>();
        for (const p of (profilesRes.data ?? []) as UserRow[]) {
          profilesById.set(p.id, p);
        }

        const out: UserScore[] = [];
        for (const [uid, result] of resultsByUser) {
          if (result.answeredCount === 0) continue;
          const user = profilesById.get(uid) ?? { id: uid, display_name: null };
          out.push({ user, result });
        }
        out.sort((a, b) => b.result.answeredCount - a.result.answeredCount);
        if (!cancelled) setRows(out);
      } catch (e: any) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => (r.user.display_name ?? "").toLowerCase().includes(q));
  }, [rows, search]);

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

  return (
    <div className="max-w-6xl mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-neural-title text-2xl md:text-3xl flex items-center gap-2">
          <Sparkles size={20} /> {locale === "fr" ? "Deep Dive — scores" : "Deep Dive — scores"}
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          {locale === "fr"
            ? `${rows.length} utilisateur(s) ayant répondu au questionnaire approfondi.`
            : `${rows.length} user(s) with deep-dive answers.`}
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={locale === "fr" ? "Rechercher un utilisateur…" : "Search user…"}
          className="w-full pl-9 pr-3 py-2 rounded-xl bg-bg-surface border border-border-subtle text-sm text-foreground placeholder:text-text-tertiary/60 focus:outline-none focus:border-primary/40"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-text-tertiary text-sm py-8 text-center">
          {locale === "fr" ? "Aucun résultat." : "No results."}
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map(({ user, result }) => {
            const isOpen = expanded === user.id;
            return (
              <motion.div
                key={user.id}
                layout
                className="rounded-2xl border border-border-subtle bg-bg-surface/40 backdrop-blur-xl overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : user.id)}
                  className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-bg-elevated/40 transition-colors"
                >
                  {isOpen ? (
                    <ChevronDown size={16} className="text-text-tertiary shrink-0" />
                  ) : (
                    <ChevronRight size={16} className="text-text-tertiary shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground text-sm truncate">
                      {user.display_name ?? user.id.slice(0, 8)}
                    </p>
                    <p className="text-[11px] text-text-tertiary mt-0.5">
                      {result.answeredCount}/{result.totalQuestions}{" "}
                      {locale === "fr" ? "questions" : "questions"} ·{" "}
                      {Math.round(result.completionPct)}%
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap justify-end max-w-[55%]">
                    {result.topThree.slice(0, 3).map((arch) => (
                      <span
                        key={arch}
                        className="px-2 py-0.5 rounded-full text-[10px] bg-primary/10 border border-primary/30 text-primary"
                      >
                        {archLabel(arch, locale)}
                      </span>
                    ))}
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-border-subtle px-4 py-4 space-y-4">
                    {/* Top 12 ranking */}
                    <div className="overflow-x-auto rounded-xl border border-border-subtle bg-bg-base/40">
                      <table className="w-full text-sm">
                        <thead className="text-text-tertiary text-[10px] uppercase tracking-[0.18em]">
                          <tr className="border-b border-border-subtle">
                            <th className="text-left p-2.5">#</th>
                            <th className="text-left p-2.5">
                              {locale === "fr" ? "Archétype" : "Archetype"}
                            </th>
                            <th className="text-right p-2.5">Light</th>
                            <th className="text-right p-2.5">Shadow</th>
                            <th className="text-right p-2.5">Net</th>
                            <th className="text-right p-2.5">
                              {locale === "fr" ? "Intensité" : "Intensity"}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.archetypes.slice(0, 12).map((a, i) => (
                            <tr
                              key={a.archetype}
                              className="border-b border-border-subtle/40 last:border-b-0"
                            >
                              <td className="p-2.5 text-text-tertiary">{i + 1}</td>
                              <td className="p-2.5 text-foreground">
                                {archLabel(a.archetype, locale)}
                              </td>
                              <td className="p-2.5 text-right text-primary/80">
                                {a.light.toFixed(1)}
                              </td>
                              <td className="p-2.5 text-right text-accent-danger/80">
                                {a.shadow.toFixed(1)}
                              </td>
                              <td
                                className={`p-2.5 text-right ${
                                  a.net >= 0 ? "text-primary" : "text-accent-warning"
                                }`}
                              >
                                {a.net >= 0 ? "+" : ""}
                                {a.net.toFixed(1)}
                              </td>
                              <td className="p-2.5 text-right text-text-secondary">
                                {Math.round(a.intensity * 100)}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Shadow alerts */}
                    {result.shadowAlerts.length > 0 && (
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.18em] text-accent-warning mb-2">
                          {locale === "fr" ? "Zones d'ombre actives" : "Active shadow zones"}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {result.shadowAlerts.map((arch) => (
                            <span
                              key={arch}
                              className="px-2.5 py-1 rounded-full text-[10px] bg-accent-warning/10 border border-accent-warning/30 text-accent-warning"
                            >
                              {archLabel(arch, locale)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
