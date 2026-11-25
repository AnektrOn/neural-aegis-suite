import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useAdmin } from "@/hooks/use-admin";
import { LogosAmbassadorOfferDialog } from "@/features/logos/LogosAmbassadorOfferDialog";
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

type Props = {
  agentReady: boolean;
  agentChecked: boolean;
  exitPath: string;
  children: ReactNode;
};

export function LogosSubscriptionGate({ agentReady, agentChecked, exitPath, children }: Props) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { hasLogos, loading: subLoading } = useSubscription();
  const { isAdmin, loading: adminLoading } = useAdmin();

  const loading = subLoading || adminLoading;
  const entitled = hasLogos || isAdmin;

  if (loading || !agentChecked) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center" role="status">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden />
      </div>
    );
  }

  if (!entitled) {
    return (
      <LogosAmbassadorOfferDialog
        open
        onOpenChange={(open) => {
          if (!open) navigate(exitPath);
        }}
      />
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