import { Link } from "react-router-dom";
import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";

/**
 * Blurred preview + upgrade CTA shown when a free member opens a paid area.
 * The underlying page stays visible (blurred, inert) to give a taste of the
 * feature without letting it be used.
 */
export default function PremiumLock({ children }: { children: React.ReactNode }) {
  const { locale } = useLanguage();
  const isFR = locale === "fr";

  return (
    <div className="relative min-h-[70vh]">
      <div
        aria-hidden
        className="pointer-events-none select-none blur-[10px] saturate-50 opacity-60"
      >
        {children}
      </div>

      <div className="absolute inset-0 z-20 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-primary/20 bg-background/70 backdrop-blur-2xl p-8 text-center space-y-5 shadow-2xl">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
            <Lock className="h-5 w-5 text-primary" aria-hidden />
          </div>
          <div className="space-y-2">
            <h2 className="font-display text-2xl tracking-wide text-foreground">
              {isFR ? "Réservé à la Matrice" : "Matrix members only"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isFR
                ? "Votre accès Initiation couvre la saisie quotidienne : humeur, décisions et habitudes, sans limite d'historique. Les analyses, le Deep Dive, la Toolbox, les Pulse cards, le tableau de relations, le calendrier et les exports font partie de la Matrice."
                : "Your Initiation access covers daily logging: mood, decisions and habits, with unlimited history. Analyses, Deep Dive, Toolbox, Pulse cards, the relations board, the calendar and exports are part of Matrix."}
            </p>
          </div>
          <Button asChild className="w-full min-h-[44px]">
            <Link to="/pricing">
              <Sparkles className="mr-2 h-4 w-4" aria-hidden />
              {isFR ? "Activer la Matrice" : "Activate Matrix"}
            </Link>
          </Button>
          <Button asChild variant="ghost" className="w-full min-h-[44px]">
            <Link to="/mood">
              {isFR ? "Retour à mes logs quotidiens" : "Back to my daily logs"}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
