import { memo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ArrowUpRight } from "lucide-react";
import { NeuralCard } from "@/components/ui/neural-card";
import { useLanguage } from "@/i18n/LanguageContext";
import { KPI_PAGE_ROUTES, type KPINarrative, type NarrativeSentiment } from "@/lib/narrativeEngine";
import { cn } from "@/lib/utils";

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

const NarrativeKPICardBase = function NarrativeKPICard({ narrative, isCompact = false }: Props) {
  const { locale } = useLanguage();
  const navigate = useNavigate();
  const isFR = locale === "fr";
  const [expanded, setExpanded] = useState(false);

  const label = isFR ? narrative.label_fr : narrative.label_en;
  const story = isFR ? narrative.story_fr : narrative.story_en;
  const actionLabel = isFR ? narrative.actionLabel_fr : narrative.actionLabel_en;
  const href = narrative.actionRoute ?? KPI_PAGE_ROUTES[narrative.key];

  const borderClass = `relative pl-3 before:content-[''] before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[3px] before:rounded-full ${sentimentBorder[narrative.sentiment]}`;

  const goToPage = () => navigate(href);

  // ── Compact: tap card → page; chevron → expand story ───────────────────────
  if (isCompact) {
    return (
      <div
        role="link"
        tabIndex={0}
        onClick={goToPage}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            goToPage();
          }
        }}
        className={cn(
          "dashboard-kpi-pill dashboard-panel-interactive cursor-pointer",
          borderClass,
        )}
        aria-label={actionLabel ? `${label} — ${actionLabel}` : label}
      >
        <div className="flex w-full flex-col items-center gap-1">
          <span className="font-barlow text-[10px] font-medium uppercase tracking-[0.12em] text-text-tertiary">
            {label}
          </span>
          <span className={`font-display text-lg ${sentimentText[narrative.sentiment]}`}>
            {narrative.metric}
          </span>
          <button
            type="button"
            data-dashboard-stop-nav
            onClick={() => setExpanded((v) => !v)}
            className="inline-flex items-center gap-0.5 rounded-md p-1 text-text-tertiary/50 hover:text-text-tertiary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-expanded={expanded}
            aria-label={isFR ? "Détails" : "Details"}
          >
            <ChevronDown
              size={12}
              strokeWidth={1.5}
              className={`transition-transform ${expanded ? "rotate-180" : ""}`}
            />
          </button>
        </div>
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
              data-dashboard-stop-nav
            >
              <p className="mt-2 text-[11px] leading-snug text-text-secondary text-left">{story}</p>
              {actionLabel && (
                <span className="mt-2 inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.15em] text-accent-primary">
                  {actionLabel} <ArrowUpRight size={10} strokeWidth={1.5} />
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ── Desktop / full — whole card navigates to the related page ─────────────
  return (
    <NeuralCard
      variant="premium"
      glow="warm"
      role="link"
      tabIndex={0}
      onClick={goToPage}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          goToPage();
        }
      }}
      className={cn(
        "flex min-h-[132px] cursor-pointer flex-col gap-2 transition-transform duration-200 hover:-translate-y-0.5 active:scale-[0.99]",
        borderClass,
      )}
      aria-label={actionLabel ? `${label} — ${actionLabel}` : label}
    >
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
      <span className="mt-auto inline-flex items-center gap-1 self-start text-[10px] uppercase tracking-[0.12em] text-accent-primary">
        {actionLabel ?? (isFR ? "Voir" : "View")} <ArrowUpRight size={10} strokeWidth={1.5} aria-hidden />
      </span>
    </NeuralCard>
  );
};

export const NarrativeKPICard = memo(NarrativeKPICardBase);
