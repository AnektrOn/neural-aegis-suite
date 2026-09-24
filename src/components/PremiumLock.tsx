import { Link } from "react-router-dom";
import { AlertTriangle, CreditCard, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";

export type PremiumLockReason = "upgrade" | "past_due" | "expired";

type Props = {
  children: React.ReactNode;
  reason?: PremiumLockReason;
};

/**
 * Blurred preview + CTA when a free / blocked member opens a paid area.
 */
export default function PremiumLock({ children, reason = "upgrade" }: Props) {
  const { locale } = useLanguage();
  const isFR = locale === "fr";

  const copy =
    reason === "past_due"
      ? {
          icon: CreditCard,
          title: isFR ? "Paiement à régulariser" : "Payment required",
          body: isFR
            ? "Votre dernier paiement a échoué. L'accès Matrice est suspendu jusqu'à mise à jour de votre moyen de paiement."
            : "Your last payment failed. Matrix access is suspended until you update your payment method.",
          primary: isFR ? "Mettre à jour le paiement" : "Update payment",
          primaryTo: "/pricing",
          secondary: isFR ? "Retour aux logs quotidiens" : "Back to daily logs",
        }
      : reason === "expired"
        ? {
            icon: AlertTriangle,
            title: isFR ? "Abonnement terminé" : "Subscription ended",
            body: isFR
              ? "Votre période payée est terminée. Renouvelez pour retrouver analyses, Deep Dive, Toolbox et exports."
              : "Your paid period has ended. Renew to restore analyses, Deep Dive, Toolbox and exports.",
            primary: isFR ? "Renouveler" : "Renew",
            primaryTo: "/pricing",
            secondary: isFR ? "Retour aux logs quotidiens" : "Back to daily logs",
          }
        : {
            icon: Lock,
            title: isFR ? "Réservé à la Matrice" : "Matrix members only",
            body: isFR
              ? "Votre accès Initiation couvre la saisie quotidienne : humeur, décisions et habitudes, sans limite d'historique. Les analyses, le Deep Dive, la Toolbox, les Pulse cards, le tableau de relations, le calendrier et les exports font partie de la Matrice."
              : "Your Initiation access covers daily logging: mood, decisions and habits, with unlimited history. Analyses, Deep Dive, Toolbox, Pulse cards, the relations board, the calendar and exports are part of Matrix.",
            primary: isFR ? "Activer la Matrice" : "Activate Matrix",
            primaryTo: "/pricing",
            secondary: isFR ? "Retour à mes logs quotidiens" : "Back to my daily logs",
          };

  const Icon = copy.icon;

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
            <Icon className="h-5 w-5 text-primary" aria-hidden />
          </div>
          <div className="space-y-2">
            <h2 className="font-display text-2xl tracking-wide text-foreground">{copy.title}</h2>
            <p className="text-sm text-muted-foreground">{copy.body}</p>
          </div>
          <Button asChild className="w-full min-h-[44px]">
            <Link to={copy.primaryTo}>
              <Sparkles className="mr-2 h-4 w-4" aria-hidden />
              {copy.primary}
            </Link>
          </Button>
          <Button asChild variant="ghost" className="w-full min-h-[44px]">
            <Link to="/mood">{copy.secondary}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
