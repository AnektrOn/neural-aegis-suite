import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";

interface Props {
  open: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export function GuardianActivateModal({ open, onAccept, onDecline }: Props) {
  const { t } = useLanguage();

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onDecline()}>
      <DialogContent className="max-w-md border-border/60 bg-card/95 backdrop-blur-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl tracking-wide">
            {t("guardian.activate.title")}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground pt-2">
            {t("guardian.activate.body")}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button type="button" className="w-full" onClick={onAccept}>
            {t("guardian.activate.yes")}
          </Button>
          <Button type="button" variant="ghost" className="w-full" onClick={onDecline}>
            {t("guardian.activate.no")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
