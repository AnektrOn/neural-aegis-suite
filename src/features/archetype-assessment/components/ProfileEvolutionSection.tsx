import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, History, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useSnapshotHistory } from "@/features/archetype-assessment/hooks/useSnapshotHistory";
import { ARCHETYPES } from "@/features/archetype-assessment/domain/archetypes";
import type {
  ArchetypeProfileSnapshot,
  SnapshotDelta,
  SnapshotTrigger,
} from "@/features/archetype-assessment/services/snapshotService";
import type { ArchetypeKey } from "@/features/archetype-assessment/domain/types";

const triggerLabels: Record<SnapshotTrigger, { fr: string; en: string }> = {
  core_assessment: { fr: "Évaluation initiale", en: "Core assessment" },
  appendix_completed: { fr: "Module approfondi", en: "Deepening module" },
  manual_refresh: { fr: "Mise à jour manuelle", en: "Manual refresh" },
};

function archetypeColor(key: ArchetypeKey): string {
  return ARCHETYPES.find((a) => a.key === key)?.color ?? "hsl(var(--primary))";
}

function archetypeName(key: ArchetypeKey, lang: "fr" | "en"): string {
  const def = ARCHETYPES.find((a) => a.key === key);
  if (!def) return key;
  return lang === "fr" ? def.name_fr : def.name_en;
}

function formatDate(iso: string, lang: "fr" | "en"): string {
  return new Date(iso).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function ProfileEvolutionSection() {
  const { user } = useAuth();
  const { t, locale } = useLanguage();
  const lang: "fr" | "en" = locale === "en" ? "en" : "fr";
  const { snapshots, isLoading, compare } = useSnapshotHistory(user?.id);
  const [openSnapshot, setOpenSnapshot] = useState<ArchetypeProfileSnapshot | null>(null);
  const [delta, setDelta] = useState<SnapshotDelta | null>(null);
  const [comparing, setComparing] = useState(false);

  const latest = snapshots[0] ?? null;

  const handleView = async (snap: ArchetypeProfileSnapshot) => {
    setOpenSnapshot(snap);
    setDelta(null);
    if (latest && latest.id !== snap.id) {
      setComparing(true);
      try {
        const result = await compare(snap.id, latest.id);
        setDelta(result);
      } catch (e) {
        console.error(e);
      } finally {
        setComparing(false);
      }
    }
  };

  if (!user) return null;
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="ethereal-glass p-8"
      >
        <p className="text-neural-label">{t("profile.loadingEvolution")}</p>
      </motion.div>
    );
  }
  if (snapshots.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="ethereal-glass p-8 space-y-6"
    >
      <div className="flex items-center gap-3">
        <History size={18} strokeWidth={1.5} className="text-primary" />
        <p className="text-neural-label">{t("profile.evolutionTitle")}</p>
      </div>

      <div className="space-y-3">
        {snapshots.map((snap, idx) => {
          const isLatest = idx === 0;
          return (
            <button
              key={snap.id}
              type="button"
              onClick={() => void handleView(snap)}
              className="w-full text-left rounded-xl border border-border/30 bg-secondary/10 hover:border-primary/40 transition-colors p-4 flex items-center gap-3"
            >
              <div className="flex flex-col gap-1 min-w-[110px]">
                <span className="text-[11px] font-display tabular-nums text-foreground">
                  {formatDate(snap.computed_at, lang)}
                </span>
                <span className="text-[10px] uppercase tracking-[0.16em] text-text-tertiary">
                  v{snap.snapshot_version}
                  {isLatest ? ` · ${t("profile.evolutionLatest")}` : ""}
                </span>
              </div>
              <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                <span className="text-[10px] uppercase tracking-[0.16em] text-text-tertiary">
                  {triggerLabels[snap.trigger_event][lang]}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {snap.top_archetypes.slice(0, 3).map((a) => (
                    <span
                      key={a.key}
                      className="text-[10px] px-2 py-0.5 rounded-full border"
                      style={{
                        borderColor: archetypeColor(a.key),
                        color: archetypeColor(a.key),
                        backgroundColor: `${archetypeColor(a.key).replace(")", " / 0.08)")}`,
                      }}
                    >
                      {lang === "fr" ? a.name_fr : a.name_en}
                    </span>
                  ))}
                </div>
              </div>
              <ArrowRight size={14} className="text-text-tertiary/60 shrink-0" />
            </button>
          );
        })}
      </div>

      <Dialog
        open={!!openSnapshot}
        onOpenChange={(o) => {
          if (!o) {
            setOpenSnapshot(null);
            setDelta(null);
          }
        }}
      >
        <DialogContent className="max-w-xl bg-background border-border/40 max-h-[85vh] overflow-y-auto">
          {openSnapshot && (
            <SnapshotDetailView
              snapshot={openSnapshot}
              delta={delta}
              comparing={comparing}
              latestId={latest?.id ?? null}
              lang={lang}
              t={t}
            />
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

interface DetailViewProps {
  snapshot: ArchetypeProfileSnapshot;
  delta: SnapshotDelta | null;
  comparing: boolean;
  latestId: string | null;
  lang: "fr" | "en";
  t: (k: string, vars?: Record<string, string | number>) => string;
}

function SnapshotDetailView({ snapshot, delta, comparing, latestId, lang, t }: DetailViewProps) {
  const isLatest = latestId === snapshot.id;

  const sortedDeltas = useMemo(
    () =>
      delta
        ? [...delta.archetypeDeltas].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
        : [],
    [delta],
  );

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-display text-lg">
          {triggerLabels[snapshot.trigger_event][lang]} · v{snapshot.snapshot_version}
        </DialogTitle>
        <DialogDescription>
          {formatDate(snapshot.computed_at, lang)}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-5 pt-2">
        {/* Top archetypes */}
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-[0.18em] text-text-tertiary">
            {t("profile.evolutionTopArchetypes")}
          </p>
          <div className="space-y-2">
            {snapshot.top_archetypes.map((a) => (
              <div key={a.key} className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-foreground" style={{ color: archetypeColor(a.key) }}>
                    {lang === "fr" ? a.name_fr : a.name_en}
                  </span>
                  <span className="font-display tabular-nums text-text-secondary">
                    {Math.round(a.score)}
                  </span>
                </div>
                <div className="h-1 rounded-full bg-border/40 overflow-hidden">
                  <div
                    className="h-full"
                    style={{
                      width: `${Math.max(2, Math.min(100, a.score))}%`,
                      backgroundColor: archetypeColor(a.key),
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Comparison vs latest */}
        {!isLatest && (
          <div className="space-y-2 pt-2 border-t border-border/30">
            <p className="text-[10px] uppercase tracking-[0.18em] text-text-tertiary">
              {t("profile.evolutionVsLatest")}
            </p>
            {comparing && (
              <div className="flex items-center gap-2 text-xs text-text-secondary">
                <Loader2 size={12} className="animate-spin" />
                {t("profile.evolutionComparing")}
              </div>
            )}
            {delta && (
              <>
                {delta.topGain && (
                  <p className="text-xs text-accent-positive flex items-center gap-1.5">
                    <TrendingUp size={12} />
                    {t("profile.evolutionTopGain", {
                      name: archetypeName(delta.topGain.key, lang),
                      delta: `+${delta.topGain.delta}`,
                    })}
                  </p>
                )}
                {delta.topLoss && (
                  <p className="text-xs text-accent-danger flex items-center gap-1.5">
                    <TrendingDown size={12} />
                    {t("profile.evolutionTopLoss", {
                      name: archetypeName(delta.topLoss.key, lang),
                      delta: `${delta.topLoss.delta}`,
                    })}
                  </p>
                )}
                <div className="space-y-1.5 pt-2">
                  {sortedDeltas.slice(0, 8).map((d) => {
                    const positive = d.delta > 0;
                    const negative = d.delta < 0;
                    return (
                      <div key={d.key} className="flex items-center gap-2 text-[11px]">
                        <span className="w-24 truncate text-text-secondary">
                          {lang === "fr" ? d.name_fr : d.name_en}
                        </span>
                        <div className="flex-1 h-1 rounded-full bg-border/40 overflow-hidden relative">
                          <div
                            className="absolute h-full"
                            style={{
                              left: "50%",
                              width: `${Math.min(50, Math.abs(d.delta) / 2)}%`,
                              transform: positive ? "translateX(0)" : "translateX(-100%)",
                              backgroundColor: positive
                                ? "hsl(var(--accent-positive))"
                                : negative
                                  ? "hsl(var(--accent-danger))"
                                  : "hsl(var(--border))",
                            }}
                          />
                        </div>
                        <span
                          className={`w-12 text-right font-display tabular-nums ${
                            positive
                              ? "text-accent-positive"
                              : negative
                                ? "text-accent-danger"
                                : "text-text-tertiary"
                          }`}
                        >
                          {positive ? "+" : ""}
                          {d.delta}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
