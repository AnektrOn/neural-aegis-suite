import { motion } from "motion/react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { OrbitalLoader } from "@/components/ui/orbital-loader";
import { useBackendHealth } from "@/hooks/useBackendHealth";

/** Full-screen AEGIS loader + entrance motion (Suspense fallback, auth boot, dev preview). */
export function BootLoadingScreen() {
  const { status, recheck } = useBackendHealth();
  const degraded = status === "degraded";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 22 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 1.35, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[min(100vw-2rem,920px)] flex flex-col items-center gap-6"
      >
        <OrbitalLoader brand="AEGIS" />
        {degraded && (
          <div
            role="alert"
            className="w-full max-w-md flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm"
          >
            <AlertTriangle size={16} strokeWidth={1.5} className="mt-0.5 text-destructive shrink-0" />
            <div className="flex-1 space-y-1">
              <p className="font-display text-[11px] uppercase tracking-[0.18em] text-destructive">
                Backend injoignable
              </p>
              <p className="text-xs text-text-secondary leading-relaxed">
                Le service d’authentification met trop de temps à répondre. Vérifie ta connexion
                ou réessaie dans un instant.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                void recheck();
                if (typeof window !== "undefined") window.location.reload();
              }}
              className="flex items-center gap-1.5 rounded-md border border-border-active px-2.5 py-1.5 text-[11px] uppercase tracking-wider text-text-secondary hover:bg-bg-elevated/60 transition-colors"
            >
              <RefreshCw size={12} strokeWidth={1.5} />
              Recharger
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

