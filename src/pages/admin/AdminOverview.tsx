import { Link } from "react-router-dom";
import { ChevronRight, Zap } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { ADMIN_OVERVIEW_SECTIONS, firstRouteInSection } from "@/lib/adminNavConfig";
import { cn } from "@/lib/utils";

export default function AdminOverview() {
  const { t } = useLanguage();

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-accent-warning/25 bg-accent-warning/15">
            <Zap size={18} strokeWidth={1.5} className="text-accent-warning" />
          </div>
          <div>
            <p className="text-neural-label text-neural-accent/60">{t("admin.overview.kicker")}</p>
            <h1 className="text-neural-title text-2xl text-foreground md:text-3xl">{t("admin.overview.title")}</h1>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{t("admin.overview.subtitle")}</p>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:gap-4">
        {ADMIN_OVERVIEW_SECTIONS.map((section) => {
          const Icon = section.icon;
          const to = firstRouteInSection(section);
          return (
            <Link
              key={section.id}
              to={to}
              className={cn(
                "group flex min-h-[72px] items-center gap-4 rounded-xl border border-border-subtle bg-bg-surface p-4",
                "transition-colors duration-200 hover:border-accent-warning/30 hover:bg-bg-elevated",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-warning/40",
              )}
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border-subtle bg-bg-elevated group-hover:border-accent-warning/25">
                <Icon size={20} strokeWidth={1.5} className="text-accent-warning" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">{t(section.overviewKey)}</p>
                <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">{t(section.overviewDescKey)}</p>
              </div>
              <ChevronRight
                size={18}
                strokeWidth={1.5}
                className="shrink-0 text-text-tertiary transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-accent-warning"
                aria-hidden
              />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
