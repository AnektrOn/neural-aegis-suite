import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useAdmin } from "@/hooks/use-admin";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { STRIPE_PRICE_AEGIS_SOLO_LOGOS_MONTHLY } from "@/lib/soloPlanQuotas";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

type Props = {
  agentReady: boolean;
  agentChecked: boolean;
  exitPath: string;
  children: ReactNode;
};

export function LogosSubscriptionGate({ agentReady, agentChecked, exitPath, children }: Props) {
  const { t, locale } = useLanguage();
  const navigate = useNavigate();
  const { hasLogos, loading: subLoading } = useSubscription();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { openCheckout, loading: checkoutLoading } = useStripeCheckout();
  const isFR = locale === "fr";

  const loading = subLoading || adminLoading;
  const entitled = hasLogos || isAdmin;

  const startLogosCheckout = async () => {
    try {
      await openCheckout(STRIPE_PRICE_AEGIS_SOLO_LOGOS_MONTHLY);
    } catch {
      toast.error(isFR ? "Paiement indisponible." : "Payment unavailable.");
    }
  };

  if (loading || !agentChecked) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center" role="status">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden />
      </div>
    );
  }

  if (!entitled) {
    return (
      <Dialog open onOpenChange={() => navigate(exitPath)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("voiceAgent.noSubscriptionTitle")}</DialogTitle>
            <DialogDescription>{t("voiceAgent.noSubscriptionBody")}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              className="w-full"
              disabled={checkoutLoading}
              onClick={() => void startLogosCheckout()}
            >
              {checkoutLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              ) : null}
              {t("voiceAgent.upgradeLogosCta")}
            </Button>
            <Button variant="outline" className="w-full" onClick={() => navigate("/pricing")}>
              {t("voiceAgent.noSubscriptionCta")}
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => navigate(exitPath)}>
              {t("voiceAgent.noAccessCta")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  if (!agentReady) {
    return (
      <Dialog open onOpenChange={() => navigate(exitPath)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("voiceAgent.noAccessTitle")}</DialogTitle>
            <DialogDescription>{t("voiceAgent.noAccessBody")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => navigate(exitPath)}>{t("voiceAgent.noAccessCta")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return <>{children}</>;
}