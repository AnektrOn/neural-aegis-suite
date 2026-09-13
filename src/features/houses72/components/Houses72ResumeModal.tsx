/**
 * Post-login prompt to complete Phase 2 (Casting des 12 Maisons).
 *
 * Shown after the V4 quiz is done, until every populated house is complete.
 * Dismiss lasts for this sign-in; the next login shows the modal again if unfinished.
 */

import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Map } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { isVisitorOnlyUser } from "@/lib/authVisitor";
import { useQuizCompletion } from "@/hooks/useQuizCompletion";
import { useHouses72Status } from "../hooks/useHouses72Status";
import {
  markHouses72ResumeDismissedThisVisit,
  wasHouses72ResumeDismissedThisVisit,
} from "@/lib/houses72ResumePromptStorage";

const SKIP_PREFIXES = [
  "/assessment/maisons",
  "/onboarding",
  "/quiz",
  "/auth",
  "/pricing",
  "/checkout",
];

function shouldSkipPath(pathname: string): boolean {
  return SKIP_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

interface Houses72ResumeModalProps {
  /** Lets Welcome hold Pulse until this prompt has decided. */
  onBlockingChange?: (blocking: boolean) => void;
}

export function Houses72ResumeModal({ onBlockingChange }: Houses72ResumeModalProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { loading: quizLoading, completed: quizDone } = useQuizCompletion();
  const status = useHouses72Status(user?.id);
  const [open, setOpen] = useState(false);

  const isGuest = isVisitorOnlyUser(user);
  const skipPath = shouldSkipPath(pathname);
  const ready = Boolean(user) && !isGuest && !quizLoading && !status.loading;
  const needsPrompt = ready && quizDone && !status.isFullyComplete && !skipPath;
  const dismissed = user != null && wasHouses72ResumeDismissedThisVisit(user.id);

  useEffect(() => {
    if (!user || isGuest) {
      setOpen(false);
      onBlockingChange?.(false);
      return;
    }
    if (!ready) {
      onBlockingChange?.(true);
      return;
    }
    if (!needsPrompt || dismissed) {
      setOpen(false);
      onBlockingChange?.(false);
      return;
    }
    setOpen(true);
    onBlockingChange?.(true);
  }, [user, isGuest, ready, needsPrompt, dismissed, onBlockingChange]);

  const dismiss = () => {
    if (user) markHouses72ResumeDismissedThisVisit(user.id);
    setOpen(false);
    onBlockingChange?.(false);
  };

  const continueCasting = () => {
    if (user) markHouses72ResumeDismissedThisVisit(user.id);
    setOpen(false);
    onBlockingChange?.(false);
    navigate("/assessment/maisons");
  };

  const inProgress = status.hasAnyProgress;

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : dismiss())}>
      <DialogContent className="max-w-md border-border/60 bg-background/95 backdrop-blur-xl">
        <DialogHeader>
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
            <Map className="h-5 w-5 text-primary" strokeWidth={1.25} aria-hidden />
          </div>
          <DialogTitle className="text-xl">
            {inProgress
              ? t("houses72.resumePrompt.titleResume")
              : t("houses72.resumePrompt.titleStart")}
          </DialogTitle>
          <DialogDescription className="leading-relaxed text-muted-foreground">
            {inProgress
              ? t("houses72.resumePrompt.bodyResume", {
                  answered: status.answeredQuestions,
                  total: status.totalQuestions,
                })
              : t("houses72.resumePrompt.bodyStart")}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button type="button" className="w-full min-h-[44px]" onClick={continueCasting}>
            {inProgress
              ? t("houses72.resumePrompt.ctaResume")
              : t("houses72.resumePrompt.ctaStart")}
          </Button>
          <Button type="button" variant="ghost" className="w-full min-h-[44px]" onClick={dismiss}>
            {t("houses72.resumePrompt.later")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
