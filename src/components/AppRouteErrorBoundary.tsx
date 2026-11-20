import { Component, type ErrorInfo, type ReactNode } from "react";
import { readLocalePreference } from "@/i18n/localePreference";

type Props = {
  children: ReactNode;
  label?: string;
};

type State = { error: Error | null };

/** Catches render/lazy-load failures so the app does not unmount to a blank #root. */
export class AppRouteErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[AppRouteErrorBoundary]", this.props.label ?? "app", error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (error) {
      const isEn = readLocalePreference() === "en";
      return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8 text-foreground">
          <h1 className="font-display text-lg tracking-wide">
            {isEn ? "An error prevented rendering" : "Une erreur a bloqué l'affichage"}
          </h1>
          <p className="max-w-md text-center text-sm text-muted-foreground">{error.message}</p>
          <button
            type="button"
            className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted/40"
            onClick={() => {
              try {
                sessionStorage.removeItem("aegis:chunk-reload");
              } catch {
                /* ignore */
              }
              window.location.reload();
            }}
          >
            {isEn ? "Reload page" : "Recharger la page"}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
