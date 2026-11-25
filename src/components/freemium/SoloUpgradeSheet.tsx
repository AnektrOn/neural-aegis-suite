import { Link } from "react-router-dom";
import { Loader2, Sparkles } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { STRIPE_PRICE_AEGIS_SOLO_MONTHLY } from "@/lib/soloPlanQuotas";
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

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context?: "pulse" | "toolbox" | "generic";
};

export function SoloUpgradeSheet({ open, onOpenChange, context = "generic" }: Props) {
  const { locale } = useLanguage();
  const isFR = locale === "fr";
  const { openCheckout, loading } = useStripeCheckout();

  const title =
    context === "pulse"
      ? isFR
        ? "Quota Pulse du jour atteint"
        : "Today's Pulse quota reached"
      : context === "toolbox"
        ? isFR
          ? "Quota Toolbox du jour atteint"
          : "Today's Toolbox quota reached"
        : isFR
          ? "Passez à AEGIS Solo"
          : "Upgrade to AEGIS Solo";

  const body =
    context === "pulse"
      ? isFR
        ? "En Initiation, vous pouvez assimiler jusqu'à 5 cartes Pulse globales par jour. AEGIS Solo (35 € HT / mois) débloque la plateforme complète et des quotas élargis."
        : "On Initiation, you can assimilate up to 5 global Pulse cards per day. AEGIS Solo (€35 excl. tax / month) unlocks the full platform and higher limits."
      : context === "toolbox"
        ? isFR
          ? "En Initiation, vous pouvez lancer jusqu'à 5 protocoles Toolbox globaux par jour. AEGIS Solo débloque la plateforme décisionnelle complète."
          : "On Initiation, you can start up to 5 global Toolbox protocols per day. AEGIS Solo unlocks the full decision platform."
        : isFR
          ? "AEGIS Solo — 35 € HT / mois — débloque Persona, Deep Dive, analytics, exports et des quotas Pulse / Toolbox élargis."
          : "AEGIS Solo — €35 excl. tax / month — unlocks Persona, Deep Dive, analytics, exports, and higher Pulse / Toolbox quotas.";

  const startCheckout = async () => {
    try {
      await openCheckout(STRIPE_PRICE_AEGIS_SOLO_MONTHLY);
    } catch {
      toast.error(isFR ? "Paiement indisponible." : "Payment unavailable.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md gap-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <DialogHeader>
          <DialogTitle className="font-display text-xl tracking-wide">{title}</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">{body}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">
          <Button className="w-full min-h-11" disabled={loading} onClick={() => void startCheckout()}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : null}
            <Sparkles className="mr-2 h-4 w-4" aria-hidden />
            {isFR ? "Activer AEGIS Solo" : "Activate AEGIS Solo"}
          </Button>
          <Button asChild variant="outline" className="w-full min-h-11">
            <Link to="/pricing" onClick={() => onOpenChange(false)}>
              {isFR ? "Comparer les offres" : "Compare plans"}
            </Link>
          </Button>
          <Button variant="ghost" className="w-full min-h-11" onClick={() => onOpenChange(false)}>
            {isFR ? "Plus tard" : "Not now"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}