/**
 * Card-based renderer of the ADMIN Deep Dive report (Myss-style clinical read).
 *
 * Each archetype is a flippable card (front: function summary, back: risks &
 * work axis). All other cards use the `neural-card` hover lift utility for
 * a consistent neural deck feel.
 */

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Activity, Stethoscope, Layers, Home as HomeIcon, ScrollText,
  Brain, AlertTriangle, Target, Eye, RotateCcw, ShieldAlert,
} from "lucide-react";
import type { SampleProfile } from "../domain/sampleProfile";
import type { AnyArchetypeKey } from "../domain/types";

const ARCH_LABEL_FR: Record<AnyArchetypeKey, string> = {
  sovereign: "Sovereign", warrior: "Warrior", lover: "Lover", caregiver: "Caregiver",
  creator: "Creator", explorer: "Explorer", rebel: "Rebel", sage: "Sage",
  mystic: "Mystique", healer: "Healer", magician: "Magicien", jester: "Jester",
  child: "Child", victim: "Victim", saboteur: "Saboteur", prostitute: "Prostitute",
};

const ARCH_ACCENT: Partial<Record<AnyArchetypeKey, { ring: string; glow: string; chip: string; gradient: string }>> = {
  mystic:    { ring: "border-indigo-400/30",  glow: "shadow-[0_0_40px_-20px_rgba(129,140,248,0.6)]", chip: "bg-indigo-500/10 text-indigo-200",   gradient: "from-indigo-500/[0.08] to-transparent" },
  sage:      { ring: "border-sky-400/30",     glow: "shadow-[0_0_40px_-20px_rgba(56,189,248,0.5)]",  chip: "bg-sky-500/10 text-sky-200",         gradient: "from-sky-500/[0.08] to-transparent" },
  magician:  { ring: "border-emerald-400/30", glow: "shadow-[0_0_40px_-20px_rgba(52,211,153,0.5)]",  chip: "bg-emerald-500/10 text-emerald-200", gradient: "from-emerald-500/[0.08] to-transparent" },
  warrior:   { ring: "border-rose-400/30",    glow: "shadow-[0_0_40px_-20px_rgba(251,113,133,0.5)]", chip: "bg-rose-500/10 text-rose-200",       gradient: "from-rose-500/[0.08] to-transparent" },
  sovereign: { ring: "border-amber-400/30",   glow: "shadow-[0_0_40px_-20px_rgba(251,191,36,0.5)]",  chip: "bg-amber-500/10 text-amber-200",     gradient: "from-amber-500/[0.08] to-transparent" },
  creator:   { ring: "border-fuchsia-400/30", glow: "shadow-[0_0_40px_-20px_rgba(232,121,249,0.5)]", chip: "bg-fuchsia-500/10 text-fuchsia-200", gradient: "from-fuchsia-500/[0.08] to-transparent" },
  healer:    { ring: "border-teal-400/30",    glow: "shadow-[0_0_40px_-20px_rgba(45,212,191,0.5)]",  chip: "bg-teal-500/10 text-teal-200",       gradient: "from-teal-500/[0.08] to-transparent" },
};

const DEFAULT_ACCENT = {
  ring: "border-white/10",
  glow: "",
  chip: "bg-white/5 text-text-secondary",
  gradient: "from-white/[0.04] to-transparent",
};

const RANK_LABEL: Record<"dominant" | "secondaire" | "tertiaire", string> = {
  dominant: "Dominant",
  secondaire: "Secondaire",
  tertiaire: "Tertiaire",
};

function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}
function fmt(n: number): string {
  return n.toFixed(2).replace(/0$/, "").replace(/\.$/, "");
}

/* -------------------------------------------------------------------------- */
/* Flippable Admin Archetype Card                                             */
/* -------------------------------------------------------------------------- */

interface AdminArchetypeCardProps {
  archetype: AnyArchetypeKey;
  rank: "dominant" | "secondaire" | "tertiaire";
  adminFunctions: string;
  adminEvidence: string;
  adminRisks: string;
  adminWorkAxis: string;
}

function AdminArchetypeFlipCard({
  archetype, rank, adminFunctions, adminEvidence, adminRisks, adminWorkAxis,
}: AdminArchetypeCardProps) {
  const [flipped, setFlipped] = useState(false);
  const a = ARCH_ACCENT[archetype] ?? DEFAULT_ACCENT;

  return (
    <div
      className={`flip-card perspective-1200 cursor-pointer min-h-[360px] ${flipped ? "is-flipped" : ""}`}
      onClick={() => setFlipped((f) => !f)}
      role="button"
      tabIndex={0}
      aria-pressed={flipped}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setFlipped((f) => !f);
        }
      }}
    >
      <div className="flip-card-inner h-full min-h-[360px]">
        {/* FRONT — Functions + Evidence */}
        <div className="flip-face">
          <Card
            className={`h-full p-5 backdrop-blur-3xl bg-gradient-to-br ${a.gradient} bg-white/[0.03] border ${a.ring} ${a.glow} neural-card flex flex-col`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase tracking-[0.25em] text-text-tertiary font-display">
                {RANK_LABEL[rank]}
              </span>
              <Brain size={14} strokeWidth={1.5} className="text-text-tertiary" />
            </div>
            <h3 className="font-display text-lg tracking-[0.1em] uppercase text-text-primary mb-4">
              {ARCH_LABEL_FR[archetype]}
            </h3>

            <div className="space-y-3 flex-1">
              <div>
                <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-text-tertiary mb-1">
                  <Activity size={11} strokeWidth={1.5} /> Fonctions
                </div>
                <p className="text-sm text-text-secondary leading-relaxed">{adminFunctions}</p>
              </div>
              <div className="border-t border-white/5 pt-3">
                <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-text-tertiary mb-1">
                  <Eye size={11} strokeWidth={1.5} /> Ce qu'on voit
                </div>
                <p className="text-sm text-text-secondary leading-relaxed">{adminEvidence}</p>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.25em] text-text-tertiary font-display opacity-60">
              <RotateCcw size={11} strokeWidth={1.5} /> Risques & axe de travail
            </div>
          </Card>
        </div>

        {/* BACK — Risks + Work Axis */}
        <div className="flip-face flip-face-back">
          <Card
            className={`h-full p-5 backdrop-blur-3xl bg-white/[0.04] border ${a.ring} ${a.glow} flex flex-col`}
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-display text-sm tracking-[0.12em] uppercase text-text-primary">
                {ARCH_LABEL_FR[archetype]} — clinique
              </h4>
              <RotateCcw size={12} strokeWidth={1.5} className="text-text-tertiary" />
            </div>
            <div className="space-y-3 flex-1 overflow-auto">
              <div>
                <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-accent-warning/80 mb-1">
                  <AlertTriangle size={11} strokeWidth={1.5} /> Risques
                </div>
                <p className="text-sm text-text-secondary leading-relaxed">{adminRisks}</p>
              </div>
              <div className="border-t border-white/5 pt-3">
                <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-emerald-300/80 mb-1">
                  <Target size={11} strokeWidth={1.5} /> Axe de travail
                </div>
                <p className="text-sm text-text-secondary leading-relaxed">{adminWorkAxis}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

export function DeepDiveAdminCards({ profile }: { profile: SampleProfile }) {
  const n = profile.narrative;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Diagnostic */}
      <Card className="neural-card p-6 sm:p-8 backdrop-blur-3xl bg-white/[0.04] border border-white/10 shadow-[0_0_60px_-30px_rgba(255,255,255,0.15)]">
        <div className="flex items-center gap-2 text-text-tertiary text-xs uppercase tracking-[0.2em] font-display mb-3">
          <Stethoscope size={14} strokeWidth={1.5} />
          Diagnostic rapide
        </div>
        <h2 className="font-display text-2xl sm:text-3xl tracking-[0.12em] uppercase text-text-primary mb-5">
          Lecture admin — {profile.label}
        </h2>

        <div className="grid sm:grid-cols-3 gap-4 mb-5">
          <div className="rounded-lg bg-white/[0.02] border border-white/5 p-4">
            <div className="text-[10px] uppercase tracking-[0.25em] text-text-tertiary font-display mb-2">Triade</div>
            <p className="text-sm text-text-secondary leading-relaxed">{n.adminDiagnostic.triad}</p>
          </div>
          <div className="rounded-lg bg-white/[0.02] border border-white/5 p-4">
            <div className="text-[10px] uppercase tracking-[0.25em] text-text-tertiary font-display mb-2">Ressources</div>
            <p className="text-sm text-text-secondary leading-relaxed">{n.adminDiagnostic.resources}</p>
          </div>
          <div className="rounded-lg bg-white/[0.02] border border-white/5 p-4">
            <div className="text-[10px] uppercase tracking-[0.25em] text-text-tertiary font-display mb-2">Survie</div>
            <p className="text-sm text-text-secondary leading-relaxed">{n.adminDiagnostic.survival}</p>
          </div>
        </div>

        <div className="rounded-lg bg-white/[0.03] border border-white/10 p-4">
          <div className="text-[10px] uppercase tracking-[0.25em] text-accent-warning/80 font-display mb-1">Hypothèse admin</div>
          <p className="text-sm text-text-secondary leading-relaxed">{n.adminDiagnostic.hypothesis}</p>
        </div>
      </Card>

      {/* Scores */}
      <Card className="neural-card p-6 backdrop-blur-3xl bg-white/[0.03] border border-white/10">
        <div className="flex items-center gap-2 text-text-tertiary text-xs uppercase tracking-[0.2em] font-display mb-4">
          <Layers size={14} strokeWidth={1.5} />
          Scores
        </div>

        <div className="grid sm:grid-cols-2 gap-3 mb-5">
          {profile.majors.map((m) => (
            <div key={m.archetype} className="rounded-lg bg-white/[0.02] border border-white/5 p-3 transition-colors hover:bg-white/[0.04]">
              <div className="flex items-center justify-between mb-2">
                <span className="font-display text-sm tracking-wider text-text-primary">{ARCH_LABEL_FR[m.archetype]}</span>
                <span className="text-xs text-text-tertiary">i. {fmt(m.intensity)}</span>
              </div>
              <div className="flex gap-2 text-[11px] mb-2">
                <span className="text-emerald-300/80">light {pct(m.light)}</span>
                <span className="text-text-tertiary">·</span>
                <span className="text-accent-warning/80">shadow {pct(m.shadow)}</span>
                <span className="text-text-tertiary">·</span>
                <span className="text-text-secondary">maisons {m.topHouses.join(", ")}</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden flex">
                <div className="h-full bg-emerald-400/50 transition-all duration-700" style={{ width: `${Math.round(m.light * 100)}%` }} />
                <div className="h-full bg-accent-warning/50 transition-all duration-700" style={{ width: `${Math.round(m.shadow * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="text-[10px] uppercase tracking-[0.25em] text-text-tertiary font-display mb-2">Survie</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {profile.survival.map((s) => (
            <div key={s.archetype} className="rounded-lg bg-white/[0.02] border border-white/5 p-2 text-xs text-text-secondary">
              <div className="font-display tracking-wider text-text-primary mb-1">{ARCH_LABEL_FR[s.archetype]}</div>
              <div className="text-[11px]">i. {fmt(s.intensity)} · shadow {pct(s.shadow)}</div>
              <div className="text-[10px] text-text-tertiary">m. {s.topHouses.join("/")}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Archetype clinical flip cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-text-tertiary text-xs uppercase tracking-[0.2em] font-display">
            <Brain size={14} strokeWidth={1.5} />
            Lecture archétype par archétype
          </div>
          <span className="text-[10px] uppercase tracking-[0.2em] text-text-tertiary/70 font-display hidden sm:inline">
            Touche pour voir risques & axe de travail
          </span>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {n.archetypeBlocks.map((b) => (
            <AdminArchetypeFlipCard
              key={b.archetype}
              archetype={b.archetype}
              rank={b.rank}
              adminFunctions={b.adminFunctions}
              adminEvidence={b.adminEvidence}
              adminRisks={b.adminRisks}
              adminWorkAxis={b.adminWorkAxis}
            />
          ))}
        </div>
      </div>

      {/* Primary shadow */}
      <Card className="neural-card p-6 backdrop-blur-3xl bg-gradient-to-br from-amber-500/[0.04] to-transparent bg-white/[0.03] border border-accent-warning/20">
        <div className="flex items-center gap-2 text-accent-warning/80 text-xs uppercase tracking-[0.2em] font-display mb-3">
          <ShieldAlert size={14} strokeWidth={1.5} />
          Ombre principale — {n.primaryShadowTheme} & Child
        </div>
        <p className="text-sm text-text-secondary leading-relaxed">{n.survivalAdmin}</p>
      </Card>

      {/* Hotspot houses */}
      <div>
        <div className="flex items-center gap-2 text-text-tertiary text-xs uppercase tracking-[0.2em] font-display mb-3">
          <HomeIcon size={14} strokeWidth={1.5} />
          Maisons les plus chargées
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {profile.hotspotHouses.map((h) => (
            <Card key={h.house} className="neural-card p-5 backdrop-blur-3xl bg-white/[0.03] border border-white/10 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="font-display text-3xl text-text-primary tracking-wider">{h.house}</span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-text-tertiary font-display">Maison</span>
              </div>
              <h4 className="font-display text-sm tracking-wider uppercase text-text-primary mb-3">{h.label}</h4>
              <div className="flex flex-wrap gap-1 mb-3">
                {h.archetypes.map((arch) => {
                  const a = ARCH_ACCENT[arch] ?? DEFAULT_ACCENT;
                  return (
                    <Badge key={arch} variant="outline" className={`${a.chip} border-0 text-[10px] px-2`}>
                      {ARCH_LABEL_FR[arch]}
                    </Badge>
                  );
                })}
              </div>
              <p className="text-xs text-text-secondary leading-relaxed flex-1">{h.theme}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Sacred Contract */}
      <Card className="neural-card p-6 sm:p-8 backdrop-blur-3xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/10 shadow-[0_0_50px_-25px_rgba(255,255,255,0.2)]">
        <div className="flex items-center gap-2 text-text-tertiary text-xs uppercase tracking-[0.2em] font-display mb-3">
          <ScrollText size={14} strokeWidth={1.5} />
          Lecture contrat (Sacred Contracts)
        </div>
        <ul className="space-y-3 mt-4">
          {n.adminContract.map((c, i) => (
            <li key={i} className="text-sm text-text-secondary leading-relaxed flex gap-3">
              <span className="font-display text-text-tertiary shrink-0 mt-0.5">{String(i + 1).padStart(2, "0")}</span>
              <span>{c}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
