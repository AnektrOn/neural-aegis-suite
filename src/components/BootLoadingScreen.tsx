import { lazy, Suspense, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { useBackendHealth } from "@/hooks/useBackendHealth";
import { readLocalePreference } from "@/i18n/localePreference";

const WelcomeLandingNebula = lazy(() =>
  import("@/features/welcome/components/WelcomeLandingNebula").then((m) => ({
    default: m.WelcomeLandingNebula,
  })),
);

function LoaderShell({ children }: { children?: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-black">
      {children}
      <p className="relative z-10 font-cinzel text-lg tracking-[0.28em] text-white/70">AEGIS</p>
    </div>
  );
}

/** Full-screen AEGIS boot (Suspense fallback, auth boot, native cold start). */
export function BootLoadingScreen() {
  const { status, recheck } = useBackendHealth();
  const degraded = status === "degraded";
  const isEn = readLocalePreference() === "en";

  return (
    <div className="relative z-[100] min-h-screen overflow-hidden bg-black">
      <Suspense
        fallback={
          <LoaderShell>
            <div className="h-[min(52vh,420px)] w-full max-w-[520px]" aria-hidden />
          </LoaderShell>
        }
      >
        <WelcomeLandingNebula />
      </Suspense>
      <div className="pointer-events-none absolute inset-0 z-[1] bg-black/20" aria-hidden />
      <p className="pointer-events-none absolute inset-x-0 bottom-16 z-10 text-center font-cinzel text-lg tracking-[0.28em] text-white/75">
        AEGIS
      </p>
      {degraded ? (
        <div
          role="alert"
          className="absolute inset-x-0 bottom-8 z-20 mx-auto flex w-full max-w-md items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm backdrop-blur-md"
        >
          <AlertTriangle size={16} strokeWidth={1.5} className="mt-0.5 shrink-0 text-destructive" />
          <div className="flex-1 space-y-1">
            <p className="font-display text-[11px] uppercase tracking-[0.18em] text-destructive">
              {isEn ? "Backend unreachable" : "Backend injoignable"}
            </p>
            <p className="text-xs leading-relaxed text-white/70">
              {isEn
                ? "The authentication service is taking too long to respond. Check your connection or try again shortly."
                : "Le service d’authentification met trop de temps à répondre. Vérifie ta connexion ou réessaie dans un instant."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              void recheck();
              if (typeof window !== "undefined") window.location.reload();
            }}
            className="flex items-center gap-1.5 rounded-md border border-white/20 px-2.5 py-1.5 text-[11px] uppercase tracking-wider text-white/80 transition-colors hover:bg-white/10"
          >
            <RefreshCw size={12} strokeWidth={1.5} />
            {isEn ? "Reload" : "Recharger"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
