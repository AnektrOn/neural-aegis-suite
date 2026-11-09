import { motion } from "framer-motion";
import { MemberSplitLayout } from "@/layouts/MemberSplitLayout";
import {
  Smartphone,
  Apple,
  MonitorSmartphone,
  Share,
  MoreVertical,
  Plus,
  ArrowLeft,
  Sparkles,
  Zap,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function InstallApp() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [platform, setPlatform] = useState<"all" | "ios" | "android">("all");

  const leftPane = (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2.5 rounded-xl border border-white/5 bg-white/5 text-muted-foreground hover:text-foreground hover:border-white/15 transition-all cursor-pointer"
          title="Retour"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <p className="font-cinzel text-[10.5px] font-semibold tracking-[0.24em] uppercase text-[#9e7828] dark:text-[#c9a24b] mb-1 flex items-center gap-1.5">
            <Sparkles size={11} className="text-[#c9a24b]" />
            <span>ACCÈS SOUVERAIN · EXPÉRIENCE NATIVE</span>
          </p>
          <h1 className="font-cormorant text-3xl sm:text-4xl lg:text-5xl font-light text-foreground tracking-tight flex items-center gap-2.5">
            <Smartphone size={30} strokeWidth={1.2} className="text-[#c9a24b] shrink-0" />
            <span>{t("install.title")}</span>
          </h1>
        </div>
      </div>

      <p className="font-sans text-xs sm:text-sm text-muted-foreground max-w-xl leading-relaxed">
        {t("install.subtitle")}
      </p>

      {/* Plateforme Selector */}
      <div className="flex items-center gap-1.5 pt-1">
        {(
          [
            { key: "all", label: "Toutes les plateformes" },
            { key: "ios", label: "Apple iOS", icon: Apple },
            { key: "android", label: "Google Android", icon: Smartphone },
          ] as const
        ).map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setPlatform(item.key)}
            className={cn(
              "font-cinzel text-[9.5px] font-semibold uppercase tracking-[0.14em] px-3.5 py-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5",
              platform === item.key
                ? "border-[#c9a24b]/60 bg-[#c9a24b]/20 text-[#c9a24b] shadow-sm font-semibold"
                : "border-white/5 bg-black/25 text-muted-foreground hover:border-white/15 hover:text-foreground",
            )}
          >
            {item.icon && <item.icon size={12} />}
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Sovereign App Specs */}
      <div className="aegis-dock-tile p-6 sm:p-7 space-y-5 rounded-2xl border border-[rgba(233,228,216,0.1)] shadow-[0_12px_44px_rgba(0,0,0,0.35)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-44 h-44 bg-[radial-gradient(circle,rgba(201,162,75,0.18)_0%,transparent_70%)] pointer-events-none" />

        <div className="flex items-center justify-between gap-3 relative z-10">
          <span className="font-cinzel text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c9a24b]">
            CARACTÉRISTIQUES DU NOYAU
          </span>
          <span className="font-mono text-[9px] uppercase tracking-widest px-2.5 py-0.5 rounded-full border border-white/10 bg-black/40 text-[#c9a24b]">
            PWA STANDALONE
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 relative z-10">
          <div className="p-3.5 rounded-xl border border-white/5 bg-black/30 space-y-1">
            <Zap size={15} className="text-[#c9a24b]" />
            <p className="font-cinzel text-[10px] font-semibold text-foreground uppercase tracking-wider">
              Latence Zéro
            </p>
            <p className="text-[11px] text-muted-foreground">Exécution immédiate à 60 FPS sans téléchargement d&apos;App Store</p>
          </div>
          <div className="p-3.5 rounded-xl border border-white/5 bg-black/30 space-y-1">
            <ShieldCheck size={15} className="text-[#c9a24b]" />
            <p className="font-cinzel text-[10px] font-semibold text-foreground uppercase tracking-wider">
              Chiffrement
            </p>
            <p className="text-[11px] text-muted-foreground">Données biométriques et jetons sécurisés dans l&apos;enclave locale</p>
          </div>
        </div>

        <div className="pt-1 text-xs text-muted-foreground relative z-10 flex items-center gap-2">
          <CheckCircle2 size={13} className="text-[#c9a24b] shrink-0" />
          <span>Synchronisation automatique et mises à jour transparentes en arrière-plan</span>
        </div>
      </div>
    </div>
  );

  const rightPane = (
    <div className="space-y-5">
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5">
        <p className="font-cinzel text-[10.5px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          PROTOCOLE D&apos;INSTALLATION PAS-À-PAS
        </p>
        <span className="font-mono text-xs text-muted-foreground">Guide instantané</span>
      </div>

      {/* iOS Protocol */}
      {(platform === "all" || platform === "ios") && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="aegis-dock-tile p-6 sm:p-7 space-y-4 rounded-2xl border border-[rgba(233,228,216,0.1)] shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#c9a24b]/15 border border-[#c9a24b]/30 flex items-center justify-center text-[#c9a24b] shrink-0">
              <Apple size={20} />
            </div>
            <div>
              <h2 className="font-cinzel text-sm font-semibold tracking-wide text-foreground">
                {t("install.iosTitle")}
              </h2>
              <p className="font-mono text-[10.5px] text-muted-foreground">Navigateur Safari recommandé</p>
            </div>
          </div>

          <ol className="space-y-3.5 text-xs text-muted-foreground font-sans">
            <li className="flex items-start gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-[#c9a24b]/20 text-[#c9a24b] font-mono text-xs flex items-center justify-center font-semibold border border-[#c9a24b]/30">
                1
              </span>
              <span className="mt-0.5">{t("install.iosStep1")}</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-[#c9a24b]/20 text-[#c9a24b] font-mono text-xs flex items-center justify-center font-semibold border border-[#c9a24b]/30">
                2
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span>{t("install.iosStep2")}</span>
                <span className="inline-flex p-1 rounded-md bg-white/10 text-foreground">
                  <Share size={12} className="text-[#c9a24b] shrink-0" />
                </span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-[#c9a24b]/20 text-[#c9a24b] font-mono text-xs flex items-center justify-center font-semibold border border-[#c9a24b]/30">
                3
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span>{t("install.iosStep3")}</span>
                <span className="inline-flex p-1 rounded-md bg-white/10 text-foreground">
                  <Plus size={12} className="text-[#c9a24b] shrink-0" />
                </span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-[#c9a24b]/20 text-[#c9a24b] font-mono text-xs flex items-center justify-center font-semibold border border-[#c9a24b]/30">
                4
              </span>
              <span className="mt-0.5">{t("install.iosStep4")}</span>
            </li>
          </ol>
        </motion.div>
      )}

      {/* Android Protocol */}
      {(platform === "all" || platform === "android") && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="aegis-dock-tile p-6 sm:p-7 space-y-4 rounded-2xl border border-[rgba(233,228,216,0.1)] shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Smartphone size={20} />
            </div>
            <div>
              <h2 className="font-cinzel text-sm font-semibold tracking-wide text-foreground">
                {t("install.androidTitle")}
              </h2>
              <p className="font-mono text-[10.5px] text-muted-foreground">Navigateur Chrome / Brave recommandé</p>
            </div>
          </div>

          <ol className="space-y-3.5 text-xs text-muted-foreground font-sans">
            <li className="flex items-start gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-mono text-xs flex items-center justify-center font-semibold border border-amber-500/30">
                1
              </span>
              <span className="mt-0.5">{t("install.androidStep1")}</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-mono text-xs flex items-center justify-center font-semibold border border-amber-500/30">
                2
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span>{t("install.androidStep2")}</span>
                <span className="inline-flex p-1 rounded-md bg-white/10 text-foreground">
                  <MoreVertical size={12} className="text-amber-400 shrink-0" />
                </span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-mono text-xs flex items-center justify-center font-semibold border border-amber-500/30">
                3
              </span>
              <span className="mt-0.5">{t("install.androidStep3")}</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-mono text-xs flex items-center justify-center font-semibold border border-amber-500/30">
                4
              </span>
              <span className="mt-0.5">{t("install.androidStep4")}</span>
            </li>
          </ol>
        </motion.div>
      )}

      {/* Desktop / Laptop Advisory */}
      <div className="aegis-dock-tile p-4 sm:p-5 rounded-2xl border border-white/5 flex items-start gap-3">
        <MonitorSmartphone size={18} className="text-[#c9a24b] shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">{t("install.tip")}</p>
      </div>
    </div>
  );

  return <MemberSplitLayout left={leftPane} right={rightPane} scrollLeft={true} />;
}
