import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PulseCardRectoPreview } from "@/features/aegis-pulse/components/PulseCardRectoPreview";
import type { PulseCard } from "@/features/aegis-pulse/domain/types";
import { LOGOS_DIALOG_OVERLAY_CLASS, LOGOS_DIALOG_CONTENT_Z } from "./logosDialogStack";
import { cn } from "@/lib/utils";

type Props = {
  card: PulseCard | null;
  open: boolean;
  busy: boolean;
  onAssimilate: () => void;
  onIgnore: () => void;
  onDismiss: () => void;
};

export function LogosPulseProposalModal({
  card,
  open,
  busy,
  onAssimilate,
  onIgnore,
  onDismiss,
}: Props) {
  const { t } = useLanguage();
  if (!card) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onDismiss();
      }}
    >
      <DialogContent
        overlayClassName={LOGOS_DIALOG_OVERLAY_CLASS}
        className={cn(
          LOGOS_DIALOG_CONTENT_Z,
          "max-h-[min(100dvh-1.5rem,44rem)] max-w-[min(100vw-1.5rem,22rem)] gap-4 overflow-y-auto border-border/40 p-4 sm:p-5",
        )}
      >
        <DialogHeader className="space-y-1 text-center sm:text-center">
          <DialogTitle className="sr-only">{card.title}</DialogTitle>
          <DialogDescription className="font-display text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Pulse · {card.principleName}
          </DialogDescription>
        </DialogHeader>

        <PulseCardRectoPreview card={card} className="mx-auto w-full max-w-[18rem]" />

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button type="button" disabled={busy} onClick={() => void onAssimilate()}>
            {t("logos.assimilateGrimoire")}
          </Button>
          <Button type="button" variant="secondary" disabled={busy} onClick={() => void onIgnore()}>
            {t("logos.ignore")}
          </Button>
          <Button type="button" variant="ghost" disabled={busy} onClick={onDismiss}>
            {t("general.cancel")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}