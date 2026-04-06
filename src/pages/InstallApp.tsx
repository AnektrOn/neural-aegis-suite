import { motion } from "framer-motion";
import { Smartphone, Apple, MonitorSmartphone, Share, MoreVertical, Plus, ArrowLeft } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useNavigate } from "react-router-dom";

export default function InstallApp() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-secondary/50 text-muted-foreground">
          <ArrowLeft size={18} />
        </button>
        <div>
          <p className="text-neural-label mb-1">{t("install.subtitle")}</p>
          <h1 className="text-neural-title text-2xl text-foreground">{t("install.title")}</h1>
        </div>
      </div>

      {/* iOS */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="ethereal-glass p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Apple size={20} className="text-primary" />
          </div>
          <h2 className="text-base font-medium text-foreground">{t("install.iosTitle")}</h2>
        </div>
        <ol className="space-y-3 text-sm text-muted-foreground">
          <li className="flex items-start gap-3">
            <span className="shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">1</span>
            <span>{t("install.iosStep1")}</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">2</span>
            <div className="flex items-center gap-2">
              <span>{t("install.iosStep2")}</span>
              <Share size={14} className="text-primary shrink-0" />
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">3</span>
            <div className="flex items-center gap-2">
              <span>{t("install.iosStep3")}</span>
              <Plus size={14} className="text-primary shrink-0" />
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">4</span>
            <span>{t("install.iosStep4")}</span>
          </li>
        </ol>
      </motion.div>

      {/* Android */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="ethereal-glass p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/30 border border-accent/40 flex items-center justify-center">
            <Smartphone size={20} className="text-accent-foreground" />
          </div>
          <h2 className="text-base font-medium text-foreground">{t("install.androidTitle")}</h2>
        </div>
        <ol className="space-y-3 text-sm text-muted-foreground">
          <li className="flex items-start gap-3">
            <span className="shrink-0 w-6 h-6 rounded-full bg-accent/20 text-accent-foreground text-xs flex items-center justify-center font-medium">1</span>
            <span>{t("install.androidStep1")}</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="shrink-0 w-6 h-6 rounded-full bg-accent/20 text-accent-foreground text-xs flex items-center justify-center font-medium">2</span>
            <div className="flex items-center gap-2">
              <span>{t("install.androidStep2")}</span>
              <MoreVertical size={14} className="text-accent-foreground shrink-0" />
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="shrink-0 w-6 h-6 rounded-full bg-accent/20 text-accent-foreground text-xs flex items-center justify-center font-medium">3</span>
            <span>{t("install.androidStep3")}</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="shrink-0 w-6 h-6 rounded-full bg-accent/20 text-accent-foreground text-xs flex items-center justify-center font-medium">4</span>
            <span>{t("install.androidStep4")}</span>
          </li>
        </ol>
      </motion.div>

      {/* Tip */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10">
        <MonitorSmartphone size={18} className="text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">{t("install.tip")}</p>
      </motion.div>
    </div>
  );
}
