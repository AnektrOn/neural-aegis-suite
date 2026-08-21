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
  onReturnToGuardian: () => void;
  onAutonomous: () => void;
}

export function GuardianPostQuizModal({ open, onReturnToGuardian, onAutonomous }: Props) {
  const { t } = useLanguage();

  return (
    <Dialog open={open}>
      <DialogContent
        className="max-w-md border-border/60 bg-card/95 backdrop-blur-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="font-display text-xl tracking-wide">
            {t("guardian.postQuiz.title")}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground pt-2">
            {t("guardian.postQuiz.body")}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button type="button" className="w-full" onClick={onReturnToGuardian}>
            {t("guardian.postQuiz.return")}
          </Button>
          <Button type="button" variant="outline" className="w-full" onClick={onAutonomous}>
            {t("guardian.postQuiz.autonomous")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
