import { useLanguage } from "@/i18n/LanguageContext";
import { Languages } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function LanguageSwitcher({ collapsed = false }: { collapsed?: boolean }) {
  const { locale, setLocale } = useLanguage();

  return (
    <button
      onClick={() => setLocale(locale === "fr" ? "en" : "fr")}
      className="mx-3 flex items-center gap-3 px-3 py-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/30 transition-colors"
      title={locale === "fr" ? "Switch to English" : "Passer en français"}
    >
      <Languages size={16} className="shrink-0" />
      <AnimatePresence>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-[9px] uppercase tracking-[0.3em] font-medium"
          >
            {locale === "fr" ? "EN" : "FR"}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
