import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { DecisionQuickForm } from "@/components/decisions/DecisionQuickForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { logosWriteDecision } from "./logosWrites";
import { LOGOS_DIALOG_OVERLAY_CLASS, LOGOS_DIALOG_CONTENT_Z } from "./logosDialogStack";
import { cn } from "@/lib/utils";

type Props = {
  userId: string;
  open: boolean;
  onClose: (result: string) => void;
};

export function LogosDecisionCaptureModal({ userId, open, onClose }: Props) {
  const { t } = useLanguage();
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (data: {
    name: string;
    priority: number;
    responsibility: number;
  }) => {
    setBusy(true);
    try {
      const res = await logosWriteDecision(userId, data);
      if (res.ok === false) {
        onClose(`error:${res.error}`);
        return;
      }
      onClose("saved");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o && !busy) onClose("dismissed");
      }}
    >
      <DialogContent
        overlayClassName={LOGOS_DIALOG_OVERLAY_CLASS}
        className={cn(LOGOS_DIALOG_CONTENT_Z, "max-w-md gap-0 border-border/40 p-0")}
      >
        <DialogHeader className="px-4 pt-4">
          <DialogTitle>{t("decisions.newDecision")}</DialogTitle>
          <DialogDescription>{t("decisions.quickAdd")}</DialogDescription>
        </DialogHeader>
        <div className="px-4 pb-3">
          <DecisionQuickForm
            onSubmit={(data) => void handleSubmit(data)}
            isPending={busy}
            labels={{
              title: t("decisions.quickAdd"),
              name: t("decisions.decisionName"),
              placeholder: t("decisions.placeholder"),
              priority: t("decisions.priority"),
              save: t("general.save"),
            }}
          />
        </div>
        <div className="flex justify-end border-t border-border/40 px-4 py-2">
          <Button type="button" variant="ghost" disabled={busy} onClick={() => onClose("dismissed")}>
            {t("general.cancel")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}