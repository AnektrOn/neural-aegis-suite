/**
 * ProgressEvolution page — /progress/myss
 *
 * User-facing evolution report for the Myss Archetype perspective.
 * Shows the daily check-in adherence + biweekly evolution reports.
 */

import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useProgressEvolution } from "@/features/tracking-progress/hooks/useProgressEvolution";
import { ProgressEvolutionReport } from "@/features/tracking-progress/components/ProgressEvolutionReport";
import { DailyCheckinModal } from "@/features/tracking-progress/components/DailyCheckinModal";
import { NeuralCard } from "@/components/ui/neural-card";
import { Sparkles, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function ProgressEvolutionPage() {
  const { user } = useAuth();
  const { locale } = useLanguage();
  const navigate = useNavigate();
  const l = locale as "fr" | "en";

  const { isLoading, snapshots, adherence, error } = useProgressEvolution(user?.id);

  return (
    <div className="min-h-full -mx-6 px-5 pb-12 sm:px-8 md:-mx-10 md:px-10 bg-aegis-gradient">
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs text-text-tertiary hover:text-foreground transition-colors pt-2"
        >
          <ArrowLeft size={13} strokeWidth={1.5} />
          {l === "fr" ? "Retour" : "Back"}
        </button>

        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-4"
        >
          <div className="size-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center shrink-0">
            <Sparkles size={20} className="text-amber-400" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-text-tertiary font-display mb-0.5">
              {l === "fr" ? "Progression" : "Progress"}
            </p>
            <h1 className="font-cormorant text-2xl sm:text-3xl font-light tracking-tight text-text-primary">
              {l === "fr" ? "Évolution Archétypale" : "Archetypal Evolution"}
            </h1>
            <p className="text-sm text-text-secondary/80 mt-0.5">
              {l === "fr"
                ? "Suivi de votre profil Myss sur le temps"
                : "Tracking your Myss profile over time"}
            </p>
          </div>
        </motion.div>

        {/* Error state */}
        {error && (
          <NeuralCard className="p-5 border-red-500/20">
            <p className="text-sm text-red-400">{error}</p>
          </NeuralCard>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 rounded-xl bg-white/[0.03] border border-white/8 animate-pulse"
              />
            ))}
          </div>
        )}

        {/* Report */}
        {!isLoading && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <ProgressEvolutionReport
              snapshots={snapshots}
              adherence={adherence}
            />
          </motion.div>
        )}
      </div>

      {/* Daily check-in modal (if pending) */}
      <DailyCheckinModal userId={user?.id} />
    </div>
  );
}
