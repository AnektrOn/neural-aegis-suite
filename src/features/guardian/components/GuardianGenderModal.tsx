import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import type { GuardianGender } from "../types";

interface Props {
  open: boolean;
  onSelect: (gender: GuardianGender) => void;
  onSkip: () => void;
}

export function GuardianGenderModal({ open, onSelect, onSkip }: Props) {
  const { t } = useLanguage();

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onSkip()}>
      <DialogContent className="max-w-md border-border/60 bg-card/95 backdrop-blur-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl tracking-wide">
            {t("guardian.gender.title")}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground pt-2">
            {t("guardian.gender.body")}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button type="button" variant="outline" className="h-14" onClick={() => onSelect("male")}>
            {t("guardian.gender.male")}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-14"
            onClick={() => onSelect("female")}
          >
            {t("guardian.gender.female")}
          </Button>
        </div>
        <Button type="button" variant="ghost" className="w-full mt-2" onClick={onSkip}>
          {t("guardian.skip")}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
