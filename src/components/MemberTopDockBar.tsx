import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Moon, Sun, Languages, LogOut, Orbit } from "lucide-react";
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
  const [expanded, setExpanded] = useState(false);
  const [pinned, setPinned] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    applyTheme(dark);
  }, [dark]);

  useEffect(() => {
    if (!pinned) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setPinned(false);
        setExpanded(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [pinned]);

  const toggleTheme = () => setDark((prev) => !prev);
  const toggleLanguage = () => setLocale(locale === "fr" ? "en" : "fr");

  const open = () => setExpanded(true);
  const close = () => {
    if (!pinned) setExpanded(false);
  };
  const togglePin = () => {
    setPinned((wasPinned) => {
      const next = !wasPinned;
      setExpanded(next);
      return next;
    });
  };

  const actionClass =
    "inline-flex h-9 w-9 sm:h-11 sm:w-11 min-h-[36px] min-w-[36px] sm:min-h-[44px] sm:min-w-[44px] shrink-0 items-center justify-center rounded-lg sm:rounded-xl text-muted-foreground/80 hover:bg-bg-elevated/70 hover:text-foreground transition-colors active:scale-[0.98]";

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
      <motion.div
        ref={rootRef}
        className={cn(
          "pointer-events-auto relative flex items-center overflow-hidden border border-border/25 bg-[hsl(var(--background)/0.8)] shadow-[0_8px_24px_hsl(0_0%_0%/0.2)] backdrop-blur-[14px]",
          expanded ? "gap-0.5 rounded-xl p-0.5 sm:gap-1 sm:rounded-2xl sm:p-1" : "rounded-full",
        )}
        initial={false}
        animate={
          expanded
            ? { width: "auto", height: "auto", paddingLeft: 4, paddingRight: 4 }
            : { width: 36, height: 36, paddingLeft: 0, paddingRight: 0 }
        }
        transition={{ type: "spring", stiffness: 420, damping: 32, mass: 0.7 }}
        onMouseEnter={open}
        onMouseLeave={close}
        onFocusCapture={open}
        onBlurCapture={(e) => {
          if (!rootRef.current?.contains(e.relatedTarget as Node | null)) close();
        }}
      >
        <AnimatePresence initial={false} mode="popLayout">
          {!expanded ? (
            <motion.button
              key="dot"
              type="button"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.15 }}
              onClick={togglePin}
              aria-expanded={false}
              aria-label={t("nav.topDockExpand")}
              title={t("nav.topDockExpand")}
              className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full"
              style={{ WebkitTapHighlightColor: "transparent", touchAction: "manipulation" }}
            >
              <span
                className="h-2 w-2 rounded-full bg-[#c9a24b] shadow-[0_0_10px_rgba(201,162,75,0.55)]"
                aria-hidden
              />
            </motion.button>
          ) : (
            <motion.div
              key="actions"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.18 }}
              className="flex items-center gap-0.5 sm:gap-1"
            >
              <button
                type="button"
                onClick={togglePin}
                aria-expanded
                aria-label={t("nav.topDockCollapse")}
                title={t("nav.topDockCollapse")}
                className="inline-flex h-9 w-7 sm:h-11 sm:w-8 shrink-0 items-center justify-center rounded-lg sm:rounded-xl text-muted-foreground/70 hover:bg-bg-elevated/70 hover:text-foreground transition-colors cursor-pointer"
                style={{ WebkitTapHighlightColor: "transparent", touchAction: "manipulation" }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full bg-[#c9a24b] shadow-[0_0_8px_rgba(201,162,75,0.45)]"
                  aria-hidden
                />
              </button>

              <Link
                to="/welcome"
                aria-label={t("nav.welcome")}
                title={t("nav.welcome")}
                className={actionClass}
                style={{ WebkitTapHighlightColor: "transparent", touchAction: "manipulation" }}
              >
                <Orbit size={15} strokeWidth={1.5} className="text-[#c9a24b] sm:w-[17px] sm:h-[17px]" />
              </Link>

              <button
                type="button"
                onClick={toggleTheme}
                aria-label={t("settings.theme")}
                title={dark ? "Activer le mode clair" : "Activer le mode sombre"}
                className={cn(actionClass, "cursor-pointer")}
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

              <button
                type="button"
                onClick={toggleLanguage}
                aria-label={`Langue actuelle: ${locale.toUpperCase()}. Cliquer pour basculer`}
                title={locale === "fr" ? "Switch to English" : "Passer en Français"}
                className="inline-flex h-9 min-w-[38px] sm:h-11 sm:min-w-[50px] shrink-0 cursor-pointer items-center justify-center gap-1 sm:gap-1.5 rounded-lg sm:rounded-xl px-1.5 sm:px-2 text-muted-foreground/80 hover:bg-bg-elevated/70 hover:text-foreground transition-colors active:scale-[0.98]"
                style={{ WebkitTapHighlightColor: "transparent", touchAction: "manipulation" }}
              >
                <Languages size={14} strokeWidth={1.5} className="sm:w-[15px] sm:h-[15px]" />
                <span className="font-cinzel text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-foreground">
                  {locale}
                </span>
              </button>

              <div className="mx-0.5 h-4 w-px bg-border/40 sm:h-5" aria-hidden="true" />

              <button
                type="button"
                onClick={onLogout}
                aria-label={t("nav.logout")}
                title={t("nav.logout")}
                className={cn(
                  actionClass,
                  "cursor-pointer hover:bg-destructive/12 hover:text-destructive",
                )}
                style={{ WebkitTapHighlightColor: "transparent", touchAction: "manipulation" }}
              >
                <LogOut size={15} strokeWidth={1.5} className="sm:w-[17px] sm:h-[17px]" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </aside>
  );
}
