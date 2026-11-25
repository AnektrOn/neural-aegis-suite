import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Mic } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import {
  LOGOS_AMBASSADOR_PRICE_EUR,
  LOGOS_FUTURE_PRICE_EUR,
  LOGOS_VOICE_MINUTES_MONTHLY,
  STRIPE_PRICE_AEGIS_LOGOS_AMBASSADOR_MONTHLY,
} from "@/lib/soloPlanQuotas";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

type Availability = { remaining: number; open: boolean; sold: number; max: number };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContinue?: () => void;
};

export function LogosAmbassadorOfferDialog({ open, onOpenChange, onContinue }: Props) {
  const { locale } = useLanguage();
  const isFR = locale === "fr";
  const { openCheckout, loading } = useStripeCheckout();
  const [cohort, setCohort] = useState<Availability | null>(null);

  useEffect(() => {
    if (!open) return;
    void supabase.functions.invoke("logos-ambassador-availability").then(({ data, error }) => {
      if (error || !data) return;
      const row = data as Availability;
      if (typeof row.remaining === "number") setCohort(row);
    });
  }, [open]);

  const startCheckout = async () => {
    if (cohort && !cohort.open) {
      toast.error(isFR ? "Les 20 places ambassadeur sont prises." : "All 20 ambassador seats are taken.");
      return;
    }
    try {
      await openCheckout(STRIPE_PRICE_AEGIS_LOGOS_AMBASSADOR_MONTHLY);
    } catch {
      toast.error(isFR ? "Paiement indisponible." : "Payment unavailable.");
    }
  };

  const seatsLine = cohort
    ? isFR
      ? `${cohort.remaining} place${cohort.remaining > 1 ? "s" : ""} ambassadeur sur ${cohort.max}`
      : `${cohort.remaining} ambassador seat${cohort.remaining === 1 ? "" : "s"} left of ${cohort.max}`
    : isFR
      ? "Chargement des places…"
      : "Loading availability…";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md gap-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <DialogHeader>
          <DialogTitle className="font-display text-xl tracking-wide flex items-center gap-2">
            <Mic className="h-5 w-5 text-primary" aria-hidden />
            LOGOS
          </DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-3 text-sm text-muted-foreground text-left">
              <p>
                {isFR
                  ? "L'agent vocal LOGOS est votre sparring décisionnel : préparation de négociations, débriefs et accès à votre historique — disponible 24/7."
                  : "The LOGOS voice agent is your decision sparring partner: negotiation prep, debriefs, and your decision history — available 24/7."}
              </p>
              <p className="font-mono text-[10px] uppercase tracking-wider text-primary/90">{seatsLine}</p>
              <ul className="list-disc space-y-1.5 pl-4">
                <li>
                  {isFR
                    ? `${LOGOS_VOICE_MINUTES_MONTHLY} minutes d'appel LOGOS par mois`
                    : `${LOGOS_VOICE_MINUTES_MONTHLY} minutes of LOGOS calls per month`}
                </li>
                <li>
                  {isFR
                    ? `Tarif ambassadeur : ${LOGOS_AMBASSADOR_PRICE_EUR} € HT / mois (limité à 20 places)`
                    : `Ambassador rate: €${LOGOS_AMBASSADOR_PRICE_EUR} excl. tax / month (20 seats)`}
                </li>
                <li>
                  {isFR
                    ? `Après la cohorte : ${LOGOS_FUTURE_PRICE_EUR} € HT / mois`
                    : `After the cohort: €${LOGOS_FUTURE_PRICE_EUR} excl. tax / month`}
                </li>
              </ul>
              <p className="text-xs">
                {isFR
                  ? "LOGOS est un add-on distinct d'AEGIS Solo. La plateforme décisionnelle reste sur AEGIS Solo (35 € HT / mois)."
                  : "LOGOS is separate from AEGIS Solo. The decision platform requires AEGIS Solo (€35 excl. tax / month)."}
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">
          <Button
            className="w-full min-h-11"
            disabled={loading || (cohort !== null && !cohort.open)}
            onClick={() => void startCheckout()}
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : null}
            {isFR ? `Rejoindre LOGOS — ${LOGOS_AMBASSADOR_PRICE_EUR} € HT / mois` : `Join LOGOS — €${LOGOS_AMBASSADOR_PRICE_EUR} / month`}
          </Button>
          <Button asChild variant="outline" className="w-full min-h-11">
            <Link to="/pricing" onClick={() => onOpenChange(false)}>
              {isFR ? "Voir toutes les offres" : "View all plans"}
            </Link>
          </Button>
          {onContinue ? (
            <Button variant="ghost" className="w-full min-h-11" onClick={onContinue}>
              {isFR ? "Fermer" : "Close"}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}