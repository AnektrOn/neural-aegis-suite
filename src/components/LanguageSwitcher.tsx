import { useLanguage } from "@/i18n/LanguageContext";
import { Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function LanguageSwitcher({ collapsed = false }: { collapsed?: boolean }) {
  const { locale, setLocale } = useLanguage();
  const nextLocale = locale === "fr" ? "en" : "fr";

  return (
    <button
      onClick={() => setLocale(nextLocale)}
      className="mx-3 flex items-center gap-3 px-3 py-3 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-all duration-200 group"
      title={locale === "fr" ? "Switch to English" : "Passer en français"}
    >
      <div className="relative shrink-0 w-4 h-4">
        <Globe size={16} strokeWidth={1.5} className="absolute inset-0 transition-transform duration-300 group-hover:rotate-[30deg]" />
      </div>
      <AnimatePresence mode="wait">
        {!collapsed && (
          <motion.div
            key={locale}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2"
          >
            <span className="text-[9px] uppercase tracking-[0.3em] font-medium">
              {locale === "fr" ? "FR" : "EN"}
            </span>
            <span className="text-[8px] text-text-tertiary">→</span>
            <span className="text-[9px] uppercase tracking-[0.12em] font-medium text-accent-primary/60 group-hover:text-accent-primary transition-colors font-display">
              {nextLocale.toUpperCase()}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}
