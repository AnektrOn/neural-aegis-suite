/**
 * ProgressEvolutionReport
 *
 * Full evolution report for a user's Myss Archetype perspective.
 * Shows:
 *  - Adherence stats (streak, days answered)
 *  - Radar before/after comparison
 *  - Per-archetype delta cards
 *  - Narrative
 *  - Snapshot timeline (if multiple periods)
 */

import { motion } from "framer-motion";
import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import {
  TrendingUp, TrendingDown, Minus, CalendarDays, Flame,
  Sparkles, Clock, ChevronDown,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/i18n/LanguageContext";
import { PerspectiveRadarComparison } from "./PerspectiveRadarComparison";
import type { TrackingProgressSnapshot, ArchetypeDelta } from "../domain/types";
import type { AnyArchetypeKey } from "@/features/archetype-deepdive-v2/domain/types";
import { useState } from "react";

// ---------------------------------------------------------------------------
// Archetype display helpers
// ---------------------------------------------------------------------------

const ARCHETYPE_NAME_FR: Partial<Record<AnyArchetypeKey, string>> = {
  sovereign: "Souverain", warrior: "Guerrier", lover: "Amant",
  caregiver: "Gardien", creator: "Créateur", explorer: "Explorateur",
  rebel: "Rebelle", sage: "Sage", mystic: "Mystique",
  healer: "Guérisseur", magician: "Magicien", jester: "Bouffon",
  child: "Enfant", victim: "Victime", saboteur: "Saboteur", prostitute: "Prostituée",
};

const ARCHETYPE_NAME_EN: Partial<Record<AnyArchetypeKey, string>> = {
  sovereign: "Sovereign", warrior: "Warrior", lover: "Lover",
  caregiver: "Caregiver", creator: "Creator", explorer: "Explorer",
  rebel: "Rebel", sage: "Sage", mystic: "Mystic",
  healer: "Healer", magician: "Magician", jester: "Jester",
  child: "Child", victim: "Victim", saboteur: "Saboteur", prostitute: "Prostitute",
};

const ARCHETYPE_COLOR: Record<string, string> = {
  sovereign: "hsl(45 90% 55%)", warrior: "hsl(0 75% 58%)", lover: "hsl(330 70% 58%)",
  caregiver: "hsl(200 70% 55%)", creator: "hsl(265 65% 60%)", explorer: "hsl(155 60% 50%)",
  rebel: "hsl(20 80% 55%)", sage: "hsl(220 60% 58%)", mystic: "hsl(280 60% 58%)",
  healer: "hsl(170 55% 50%)", magician: "hsl(305 60% 58%)", jester: "hsl(55 85% 55%)",
  child: "hsl(200 60% 58%)", victim: "hsl(0 40% 55%)", saboteur: "hsl(30 60% 50%)", prostitute: "hsl(340 50% 55%)",
};

function archName(arch: AnyArchetypeKey, locale: "fr" | "en"): string {
  const map = locale === "fr" ? ARCHETYPE_NAME_FR : ARCHETYPE_NAME_EN;
  return map[arch] ?? arch;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface AdherenceStripProps {
  answeredDays: number;
  totalDays: number;
  streak: number;
  locale: "fr" | "en";
}

function AdherenceStrip({ answeredDays, totalDays, streak, locale }: AdherenceStripProps) {
  const pct = totalDays > 0 ? Math.round((answeredDays / totalDays) * 100) : 0;

  return (
    <div className="grid grid-cols-3 gap-3">
      {[
        {
          icon: <CalendarDays size={14} className="text-amber-400" strokeWidth={1.5} />,
          value: `${answeredDays}/${totalDays}`,
          label: locale === "fr" ? "jours répondus" : "days answered",
        },
        {
          icon: <Flame size={14} className="text-orange-400" strokeWidth={1.5} />,
          value: `${streak}j`,
          label: locale === "fr" ? "streak actuel" : "current streak",
        },
        {
          icon: <TrendingUp size={14} className="text-emerald-400" strokeWidth={1.5} />,
          value: `${pct}%`,
          label: locale === "fr" ? "assiduité" : "adherence",
        },
      ].map((item) => (
        <Card key={item.label} className="neural-card p-3.5 bg-white/[0.03] border border-white/10 text-center">
          <div className="flex justify-center mb-1.5">{item.icon}</div>
          <p className="text-lg font-bold font-display text-foreground">{item.value}</p>
          <p className="text-[10px] text-text-tertiary uppercase tracking-wider">{item.label}</p>
        </Card>
      ))}
    </div>
  );
}

interface DeltaCardProps {
  delta: ArchetypeDelta;
  locale: "fr" | "en";
}

function DeltaCard({ delta, locale }: DeltaCardProps) {
  const color = ARCHETYPE_COLOR[delta.archetype] ?? "hsl(var(--primary))";
  const name = archName(delta.archetype, locale);
  const mag = delta.magnitude;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={[
        "relative overflow-hidden rounded-xl border p-4 flex items-center gap-3",
        delta.direction === "up"
          ? "border-emerald-500/20 bg-emerald-500/[0.04]"
          : delta.direction === "down"
            ? "border-amber-500/20 bg-amber-500/[0.04]"
            : "border-white/8 bg-white/[0.02]",
      ].join(" ")}
    >
      {/* Archetype color accent */}
      <div
        className="size-2 shrink-0 rounded-full"
        style={{ background: color, boxShadow: `0 0 6px ${color}80` }}
      />

      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-semibold truncate"
          style={{ color }}
        >
          {name}
        </p>
        <p className="text-[10px] text-text-tertiary">
          {locale === "fr" ? "net" : "net"}{" "}
          <span className={delta.direction === "up" ? "text-emerald-400" : delta.direction === "down" ? "text-amber-400" : "text-text-tertiary"}>
            {delta.net_delta > 0 ? "+" : ""}{delta.net_delta.toFixed(2)}
          </span>
        </p>
      </div>

      {/* Direction icon */}
      <div className="shrink-0">
        {delta.direction === "up" && <TrendingUp size={16} className="text-emerald-400" strokeWidth={1.5} />}
        {delta.direction === "down" && <TrendingDown size={16} className="text-amber-400" strokeWidth={1.5} />}
        {delta.direction === "stable" && <Minus size={16} className="text-text-tertiary" strokeWidth={1.5} />}
      </div>

      {/* Magnitude bar */}
      {mag > 0 && (
        <div
          className="absolute bottom-0 left-0 h-[2px] rounded-full"
          style={{
            width: `${Math.min(mag * 100, 100)}%`,
            background: delta.direction === "up" ? "hsl(160 70% 50%)" : "hsl(38 92% 60%)",
          }}
        />
      )}
    </motion.div>
  );
}

interface SnapshotTimelineProps {
  snapshots: TrackingProgressSnapshot[];
  activeId: string;
  onSelect: (id: string) => void;
  locale: "fr" | "en";
}

function SnapshotTimeline({ snapshots, activeId, onSelect, locale }: SnapshotTimelineProps) {
  if (snapshots.length <= 1) return null;
  const dateFns = locale === "fr" ? fr : enUS;

  return (
    <div className="flex flex-wrap gap-2">
      {snapshots.map((s) => (
        <button
          key={s.id}
          onClick={() => onSelect(s.id)}
          className={[
            "px-3 py-1.5 rounded-lg text-xs border transition-all",
            s.id === activeId
              ? "border-primary/40 bg-primary/10 text-foreground"
              : "border-white/10 bg-white/[0.02] text-text-tertiary hover:bg-white/[0.04]",
          ].join(" ")}
        >
          <span className="font-display">
            {format(new Date(s.period_end), "d MMM", { locale: dateFns })}
          </span>
          <span className="ml-1 opacity-60">({s.response_count})</span>
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Report Component
// ---------------------------------------------------------------------------

interface Props {
  snapshots: TrackingProgressSnapshot[];
  adherence: { answeredDays: number; totalDays: number; streak: number } | null;
}

export function ProgressEvolutionReport({ snapshots, adherence }: Props) {
  const { locale } = useLanguage();
  const l = locale as "fr" | "en";

  const [activeSnapshotId, setActiveSnapshotId] = useState(snapshots[0]?.id ?? "");
  const [showAllDeltas, setShowAllDeltas] = useState(false);

  const activeSnapshot = snapshots.find((s) => s.id === activeSnapshotId) ?? snapshots[0];

  if (!activeSnapshot) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <div className="size-14 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center">
          <Sparkles size={22} className="text-text-tertiary" strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-base font-semibold text-foreground mb-1">
            {l === "fr" ? "Aucun rapport généré" : "No report generated yet"}
          </p>
          <p className="text-sm text-text-tertiary max-w-sm">
            {l === "fr"
              ? "Répondez à votre check-in quotidien pendant 2 semaines. L'admin pourra ensuite générer votre rapport d'évolution."
              : "Answer your daily check-in for 2 weeks. The admin can then generate your evolution report."}
          </p>
        </div>
      </div>
    );
  }

  const dateFns = l === "fr" ? fr : enUS;

  const deltaEntries = Object.entries(activeSnapshot.delta)
    .map(([arch, d]) => ({
      archetype: arch as AnyArchetypeKey,
      ...d,
      magnitude: Math.abs((d as any).net_delta ?? 0),
    } as ArchetypeDelta))
    .sort((a, b) => b.magnitude - a.magnitude);

  const visibleDeltas = showAllDeltas ? deltaEntries : deltaEntries.slice(0, 6);
  const narrative = l === "fr" ? activeSnapshot.narrative_fr : activeSnapshot.narrative_en;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-text-tertiary font-display mb-0.5">
            {l === "fr" ? "Rapport d'évolution" : "Evolution Report"}
          </p>
          <h2 className="text-xl font-semibold font-cormorant text-foreground">
            {l === "fr" ? "Perspective Myss — Archétypes" : "Myss Perspective — Archetypes"}
          </h2>
          <p className="text-xs text-text-tertiary mt-1">
            {format(new Date(activeSnapshot.period_start), "d MMM", { locale: dateFns })}
            {" → "}
            {format(new Date(activeSnapshot.period_end), "d MMM yyyy", { locale: dateFns })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] border-white/10 text-text-tertiary">
            <Clock size={10} className="mr-1" strokeWidth={1.5} />
            {activeSnapshot.response_count}{" "}
            {l === "fr" ? "réponses" : "responses"}
          </Badge>
        </div>
      </div>

      {/* Timeline selector */}
      <SnapshotTimeline
        snapshots={snapshots}
        activeId={activeSnapshotId}
        onSelect={setActiveSnapshotId}
        locale={l}
      />

      {/* Adherence */}
      {adherence && (
        <AdherenceStrip
          answeredDays={adherence.answeredDays}
          totalDays={adherence.totalDays}
          streak={adherence.streak}
          locale={l}
        />
      )}

      {/* Radar comparison */}
      <PerspectiveRadarComparison
        baselineScores={activeSnapshot.baseline_scores}
        trackingScores={activeSnapshot.tracking_scores}
        locale={l}
      />

      {/* Narrative */}
      {narrative && (
        <Card className="neural-card p-5 bg-white/[0.03] border border-white/8">
          <p className="text-[10px] uppercase tracking-widest text-text-tertiary font-display mb-3">
            {l === "fr" ? "Synthèse d'évolution" : "Evolution synthesis"}
          </p>
          <p className="text-sm leading-relaxed text-text-secondary italic">
            {narrative}
          </p>
        </Card>
      )}

      {/* Delta cards */}
      {deltaEntries.length > 0 && (
        <div className="space-y-3">
          <p className="text-[10px] uppercase tracking-widest text-text-tertiary font-display">
            {l === "fr" ? "Évolution par archétype" : "Per-archetype evolution"}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {visibleDeltas.map((d) => (
              <DeltaCard key={d.archetype} delta={d} locale={l} />
            ))}
          </div>
          {deltaEntries.length > 6 && (
            <button
              onClick={() => setShowAllDeltas((v) => !v)}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs text-text-tertiary hover:text-foreground transition-colors"
            >
              <ChevronDown
                size={14}
                strokeWidth={1.5}
                className={`transition-transform ${showAllDeltas ? "rotate-180" : ""}`}
              />
              {showAllDeltas
                ? (l === "fr" ? "Réduire" : "Show less")
                : (l === "fr" ? `Voir ${deltaEntries.length - 6} de plus` : `Show ${deltaEntries.length - 6} more`)}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
