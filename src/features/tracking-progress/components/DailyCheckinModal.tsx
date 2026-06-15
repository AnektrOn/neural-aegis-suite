/**
 * DailyCheckinModal
 *
 * Opens when the user opts in via DailyCheckinReopenBanner (not auto on mount).
 * 3 questions shown one at a time with a progress bar.
 */

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Drawer } from "vaul";
import { X, Sparkles, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useTrackingCheckin, type TrackingCheckinState } from "../hooks/useTrackingCheckin";
import { TrackingQuestionCard } from "./TrackingQuestionCard";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

interface DailyCheckinModalProps {
  userId?: string;
  checkin?: TrackingCheckinState;
}

function CheckinPanel({
  t,
  locale,
  isComplete,
  totalQuestions,
  currentQuestionIndex,
  progress,
  error,
  currentQuestion,
  isSubmitting,
  submitResponse,
  dismiss,
}: {
  t: (key: string) => string;
  locale: string;
  isComplete: boolean;
  totalQuestions: number;
  currentQuestionIndex: number;
  progress: number;
  error: string | null;
  currentQuestion: NonNullable<TrackingCheckinState["batch"]>["questions"][number] | null;
  isSubmitting: boolean;
  submitResponse: TrackingCheckinState["submitResponse"];
  dismiss: () => void;
}) {
  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Sparkles size={14} className="text-[hsl(var(--aegis-warm))]" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-text-tertiary font-display">
              {t("tracking.checkin.dailyLabel")}
            </p>
            <p className="text-sm font-semibold text-foreground">
              {t("tracking.checkin.title")}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label={t("general.close")}
          className="size-11 min-h-11 min-w-11 rounded-lg flex items-center justify-center text-text-tertiary hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {!isComplete && totalQuestions > 0 && (
        <div className="mb-6 space-y-1.5">
          <div className="flex justify-between text-[10px] text-text-tertiary">
            <span>
              {Math.min(currentQuestionIndex + 1, totalQuestions)} / {totalQuestions}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-primary"
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-sm text-destructive">
          {error}
        </div>
      )}

      {isComplete && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4 py-6 text-center"
          role="status"
          aria-live="polite"
        >
          <div className="size-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <CheckCircle2 size={28} className="text-emerald-500" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground mb-1">
              {t("tracking.checkin.completeTitle")}
            </p>
            <p className="text-sm text-text-tertiary">
              {t("tracking.checkin.completeBody")}
            </p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="mt-2 min-h-11 px-6 py-2.5 rounded-xl bg-muted/50 border border-border text-sm text-foreground hover:bg-muted transition-colors"
          >
            {t("general.close")}
          </button>
        </motion.div>
      )}

      {!isComplete && currentQuestion && (
        <AnimatePresence mode="wait">
          <TrackingQuestionCard
            key={currentQuestion.id}
            question={currentQuestion}
            locale={locale as "fr" | "en"}
            onSubmit={submitResponse}
            isSubmitting={isSubmitting}
          />
        </AnimatePresence>
      )}
    </div>
  );
}

export function DailyCheckinModal({ userId, checkin: externalCheckin }: DailyCheckinModalProps) {
  const internalCheckin = useTrackingCheckin(externalCheckin ? undefined : userId);
  const checkin = externalCheckin ?? internalCheckin;
  const { locale, t } = useLanguage();
  const isMobile = useIsMobile();
  const {
    isLoading,
    hasPendingCheckin,
    batch,
    currentQuestionIndex,
    isSubmitting,
    isComplete,
    error,
    submitResponse,
    dismiss,
  } = checkin;

  const isOpen = !isLoading && !checkin.isDismissed && (hasPendingCheckin || isComplete);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) dismiss();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, isSubmitting, dismiss]);

  const totalQuestions = batch?.questions?.length ?? 3;
  const progress = isComplete
    ? 100
    : totalQuestions > 0
      ? (currentQuestionIndex / totalQuestions) * 100
      : 0;
  const currentQuestion = batch?.questions?.[currentQuestionIndex] ?? null;

  const panel = (
    <CheckinPanel
      t={t}
      locale={locale}
      isComplete={isComplete}
      totalQuestions={totalQuestions}
      currentQuestionIndex={currentQuestionIndex}
      progress={progress}
      error={error}
      currentQuestion={currentQuestion}
      isSubmitting={isSubmitting}
      submitResponse={submitResponse}
      dismiss={dismiss}
    />
  );

  if (isMobile) {
    return (
      <Drawer.Root
        open={isOpen}
        onOpenChange={(open) => {
          if (!open && !isSubmitting) dismiss();
        }}
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50" />
          <Drawer.Content
            ref={panelRef}
            className="fixed bottom-0 left-0 right-0 z-50 flex max-h-[90dvh] flex-col rounded-t-2xl border-t border-border/40 bg-[hsl(var(--card))] focus:outline-none"
          >
            <Drawer.Title className="sr-only">{t("tracking.checkin.title")}</Drawer.Title>
            <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-border/50" />
            {panel}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    );
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isSubmitting) dismiss();
      }}
    >
      <DialogContent
        ref={panelRef}
        className="relative w-full max-w-md gap-0 rounded-2xl border border-border/40 bg-[hsl(var(--card))] p-0 shadow-none sm:max-w-md [&>button.absolute]:hidden"
        onPointerDownOutside={(e) => {
          if (isSubmitting || currentQuestionIndex > 0) e.preventDefault();
        }}
        onInteractOutside={(e) => {
          if (isSubmitting || currentQuestionIndex > 0) e.preventDefault();
        }}
      >
        <DialogTitle className="sr-only">{t("tracking.checkin.title")}</DialogTitle>
        <DialogDescription className="sr-only">{t("tracking.checkin.subtitle")}</DialogDescription>
        {panel}
      </DialogContent>
    </Dialog>
  );
}

interface DailyCheckinReopenBannerProps {
  checkin: TrackingCheckinState;
}

export function DailyCheckinReopenBanner({ checkin }: DailyCheckinReopenBannerProps) {
  const { t } = useLanguage();
  if (!checkin.canReopen) return null;

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-primary/25 bg-primary/5 px-3 py-3 sm:flex-row sm:items-center sm:px-4">
      <p className="flex-1 font-barlow text-sm text-text-secondary">{t("tracking.checkin.reopenHint")}</p>
      <button
        type="button"
        className="min-h-11 rounded-xl border border-primary/40 bg-background/80 px-3 py-2 font-barlow text-xs font-medium uppercase tracking-wide text-primary hover:bg-primary/10"
        onClick={checkin.reopen}
      >
        {t("tracking.checkin.reopenCta")}
      </button>
    </div>
  );
}
