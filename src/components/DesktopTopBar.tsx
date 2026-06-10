import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { Plus, Search } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { getAppPageMeta } from "@/lib/appNavConfig";
import { cn } from "@/lib/utils";

type DesktopTopBarProps = {
  pathname: string;
  onOpenCommand: () => void;
  onQuickLog: () => void;
  className?: string;
};

export default function DesktopTopBar({
  pathname,
  onOpenCommand,
  onQuickLog,
  className,
}: DesktopTopBarProps) {
  const { t, locale } = useLanguage();
  const meta = getAppPageMeta(pathname);
  const isDashboard = pathname === "/";
  const dateLocale = locale === "fr" ? fr : enUS;
  const dateStr = format(new Date(), "EEEE d MMMM", { locale: dateLocale });

  return (
    <header
      className={cn(
        "sticky top-0 z-20 -mx-6 -mt-6 mb-6 flex items-center justify-between gap-4 border-b border-border/25 bg-bg-base/80 px-6 py-3 backdrop-blur-md md:-mx-10 md:-mt-10 md:px-10",
        className,
      )}
    >
      <div className="min-w-0">
        {meta.sectionKey ? (
          <p className="font-display text-[10px] uppercase tracking-[0.2em] text-text-tertiary/70">
            {t(meta.sectionKey)}
            <span className="mx-1.5 text-text-tertiary/40" aria-hidden>
              /
            </span>
            {t(meta.titleKey)}
          </p>
        ) : null}
        {!isDashboard ? (
          <h2 className="truncate font-cormorant text-xl font-light tracking-tight text-text-primary sm:text-2xl">
            {t(meta.titleKey)}
          </h2>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <p className="hidden font-display text-[10px] uppercase tracking-[0.18em] text-text-tertiary/60 xl:block">
          {dateStr}
        </p>
        <button
          type="button"
          onClick={onOpenCommand}
          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border/40 bg-bg-elevated/50 px-3 py-2 text-text-tertiary transition-colors hover:border-border-active hover:text-text-secondary"
          aria-label={t("layout.commandOpen")}
        >
          <Search size={15} strokeWidth={1.5} aria-hidden />
          <span className="hidden font-display text-[10px] uppercase tracking-[0.14em] sm:inline">
            {t("layout.commandOpen")}
          </span>
          <kbd className="hidden rounded border border-border/50 bg-bg-base/80 px-1.5 py-0.5 font-mono text-[10px] text-text-tertiary/80 md:inline">
            ⌘K
          </kbd>
        </button>
        <button
          type="button"
          onClick={onQuickLog}
          className="dashboard-cta dashboard-cta--inline inline-flex min-h-10 items-center gap-2 px-4 py-2 font-display text-[10px] uppercase tracking-[0.12em] text-text-primary"
          aria-label={t("dashboard.quickLogCta")}
        >
          <Plus size={15} strokeWidth={1.5} aria-hidden />
          <span className="hidden sm:inline">{t("dashboard.quickLogCta")}</span>
        </button>
      </div>
    </header>
  );
}
