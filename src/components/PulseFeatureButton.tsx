import { NavLink } from "react-router-dom";
import { Sparkles, ArrowUpRight } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

/** Entrée Dashboard vers la feature Pulse Cards. */
export default function PulseFeatureButton({ className = "" }: { className?: string }) {
  const { t } = useLanguage();

  return (
    <NavLink
      to="/pulse"
      aria-label={t("pulseAnnounce.cta")}
      className={`group flex items-center gap-3 rounded-2xl border border-accent-primary/25 bg-accent-primary/[0.07] px-4 py-3.5 no-underline transition-colors hover:bg-accent-primary/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${className}`}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-accent-primary/30 bg-accent-primary/10">
        <Sparkles size={16} strokeWidth={1.25} className="text-accent-primary" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-[11px] uppercase tracking-[0.15em] text-accent-primary">
          {t("pulseAnnounce.title")}
        </span>
        <span className="mt-0.5 block truncate text-sm text-text-tertiary">
          {t("pulseAnnounce.body")}
        </span>
      </span>
      <ArrowUpRight size={16} strokeWidth={1.5} className="shrink-0 text-accent-primary" aria-hidden />
    </NavLink>
  );
}
