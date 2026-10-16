import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ListChecks,
  Headphones,
  Sparkles,
  Flower2,
  ScanFace,
  Pin,
  PinOff,
  ArrowUpRight,
  type LucideIcon,
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useHubMenuFeature, type HubFeatureId } from "@/hooks/useHubMenuFeature";
import type { TranslationKey } from "@/i18n/translations";
import { cn } from "@/lib/utils";

type AvailableFeature = {
  id: HubFeatureId;
  to: string;
  icon: LucideIcon;
  nameKey: TranslationKey;
  descKey: TranslationKey;
};

const AVAILABLE_FEATURES: AvailableFeature[] = [
  { id: "habits", to: "/habits", icon: ListChecks, nameKey: "nav.habits", descKey: "hub.feature.habits.desc" },
  { id: "toolbox", to: "/toolbox", icon: Headphones, nameKey: "nav.toolbox", descKey: "hub.feature.toolbox.desc" },
  { id: "pulse", to: "/pulse", icon: Sparkles, nameKey: "nav.pulse", descKey: "hub.feature.pulse.desc" },
];

type SoonFeature = {
  icon: LucideIcon;
  nameKey: TranslationKey;
  descKey: TranslationKey;
};

const COMING_SOON_FEATURES: SoonFeature[] = [
  { icon: Flower2, nameKey: "nav.meditation", descKey: "hub.feature.meditation.desc" },
  { icon: ScanFace, nameKey: "hub.feature.dienchan", descKey: "hub.feature.dienchan.desc" },
];

export default function PracticesHub() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { feature: pinned, setFeature } = useHubMenuFeature();

  return (
    <div className="mx-auto w-full max-w-5xl space-y-10 px-4 py-8 sm:px-6">
      <header className="space-y-2">
        <p className="font-display text-[10px] uppercase tracking-[0.25em] text-accent-primary/70">
          {t("hub.kicker")}
        </p>
        <h1 className="font-display text-3xl text-foreground sm:text-4xl">{t("hub.title")}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">{t("hub.subtitle")}</p>
      </header>

      <section className="space-y-4">
        <h2 className="font-display text-[11px] uppercase tracking-[0.22em] text-muted-foreground/70">
          {t("hub.available")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {AVAILABLE_FEATURES.map((f) => {
            const isPinned = pinned === f.id;
            return (
              <div
                key={f.id}
                role="link"
                tabIndex={0}
                aria-label={t(f.nameKey)}
                onClick={() => navigate(f.to)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigate(f.to);
                  }
                }}
                className={cn(
                  "group relative flex cursor-pointer flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-3xl transition-all duration-300",
                  "hover:border-accent-primary/40 hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isPinned && "border-accent-primary/40",
                )}
              >
                <div className="flex items-start justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full border border-accent-primary/25 bg-accent-primary/10">
                    <f.icon size={20} strokeWidth={1.25} className="text-accent-primary" aria-hidden />
                  </span>
                  <ArrowUpRight
                    size={16}
                    strokeWidth={1.5}
                    className="text-muted-foreground/50 transition-colors group-hover:text-accent-primary"
                    aria-hidden
                  />
                </div>
                <div className="space-y-1">
                  <p className="font-display text-sm uppercase tracking-[0.15em] text-foreground">
                    {t(f.nameKey)}
                  </p>
                  <p className="text-sm text-muted-foreground">{t(f.descKey)}</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    void setFeature(isPinned ? null : f.id);
                  }}
                  aria-pressed={isPinned}
                  className={cn(
                    "mt-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 text-xs uppercase tracking-wider transition-colors",
                    isPinned
                      ? "border-accent-primary/50 bg-accent-primary/15 text-accent-primary"
                      : "border-white/10 bg-white/[0.03] text-muted-foreground hover:border-accent-primary/30 hover:text-foreground",
                  )}
                >
                  {isPinned ? (
                    <PinOff size={14} strokeWidth={1.5} aria-hidden />
                  ) : (
                    <Pin size={14} strokeWidth={1.5} aria-hidden />
                  )}
                  {isPinned ? t("hub.unpin") : t("hub.pin")}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-[11px] uppercase tracking-[0.22em] text-muted-foreground/70">
          {t("hub.comingSoon")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {COMING_SOON_FEATURES.map((f, i) => (
            <motion.div
              key={f.nameKey}
              aria-disabled="true"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: i * 0.6 }}
              className="relative flex cursor-not-allowed flex-col gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-5 opacity-60 backdrop-blur-3xl select-none"
            >
              <span className="absolute right-4 top-4 rounded-full border border-accent-primary/30 bg-accent-primary/10 px-2.5 py-1 font-display text-[9px] uppercase tracking-[0.2em] text-accent-primary">
                {t("hub.comingSoon")}
              </span>
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
                <f.icon size={20} strokeWidth={1.25} className="text-muted-foreground" aria-hidden />
              </span>
              <div className="space-y-1">
                <p className="font-display text-sm uppercase tracking-[0.15em] text-muted-foreground">
                  {t(f.nameKey)}
                </p>
                <p className="text-sm text-muted-foreground/70">{t(f.descKey)}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
