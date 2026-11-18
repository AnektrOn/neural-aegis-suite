import { Moon, Sun } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useTheme, type ThemeMode } from "@/lib/theme";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  compact?: boolean;
};

export function ThemeToggle({ className, compact = false }: Props) {
  const { theme, setTheme } = useTheme();
  const { t } = useLanguage();

  const options: { id: ThemeMode; label: string; icon: typeof Sun }[] = [
    { id: "light", label: t("settings.themeLight"), icon: Sun },
    { id: "dark", label: t("settings.themeDark"), icon: Moon },
  ];

  return (
    <div
      className={cn(
        "inline-flex rounded-xl border border-border bg-muted/40 p-1 dark:border-white/10 dark:bg-black/20",
        className,
      )}
      role="group"
      aria-label={t("settings.theme")}
    >
      {options.map(({ id, label, icon: Icon }) => {
        const active = theme === id;
        return (
          <button
            key={id}
            type="button"
            aria-pressed={active}
            onClick={() => setTheme(id)}
            className={cn(
              "inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg px-3 font-cinzel text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors",
              compact ? "min-w-[44px] px-2.5" : "min-w-[5.5rem]",
              active
                ? "bg-foreground text-background shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} aria-hidden />
            {!compact ? <span>{label}</span> : <span className="sr-only">{label}</span>}
          </button>
        );
      })}
    </div>
  );
}