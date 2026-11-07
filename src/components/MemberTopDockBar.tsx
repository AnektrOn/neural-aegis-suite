import { useEffect, useState } from "react";
import { Moon, Sun, Languages, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";
import { applyTheme, getStoredThemeIsDark } from "@/lib/theme";
import { cn } from "@/lib/utils";

export interface MemberTopDockBarProps {
  onLogout?: () => void;
  online?: boolean;
  className?: string;
}

export function MemberTopDockBar({
  onLogout,
  online = true,
  className,
}: MemberTopDockBarProps) {
  const { locale, setLocale, t } = useLanguage();
  const [dark, setDark] = useState(getStoredThemeIsDark);

  useEffect(() => {
    applyTheme(dark);
  }, [dark]);

  const toggleTheme = () => setDark((prev) => !prev);
  const toggleLanguage = () => setLocale(locale === "fr" ? "en" : "fr");

  return (
    <aside
      aria-label="Actions rapides du membre"
      className={cn(
        "pointer-events-none fixed right-3 sm:right-6 z-[60] flex items-center justify-end",
        className,
      )}
      style={{
        top: !online
          ? "calc(max(0.75rem, var(--safe-top)) + 2rem)"
          : "max(0.75rem, var(--safe-top))",
      }}
    >
      <div className="pointer-events-auto flex items-center gap-0.5 sm:gap-1 rounded-xl sm:rounded-2xl border border-border/25 bg-[hsl(var(--background)/0.8)] p-0.5 sm:p-1 shadow-[0_8px_24px_hsl(0_0%_0%/0.2)] backdrop-blur-[14px] transition-all">
        {/* 1. Theme toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={t("settings.theme")}
          title={dark ? "Activer le mode clair" : "Activer le mode sombre"}
          className="inline-flex h-9 w-9 sm:h-11 sm:w-11 min-h-[36px] min-w-[36px] sm:min-h-[44px] sm:min-w-[44px] shrink-0 items-center justify-center rounded-lg sm:rounded-xl text-muted-foreground/80 hover:bg-bg-elevated/70 hover:text-foreground transition-colors active:scale-[0.98] cursor-pointer"
          style={{ WebkitTapHighlightColor: "transparent", touchAction: "manipulation" }}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={dark ? "moon" : "sun"}
              initial={{ rotate: -90, opacity: 0, scale: 0.8 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 90, opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-center"
            >
              {dark ? (
                <Moon size={16} strokeWidth={1.5} className="text-[#c9a24b] sm:w-[18px] sm:h-[18px]" />
              ) : (
                <Sun size={16} strokeWidth={1.5} className="text-[#c9a24b] sm:w-[18px] sm:h-[18px]" />
              )}
            </motion.div>
          </AnimatePresence>
        </button>

        {/* 2. Language toggle */}
        <button
          type="button"
          onClick={toggleLanguage}
          aria-label={`Langue actuelle: ${locale.toUpperCase()}. Cliquer pour basculer`}
          title={locale === "fr" ? "Switch to English" : "Passer en Français"}
          className="inline-flex h-9 min-w-[38px] sm:h-11 sm:min-w-[50px] shrink-0 items-center justify-center gap-1 sm:gap-1.5 rounded-lg sm:rounded-xl px-1.5 sm:px-2 text-muted-foreground/80 hover:bg-bg-elevated/70 hover:text-foreground transition-colors active:scale-[0.98] cursor-pointer"
          style={{ WebkitTapHighlightColor: "transparent", touchAction: "manipulation" }}
        >
          <Languages size={14} strokeWidth={1.5} className="sm:w-[15px] sm:h-[15px]" />
          <span className="font-cinzel text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-foreground">
            {locale}
          </span>
        </button>

        {/* Hairline separator */}
        <div className="h-4 sm:h-5 w-[1px] bg-border/40 mx-0.5" aria-hidden="true" />

        {/* 3. Logout button */}
        <button
          type="button"
          onClick={onLogout}
          aria-label={t("nav.logout")}
          title={t("nav.logout")}
          className="inline-flex h-9 w-9 sm:h-11 sm:w-11 min-h-[36px] min-w-[36px] sm:min-h-[44px] sm:min-w-[44px] shrink-0 items-center justify-center rounded-lg sm:rounded-xl text-muted-foreground/80 hover:bg-destructive/12 hover:text-destructive transition-colors active:scale-[0.98] cursor-pointer"
          style={{ WebkitTapHighlightColor: "transparent", touchAction: "manipulation" }}
        >
          <LogOut size={15} strokeWidth={1.5} className="sm:w-[17px] sm:h-[17px]" />
        </button>
      </div>
    </aside>
  );
}
