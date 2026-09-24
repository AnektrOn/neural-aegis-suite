import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ToolboxWidgetProsePanel,
  ToolboxWidgetStepCard,
} from "@/features/toolbox/ui";
import type { ToolboxItemLocale } from "../types";

export interface ToolboxStepperProps {
  steps: string[];
  instructions: string;
  locale?: ToolboxItemLocale;
  className?: string;
  onStepChange?: (index: number) => void;
}

export function ToolboxStepper({
  steps,
  instructions,
  className,
  onStepChange,
  locale = "fr",
}: ToolboxStepperProps) {
  const labels =
    locale === "en"
      ? { step: "Step", prev: "Previous", next: "Next", context: "Context" }
      : { step: "Étape", prev: "Précédent", next: "Suivant", context: "Pourquoi" };

  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "start", containScroll: "trimSnaps" });
  const [activeIndex, setActiveIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    const idx = emblaApi.selectedScrollSnap();
    setActiveIndex(idx);
    onStepChange?.(idx);
  }, [emblaApi, onStepChange]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    onSelect();
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollPrev = () => emblaApi?.scrollPrev();
  const scrollNext = () => emblaApi?.scrollNext();

  const total = steps.length;

  return (
    <div data-slot="toolbox-stepper" className={cn("space-y-4 sm:space-y-5", className)}>
      {instructions ? (
        <ToolboxWidgetProsePanel label={labels.context} maxHeightClass="max-h-[min(40dvh,20rem)] sm:max-h-72">
          {instructions}
        </ToolboxWidgetProsePanel>
      ) : null}

      <div className="flex items-center justify-center gap-1.5" aria-hidden>
        {steps.map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1 rounded-full transition-all duration-200",
              i === activeIndex ? "w-6 bg-foreground/70" : "w-1.5 bg-border/60",
            )}
          />
        ))}
      </div>

      <div className="relative">
        <div ref={emblaRef} className="overflow-hidden rounded-2xl border border-border/30 bg-secondary/10">
          <div className="flex">
            {steps.map((step, i) => (
              <div
                key={i}
                className="min-w-0 shrink-0 grow-0 basis-full px-3 py-4 sm:px-5 sm:py-5"
                aria-roledescription="slide"
                aria-label={`${labels.step} ${i + 1} / ${total}`}
              >
                <ToolboxWidgetStepCard stepText={step} stepIndex={i} stepTotal={total} />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={scrollPrev}
            disabled={activeIndex <= 0}
            className="inline-flex min-h-11 items-center gap-1 rounded-full border border-border/40 px-4 text-xs uppercase tracking-wider text-muted-foreground disabled:opacity-30"
          >
            <ChevronLeft className="size-4" />
            {labels.prev}
          </button>
          <button
            type="button"
            onClick={scrollNext}
            disabled={activeIndex >= total - 1}
            className="inline-flex min-h-11 items-center gap-1 rounded-full border border-border/40 px-4 text-xs uppercase tracking-wider text-foreground disabled:opacity-30"
          >
            {labels.next}
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
