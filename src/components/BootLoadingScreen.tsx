import { lazy, Suspense, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { useBackendHealth } from "@/hooks/useBackendHealth";

const ArmillaryLoader = lazy(() =>
  import("@/pages/aegis-landing/components/ArmillaryLoader").then((m) => ({
    default: m.ArmillaryLoader,
  })),
);

function LoaderShell({ children }: { children?: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F3EEEC]">
      {children}
      <p className="font-cinzel text-lg tracking-[0.28em] text-[#121212]/70">AEGIS</p>
    </div>
  );
}

/** Full-screen AEGIS loader (Suspense fallback, auth boot, dev preview). */
export function BootLoadingScreen() {
  const { status, recheck } = useBackendHealth();
  const degraded = status === "degraded";

  return (
    <div className="relative z-[100] min-h-screen bg-[#F3EEEC]">
      <Suspense
        fallback={
          <LoaderShell>
            <div className="h-[min(52vh,420px)] w-full max-w-[520px]" aria-hidden />
          </LoaderShell>
        }
      >
        <ArmillaryLoader />
      </Suspense>
      {degraded ? (
        <div
          role="alert"
          className="absolute inset-x-0 bottom-8 mx-auto flex w-full max-w-md items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm"
        >
          <AlertTriangle size={16} strokeWidth={1.5} className="mt-0.5 shrink-0 text-destructive" />
          <div className="flex-1 space-y-1">
            <p className="font-display text-[11px] uppercase tracking-[0.18em] text-destructive">
              Backend injoignable
            </p>
            <p className="text-xs leading-relaxed text-text-secondary">
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
            className="flex items-center gap-1.5 rounded-md border border-border-active px-2.5 py-1.5 text-[11px] uppercase tracking-wider text-text-secondary transition-colors hover:bg-bg-elevated/60"
          >
            <RefreshCw size={12} strokeWidth={1.5} />
            Recharger
          </button>
        </div>
      ) : null}
    </div>
  );
}
