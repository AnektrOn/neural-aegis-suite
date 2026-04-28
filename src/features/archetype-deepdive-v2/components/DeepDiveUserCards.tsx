/**
 * Card-based renderer of the User Deep Dive report.
 *
 * Consumes the structured `narrative` of a SampleProfile and renders it as a
 * modular dashboard of cards (overview, archetypes, shadows, narrative,
 * practices) — preserves the "Neural & Ethereal" visual identity.
 */

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles, ShieldAlert, BookOpen, Compass, AlertTriangle, Flame,
  Clock, Play, Eye,
} from "lucide-react";
import type { SampleProfile } from "../domain/sampleProfile";
import type { AnyArchetypeKey } from "../domain/types";

const ARCH_LABEL_FR: Record<AnyArchetypeKey, string> = {
  sovereign: "Sovereign", warrior: "Warrior", lover: "Lover", caregiver: "Caregiver",
  creator: "Creator", explorer: "Explorer", rebel: "Rebel", sage: "Sage",
  mystic: "Mystique", healer: "Healer", magician: "Magicien", jester: "Jester",
  child: "Child", victim: "Victim", saboteur: "Saboteur", prostitute: "Prostitute",
};

/** Per-archetype accent class (HSL semantic tokens fall back to subtle hues). */
const ARCH_ACCENT: Partial<Record<AnyArchetypeKey, { ring: string; glow: string; chip: string }>> = {
  mystic:    { ring: "border-indigo-400/30", glow: "shadow-[0_0_40px_-20px_rgba(129,140,248,0.6)]", chip: "bg-indigo-500/10 text-indigo-200" },
  sage:      { ring: "border-sky-400/30",    glow: "shadow-[0_0_40px_-20px_rgba(56,189,248,0.5)]",  chip: "bg-sky-500/10 text-sky-200" },
  magician:  { ring: "border-emerald-400/30",glow: "shadow-[0_0_40px_-20px_rgba(52,211,153,0.5)]",  chip: "bg-emerald-500/10 text-emerald-200" },
  warrior:   { ring: "border-rose-400/30",   glow: "shadow-[0_0_40px_-20px_rgba(251,113,133,0.5)]", chip: "bg-rose-500/10 text-rose-200" },
  sovereign: { ring: "border-amber-400/30",  glow: "shadow-[0_0_40px_-20px_rgba(251,191,36,0.5)]",  chip: "bg-amber-500/10 text-amber-200" },
  creator:   { ring: "border-fuchsia-400/30",glow: "shadow-[0_0_40px_-20px_rgba(232,121,249,0.5)]", chip: "bg-fuchsia-500/10 text-fuchsia-200" },
  healer:    { ring: "border-teal-400/30",   glow: "shadow-[0_0_40px_-20px_rgba(45,212,191,0.5)]",  chip: "bg-teal-500/10 text-teal-200" },
};

const DEFAULT_ACCENT = {
  ring: "border-white/10",
  glow: "",
  chip: "bg-white/5 text-text-secondary",
};

const RANK_LABEL: Record<"dominant" | "secondaire" | "tertiaire", string> = {
  dominant: "Dominant",
  secondaire: "Secondaire",
  tertiaire: "Tertiaire",
};

/* -------------------------------------------------------------------------- */

export function DeepDiveUserCards({ profile }: { profile: SampleProfile }) {
  const n = profile.narrative;

  return (
    <div className="space-y-6">
      {/* Card 1 — Overview (full width) */}
      <Card className="p-6 sm:p-8 backdrop-blur-3xl bg-white/[0.04] border border-white/10 shadow-[0_0_60px_-30px_rgba(255,255,255,0.15)]">
        <div className="flex items-center gap-2 text-text-tertiary text-xs uppercase tracking-[0.2em] font-display mb-3">
          <Sparkles size={14} strokeWidth={1.5} />
          Vue d'ensemble
        </div>
        <h2 className="font-display text-2xl sm:text-3xl tracking-[0.12em] uppercase text-text-primary mb-4">
          Ton paysage archétypal
        </h2>
        <p className="text-text-secondary leading-relaxed">{n.overviewLead}</p>
        <p className="text-text-secondary leading-relaxed mt-3">
          L'ombre principale de ton profil tourne autour du{" "}
          <span className="text-text-primary font-medium">{n.primaryShadowTheme}</span> : besoin de garder la
          main sur ce qui compte, aussi bien intérieurement (sens, cohérence) qu'extérieurement (cadre, trajectoires).
        </p>

        <div className="flex flex-wrap items-center gap-2 mt-5">
          {n.archetypeBlocks.map((b) => {
            const a = ARCH_ACCENT[b.archetype] ?? DEFAULT_ACCENT;
            return (
              <Badge key={b.archetype} variant="outline" className={`${a.chip} border-0 px-3 py-1 font-display tracking-wider`}>
                {ARCH_LABEL_FR[b.archetype]}
              </Badge>
            );
          })}
          <Badge variant="outline" className="border-accent-warning/30 text-accent-warning px-3 py-1 font-display tracking-wider">
            Ombre · {n.primaryShadowTheme}
          </Badge>
        </div>
      </Card>

      {/* Cards 2–4 — Archetypes grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {n.archetypeBlocks.map((b) => {
          const a = ARCH_ACCENT[b.archetype] ?? DEFAULT_ACCENT;
          return (
            <Card
              key={b.archetype}
              className={`p-5 backdrop-blur-3xl bg-white/[0.03] border ${a.ring} ${a.glow} transition-all hover:-translate-y-0.5 hover:bg-white/[0.05]`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] uppercase tracking-[0.25em] text-text-tertiary font-display">
                  {RANK_LABEL[b.rank]}
                </span>
                <Compass size={14} strokeWidth={1.5} className="text-text-tertiary" />
              </div>
              <h3 className="font-display text-xl tracking-[0.1em] uppercase text-text-primary mb-1">
                Le {ARCH_LABEL_FR[b.archetype]}
              </h3>
              <p className="text-xs italic text-text-tertiary mb-4">{b.tagline}</p>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-text-tertiary mb-1">
                    <Flame size={11} strokeWidth={1.5} /> Ce que ça t'apporte
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed">{b.gives}</p>
                </div>
                <div className="border-t border-white/5 pt-3">
                  <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-accent-warning/80 mb-1">
                    <AlertTriangle size={11} strokeWidth={1.5} /> À surveiller
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed">{b.watchOut}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Card 5 — Survival shadows */}
      <Card className="p-6 backdrop-blur-3xl bg-white/[0.03] border border-white/10">
        <div className="flex items-center gap-2 text-text-tertiary text-xs uppercase tracking-[0.2em] font-display mb-3">
          <ShieldAlert size={14} strokeWidth={1.5} />
          Ombres de survie
        </div>
        <h2 className="font-display text-xl tracking-[0.12em] uppercase text-text-primary mb-4">
          Tes signaux profonds
        </h2>

        {/* Mini-bars */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {profile.survival.map((s) => {
            const pct = Math.round(s.intensity * 100);
            const isHot = s.intensity >= 0.5;
            return (
              <div key={s.archetype} className="rounded-lg bg-white/[0.02] border border-white/5 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] uppercase tracking-wider text-text-secondary font-display">
                    {ARCH_LABEL_FR[s.archetype]}
                  </span>
                  <span className={`text-xs ${isHot ? "text-accent-warning" : "text-text-tertiary"}`}>
                    {pct}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className={`h-full ${isHot ? "bg-accent-warning/70" : "bg-white/30"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-sm text-text-secondary leading-relaxed">{n.survivalUser}</p>
      </Card>

      {/* Card 6 — Narrative + Strengths + Vigilance */}
      <Card className="p-6 sm:p-8 backdrop-blur-3xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/10 shadow-[0_0_50px_-25px_rgba(255,255,255,0.2)]">
        <div className="flex items-center gap-2 text-text-tertiary text-xs uppercase tracking-[0.2em] font-display mb-3">
          <BookOpen size={14} strokeWidth={1.5} />
          Ton récit archétypal
        </div>
        <p className="text-text-secondary leading-relaxed text-base">{n.closingNarrativeUser}</p>

        <div className="grid md:grid-cols-2 gap-5 mt-6">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-emerald-300/80 mb-2 font-display">
              <Flame size={11} strokeWidth={1.5} /> Forces sur lesquelles t'appuyer
            </div>
            <ul className="space-y-2">
              {n.strengths.map((s, i) => (
                <li key={i} className="text-sm text-text-secondary leading-relaxed flex gap-2">
                  <span className="text-emerald-400/60 mt-1.5 shrink-0 size-1 rounded-full bg-current" />
                  <span dangerouslySetInnerHTML={{ __html: s.replace(/\*\*(.+?)\*\*/g, '<strong class="text-text-primary">$1</strong>') }} />
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-accent-warning/80 mb-2 font-display">
              <Eye size={11} strokeWidth={1.5} /> Points de vigilance
            </div>
            <ul className="space-y-2">
              {n.vigilance.map((v, i) => (
                <li key={i} className="text-sm text-text-secondary leading-relaxed flex gap-2">
                  <span className="text-accent-warning/60 mt-1.5 shrink-0 size-1 rounded-full bg-current" />
                  <span>{v}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

      {/* Cards 7+ — Practices deck */}
      <div>
        <div className="flex items-center gap-2 text-text-tertiary text-xs uppercase tracking-[0.2em] font-display mb-3">
          <Play size={14} strokeWidth={1.5} />
          Pratiques recommandées
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {n.practices.map((p, i) => {
            const m = p.title.match(/(\d+)\s*min/i);
            const duration = m ? `${m[1]} min` : null;
            const cleanTitle = p.title.replace(/\s*[—-]\s*\d+\s*min/i, "").trim();
            return (
              <Card
                key={i}
                className="p-5 backdrop-blur-3xl bg-white/[0.03] border border-white/10 transition-all hover:-translate-y-0.5 hover:bg-white/[0.05] flex flex-col"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h4 className="font-display text-sm tracking-wider uppercase text-text-primary leading-tight">
                    {cleanTitle}
                  </h4>
                  {duration && (
                    <Badge variant="outline" className="shrink-0 border-white/10 text-text-tertiary text-[10px]">
                      <Clock size={10} strokeWidth={1.5} className="mr-1" />
                      {duration}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-text-secondary leading-relaxed flex-1">{p.description}</p>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
