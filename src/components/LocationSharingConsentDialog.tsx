import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDecision: (params: { accept: boolean; hideModal: boolean }) => void;
};

export function LocationSharingConsentDialog({ open, onOpenChange, onDecision }: Props) {
  const { t } = useLanguage();
  const [hideAgain, setHideAgain] = useState(false);

  const submit = (accept: boolean) => {
    onDecision({ accept, hideModal: hideAgain });
    setHideAgain(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-white/10 bg-[hsl(220_15%_10%)] text-white">
        <DialogHeader>
          <DialogTitle className="text-lg">{t("places.consentTitle")}</DialogTitle>
          <DialogDescription className="text-white/60 leading-relaxed">
            {t("places.consentBody")}
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-start gap-2 py-2">
          <Checkbox
            id="hide-consent"
            checked={hideAgain}
            onCheckedChange={(v) => setHideAgain(v === true)}
            className="mt-0.5 border-white/30 data-[state=checked]:bg-primary"
          />
          <label htmlFor="hide-consent" className="text-sm text-white/70 cursor-pointer leading-snug">
            {t("places.consentHideAgain")}
          </label>
        </div>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            type="button"
            className="w-full bg-emerald-600/90 text-white hover:bg-emerald-600"
            onClick={() => submit(true)}
          >
            {t("places.consentAccept")}
          </Button>
          <Button type="button" variant="outline" className="w-full border-white/20 text-white/90" onClick={() => submit(false)}>
            {t("places.consentDecline")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
