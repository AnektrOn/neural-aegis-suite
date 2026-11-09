import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ListChecks,
  Headphones,
  Sparkles,
  Library,
  ScanFace,
  ArrowUpRight,
  ChevronRight,
  Flame,
  CheckCircle2,
  Clock,
  Play,
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { MemberPageScaffold } from "@/layouts/MemberPageScaffold";
import { MemberSplitLayout } from "@/layouts/MemberSplitLayout";
import { usePracticesHubData } from "@/features/practices-hub/hooks/usePracticesHubData";
import { PRACTICES_HUB_TILES } from "@/features/practices-hub/practicesHubTiles";
import {
  practicesHubTileDataLine,
  practicesHubTileMetric,
} from "@/features/practices-hub/practicesHubTileCopy";
import { PracticesHubArmillary } from "@/features/practices-hub/components/PracticesHubArmillary";
import { cn } from "@/lib/utils";

export default function PracticesHub() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { stats, loading, dailyScore } = usePracticesHubData();
  const [mobileTab, setMobileTab] = useState<"stations" | "cadence">("stations");

  const scoreMain = useMemo(() => {
    if (loading || !dailyScore) return "…";
    if (!dailyScore.hasItems) return "—";
    return `${dailyScore.done} / ${dailyScore.total}`;
  }, [loading, dailyScore]);

  const scorePct = useMemo(() => {
    if (!dailyScore || !dailyScore.hasItems || dailyScore.total === 0) return 0;
    return Math.round((dailyScore.done / dailyScore.total) * 100);
  }, [dailyScore]);

  // Suggested next practice
  const recommendedPractice = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      return {
        id: "habits",
        to: "/habits",
        title: "Discipline Matinale",
        desc: "Activez vos habitudes prioritaires pour donner l'impulsion du jour.",
        action: "Ouvrir les habitudes",
      };
    } else if (hour < 18) {
      return {
        id: "toolbox",
        to: "/toolbox",
        title: "Session Neurale de Milieu de Journée",
        desc: "Cohérence cardiaque ou scan corporel pour dissiper la fatigue cognitive.",
        action: "Lancer la boîte à outils",
      };
    } else {
      return {
        id: "pulse",
        to: "/pulse",
        title: "Assimilation du Soir",
        desc: "Tirez et assimilez vos cartes archétypales avant la transition nocturne.",
        action: "Ouvrir Aegis Pulse",
      };
    }
  }, []);

  const leftPane = (
    <div className="flex flex-col gap-5 h-full justify-between">
      {/* Header */}
      <div>
        <p className="font-cinzel text-[10.5px] font-semibold tracking-[0.26em] uppercase text-[#9e7828] dark:text-[#c9a24b] mb-1.5">
          CENTRE DE PRATIQUES · BIO-CADENCE
        </p>
        <h1 className="font-cormorant text-3xl sm:text-4xl lg:text-5xl font-light text-foreground tracking-tight">
          Protocoles Vivants
        </h1>
        <p className="font-sans text-sm text-muted-foreground mt-2 leading-relaxed">
          Activez vos routines, méditations et soins neuraux pour préserver votre alignement au fil de la journée.
        </p>
      </div>

      {/* Mobile Segmented Switcher (<lg) */}
      <div className="flex lg:hidden items-center p-1 rounded-xl bg-black/40 border border-white/10 backdrop-blur-md shadow-sm">
        <button
          type="button"
          onClick={() => setMobileTab("stations")}
          className={cn(
            "flex-1 py-2 px-2 rounded-lg text-xs font-cinzel uppercase tracking-[0.12em] font-medium transition-all text-center",
            mobileTab === "stations"
              ? "bg-[#c9a24b]/20 text-[#c9a24b] border border-[#c9a24b]/40 shadow-sm font-semibold"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          🧭 Stations (5)
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("cadence")}
          className={cn(
            "flex-1 py-2 px-2 rounded-lg text-xs font-cinzel uppercase tracking-[0.12em] font-medium transition-all text-center",
            mobileTab === "cadence"
              ? "bg-[#c9a24b]/20 text-[#c9a24b] border border-[#c9a24b]/40 shadow-sm font-semibold"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          ✨ Cadence & Sphère
        </button>
      </div>

      {/* Armillary Visual Stage & Daily Score */}
      <div className={cn("space-y-4 flex-1 flex flex-col justify-between", mobileTab !== "cadence" && "hidden lg:flex", "pb-[calc(var(--mobile-dock-padding,5rem)+1.5rem)] lg:pb-0")}>
        <div className="aegis-dock-tile relative rounded-2xl overflow-hidden h-[230px] sm:h-[270px] flex flex-col justify-end p-5 shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
          <div className="absolute inset-0 pointer-events-none opacity-85">
            <PracticesHubArmillary className="w-full h-full" />
          </div>

          <div className="relative z-10 p-4 rounded-xl backdrop-blur-md bg-black/35 border border-white/10 flex items-center justify-between">
            <div>
              <p className="font-cinzel text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Score de Cadence Quotidienne
              </p>
              <p className="font-cormorant text-3xl sm:text-4xl font-light text-foreground tabular-nums tracking-tight">
                {scoreMain}
              </p>
            </div>
            <div className="text-right">
              <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-full bg-[#c9a24b]/15 text-[#c9a24b] border border-[#c9a24b]/20">
                {scorePct}% accompli
              </span>
              <p className="font-sans text-[11px] text-muted-foreground mt-1">
                {scorePct === 100 ? "Alignement complet" : "En cours d'alignement"}
              </p>
            </div>
          </div>
        </div>

        {/* Time-Based Smart Recommendation */}
        <div className="aegis-dock-tile rounded-2xl p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={14} className="text-[#c9a24b]" />
            <span className="font-cinzel text-[10px] font-semibold uppercase tracking-[0.18em] text-[#c9a24b]">
              Recommandation Actuelle
            </span>
          </div>
          <p className="font-cormorant text-xl font-light text-foreground mb-1">{recommendedPractice.title}</p>
          <p className="font-sans text-xs text-muted-foreground leading-relaxed mb-3">{recommendedPractice.desc}</p>
          <button
            type="button"
            onClick={() => navigate(recommendedPractice.to)}
            className="btn-solaire w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-cinzel text-xs uppercase tracking-[0.16em]"
          >
            <Play size={12} fill="currentColor" />
            <span>{recommendedPractice.action}</span>
          </button>
        </div>
      </div>
    </div>
  );

  const rightPane = (
    <div className={cn("space-y-4", mobileTab !== "stations" && "hidden lg:block")}>
      <div className="flex items-center justify-between pb-1">
        <h2 className="font-cinzel text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Stations de Pratiques
        </h2>
        <span className="font-mono text-[10px] text-muted-foreground">5 stations bio-exécutives</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-1">
        {PRACTICES_HUB_TILES.map((tile) => {
          const title = t(tile.nameKey);
          const metric = practicesHubTileMetric(tile.id, stats, t);
          const detail = practicesHubTileDataLine(tile.id, stats, t);

          return (
            <motion.div
              key={tile.id}
              role="button"
              tabIndex={0}
              onClick={() => navigate(tile.to)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  navigate(tile.to);
                }
              }}
              whileHover={{ y: -2 }}
              className={cn(
                "group relative flex cursor-pointer items-center justify-between gap-4 rounded-2xl p-4 sm:p-5 transition-all duration-300",
                "aegis-dock-tile hover:border-[#c9a24b]/40",
              )}
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#c9a24b]/30 bg-[#c9a24b]/10 backdrop-blur-sm shadow-[0_2px_8px_rgba(201,162,75,0.12)] group-hover:border-[#c9a24b]/60 group-hover:bg-[#c9a24b]/20 group-hover:shadow-[0_4px_16px_rgba(201,162,75,0.22)] transition-all duration-300">
                  <tile.icon size={20} strokeWidth={1.5} className="text-[#c9a24b]" />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-cinzel text-xs font-semibold uppercase tracking-[0.14em] text-foreground group-hover:text-[#c9a24b] transition-colors">
                      {title}
                    </p>
                    <span className="font-mono text-[9px] px-2.5 py-0.5 rounded-full border border-white/5 bg-black/25 text-[#c9a24b]">
                      {metric}
                    </span>
                  </div>
                  <p className="font-sans text-xs text-muted-foreground mt-1 line-clamp-1 leading-relaxed">
                    {detail}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className="font-cinzel text-[10px] uppercase tracking-wider text-muted-foreground group-hover:text-[#c9a24b] transition-colors hidden sm:inline">
                  Accéder
                </span>
                <ChevronRight
                  size={16}
                  className="text-muted-foreground/40 group-hover:text-[#c9a24b] transition-colors group-hover:translate-x-0.5 duration-200"
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );

  return (
    <MemberPageScaffold width="wide" viewport>
      <MemberSplitLayout
        left={leftPane}
        right={rightPane}
        leftCols="lg:col-span-5"
        rightCols="lg:col-span-7"
        scrollRight={true}
        scrollLeft={true}
      />
    </MemberPageScaffold>
  );
}
