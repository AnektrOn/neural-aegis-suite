import { AlertTriangle, RefreshCw } from "lucide-react";
import { useBackendHealth } from "@/hooks/useBackendHealth";

/**
 * Inline banner shown when the Lovable Cloud auth backend is unreachable.
 * Surfaces a clear message instead of letting the UI hang on a spinner.
 */
export default function BackendHealthBanner({ className = "" }: { className?: string }) {
  const { status, recheck } = useBackendHealth();

  if (status !== "degraded") return null;

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-text-primary ${className}`}
    >
      <AlertTriangle size={16} strokeWidth={1.5} className="mt-0.5 text-destructive shrink-0" />
      <div className="flex-1 space-y-1">
        <p className="font-display text-[11px] uppercase tracking-[0.18em] text-destructive">
          Service indisponible
        </p>
        <p className="text-xs text-text-secondary leading-relaxed">
          Le backend d’authentification ne répond pas. Réessaie dans une minute ; si le problème
          persiste, augmente l’instance dans les réglages avancés.
        </p>
      </div>
      <button
        type="button"
        onClick={() => void recheck()}
        className="flex items-center gap-1.5 rounded-md border border-border-active px-2.5 py-1.5 text-[11px] uppercase tracking-wider text-text-secondary hover:bg-bg-elevated/60 transition-colors"
      >
        <RefreshCw size={12} strokeWidth={1.5} />
        Réessayer
      </button>
    </div>
  );
}
