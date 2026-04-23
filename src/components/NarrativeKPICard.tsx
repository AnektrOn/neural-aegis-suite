import { useState } from "react";
import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ArrowUpRight } from "lucide-react";
import { NeuralCard } from "@/components/ui/neural-card";
import { useLanguage } from "@/i18n/LanguageContext";
import type { KPINarrative, NarrativeSentiment } from "@/lib/narrativeEngine";

interface Props {
  narrative: KPINarrative;
  isCompact?: boolean;
}

const sentimentBorder: Record<NarrativeSentiment, string> = {
  positive: "before:bg-emerald-400",
  neutral: "before:bg-border",
  warning: "before:bg-amber-400",
  critical: "before:bg-red-400",
};

const sentimentText: Record<NarrativeSentiment, string> = {
  positive: "text-emerald-400",
  neutral: "text-text-tertiary",
  warning: "text-amber-400",
  critical: "text-red-400",
};

export function NarrativeKPICard({ narrative, isCompact = false }: Props) {
  const { locale } = useLanguage();
  const isFR = locale === "fr";
  const [expanded, setExpanded] = useState(false);

  const label = isFR ? narrative.label_fr : narrative.label_en;
  const story = isFR ? narrative.story_fr : narrative.story_en;
  const actionLabel = isFR ? narrative.actionLabel_fr : narrative.actionLabel_en;

  const borderClass = `relative pl-3 before:content-[''] before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[3px] before:rounded-full ${sentimentBorder[narrative.sentiment]}`;

  // ── Compact (mobile): tap to expand ────────────────────────────────────────
  if (isCompact) {
    return (
      <div className={`p-3 text-center rounded-[14px] border-[0.5px] bg-[hsl(var(--aegis-s1))] border-[hsl(var(--aegis-border))] ${borderClass}`}>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex flex-col items-center gap-1 text-left focus:outline-none"
          aria-expanded={expanded}
        >
          <span className="font-barlow text-[9px] font-medium uppercase tracking-[0.2em] text-text-tertiary/80">
            {label}
          </span>
          <span className={`font-display text-lg ${sentimentText[narrative.sentiment]}`}>
            {narrative.metric}
          </span>
          <ChevronDown
            size={12}
            strokeWidth={1.5}
            className={`text-text-tertiary/50 transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </button>
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <p className="mt-2 text-[11px] leading-snug text-text-secondary text-left">
                {story}
              </p>
              {narrative.actionRoute && actionLabel && (
                <NavLink
                  to={narrative.actionRoute}
                  className="mt-2 inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.15em] text-accent-primary hover:underline"
                >
                  {actionLabel} <ArrowUpRight size={10} strokeWidth={1.5} />
                </NavLink>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ── Desktop / full ─────────────────────────────────────────────────────────
  return (
    <NeuralCard glow="none" className={`flex flex-col gap-2 min-h-[120px] ${borderClass}`}>
      <div className="flex items-start justify-between gap-2">
        <span className="text-[10px] tracking-[0.15em] uppercase text-text-tertiary font-display">
          {label}
        </span>
        <span className={`text-2xl font-display ${sentimentText[narrative.sentiment]}`}>
          {narrative.metric}
        </span>
      </div>
      <div className="h-px bg-border/40" />
      <p className="text-[11px] leading-snug text-text-secondary line-clamp-2">{story}</p>
      {narrative.actionRoute && actionLabel && (
        <NavLink
          to={narrative.actionRoute}
          className="mt-auto inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.12em] text-accent-primary hover:underline self-start"
        >
          {actionLabel} <ArrowUpRight size={10} strokeWidth={1.5} />
        </NavLink>
      )}
    </NeuralCard>
  );
}
