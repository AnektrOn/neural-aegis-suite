import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Brain,
  Target,
  ListChecks,
  Users,
  PenLine,
  ArrowUpRight,
  type LucideIcon,
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import type { TranslationKey } from "@/i18n/translations";
import { panelsForHub } from "@/lib/userMenuCatalog";
import { isPanelVisible } from "@/lib/userMenuPreferences";
import { useUserMenuPrefs } from "@/hooks/useUserMenuPrefs";
import type { MenuPanelId } from "@/lib/userMenuCatalog";
import { cn } from "@/lib/utils";

type CapturePanel = {
  id: string;
  to: string;
  icon: LucideIcon;
  nameKey: TranslationKey;
};

const CAPTURE_PANELS: CapturePanel[] = panelsForHub("capture").map((p) => ({
  id: p.id,
  to: p.to,
  icon: p.icon,
  nameKey: p.labelKey,
}));

export default function CaptureHub() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { prefs } = useUserMenuPrefs();
  const visible = CAPTURE_PANELS.filter((p) => isPanelVisible(prefs, p.id as MenuPanelId));

  return (
    <div className="mx-auto w-full max-w-5xl space-y-10 px-4 py-8 sm:px-6">
      <header className="space-y-2">
        <p className="font-display text-[10px] uppercase tracking-[0.25em] text-accent-primary/70">
          {t("menu.hub.captureKicker")}
        </p>
        <h1 className="font-display text-3xl text-foreground sm:text-4xl">{t("menu.hub.capture")}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">{t("menu.hub.captureSubtitle")}</p>
      </header>

      <section className="space-y-4">
        <h2 className="font-display text-[11px] uppercase tracking-[0.22em] text-muted-foreground/70">
          {t("menu.hub.capturePanels")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((f) => (
            <motion.div
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
              <p className="font-display text-sm uppercase tracking-[0.15em] text-foreground">{t(f.nameKey)}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
