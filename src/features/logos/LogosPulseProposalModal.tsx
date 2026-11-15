import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PulseCard } from "@/features/aegis-pulse/domain/types";

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
  if (!card) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onDismiss();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-left">{card.title}</DialogTitle>
          <DialogDescription className="text-left">
            {card.principleName} · {card.timeLabel}
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm text-muted-foreground leading-relaxed">{card.problem}</p>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button type="button" disabled={busy} onClick={() => void onAssimilate()}>
            Assimiler au grimoire
          </Button>
          <Button type="button" variant="secondary" disabled={busy} onClick={() => void onIgnore()}>
            Ignorer
          </Button>
          <Button type="button" variant="ghost" disabled={busy} onClick={onDismiss}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
