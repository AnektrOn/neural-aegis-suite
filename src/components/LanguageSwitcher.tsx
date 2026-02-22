import { useLanguage } from "@/i18n/LanguageContext";
import { Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function LanguageSwitcher({ collapsed = false }: { collapsed?: boolean }) {
  const { locale, setLocale } = useLanguage();
  const nextLocale = locale === "fr" ? "en" : "fr";

  return (
    <button
      onClick={() => setLocale(nextLocale)}
      className="mx-3 flex items-center gap-3 px-3 py-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/30 transition-all duration-300 group"
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
            <span className="text-[8px] text-muted-foreground/40">→</span>
            <span className="text-[9px] uppercase tracking-[0.3em] font-medium text-primary/60 group-hover:text-primary transition-colors">
              {nextLocale.toUpperCase()}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}
