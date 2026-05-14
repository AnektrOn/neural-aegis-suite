import { motion } from "framer-motion";
import { Settings2 } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import PushNotificationToggle from "@/components/PushNotificationToggle";
import { useLanguage } from "@/i18n/LanguageContext";

export default function Settings() {
  const { t } = useLanguage();

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <div>
        <p className="text-neural-label mb-3">{t("settings.sectionLabel")}</p>
        <h1 className="text-neural-title text-3xl text-foreground">{t("settings.title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("settings.subtitle")}</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="ethereal-glass space-y-6 p-8"
      >
        <div className="flex items-center gap-3 border-b border-border/30 pb-4">
          <Settings2 size={20} strokeWidth={1.5} className="text-primary" />
          <p className="text-neural-label">{t("settings.appearance")}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm text-muted-foreground">{t("settings.theme")}</span>
          <div className="rounded-xl border border-border/20 bg-secondary/10 p-1">
            <ThemeToggle collapsed={false} />
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm text-muted-foreground">{t("settings.language")}</span>
          <div className="rounded-xl border border-border/20 bg-secondary/10 p-1">
            <LanguageSwitcher collapsed={false} />
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06 }}
        className="ethereal-glass space-y-4 p-8"
      >
        <p className="text-neural-label">{t("settings.notifications")}</p>
        <PushNotificationToggle className="w-full justify-center sm:justify-start" />
      </motion.div>
    </div>
  );
}
