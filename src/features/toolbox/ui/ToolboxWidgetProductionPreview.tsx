import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function ToolboxWidgetProductionPreview({
  title,
  typeLabel,
  typeIcon: TypeIcon,
  typeIconClassName,
  previewMode,
  onClose,
  children,
  className,
}: {
  title: string;
  typeLabel: string;
  typeIcon: LucideIcon;
  typeIconClassName?: string;
  previewMode: "embedded" | "fullscreen";
  onClose?: () => void;
  children: ReactNode;
  className?: string;
}) {
  const iconSlot = (
    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/30 bg-background/60 sm:h-10 sm:w-10">
      <TypeIcon size={17} strokeWidth={1.5} className={typeIconClassName} />
    </div>
  );

  const body = <div className="min-w-0 overflow-x-hidden py-1">{children}</div>;

  if (previewMode === "fullscreen") {
    return (
      <Dialog open onOpenChange={() => onClose?.()}>
        <DialogContent
          showCloseButton={false}
          className={cn(
            "ethereal-glass w-[calc(100vw-1.25rem)] max-w-lg max-h-[min(90dvh,720px)] overflow-x-hidden overflow-y-auto border-border/30 p-4 sm:p-6",
            className,
          )}
        >
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
          <DialogHeader className="min-w-0 pr-8">
            <div className="flex min-w-0 items-start gap-3">
              {iconSlot}
              <div className="min-w-0 flex-1 text-left">
                <DialogDescription className="mb-0.5 truncate text-neural-label">{typeLabel}</DialogDescription>
                <DialogTitle className="text-left text-base leading-snug text-foreground break-words">{title}</DialogTitle>
              </div>
            </div>
          </DialogHeader>
          <div className="border-t border-border/20 pt-4">{body}</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-primary/25 ethereal-glass",
        className,
      )}
    >
      <div className="border-b border-border/20 bg-background/30 px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-start gap-3">
          {iconSlot}
          <div className="min-w-0 flex-1 text-left">
            <p className="mb-0.5 truncate text-neural-label text-sm text-muted-foreground">{typeLabel}</p>
            <h3 className="text-left text-base font-semibold leading-snug text-foreground break-words">{title}</h3>
          </div>
        </div>
      </div>
      <div className="p-4 sm:p-6">{body}</div>
    </div>
  );
}
