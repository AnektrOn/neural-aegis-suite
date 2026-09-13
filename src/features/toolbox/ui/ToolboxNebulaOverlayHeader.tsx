import { cn } from "@/lib/utils";
import {
  toolboxNebulaHeadlineClass,
  toolboxNebulaInstructionClass,
  toolboxNebulaMetaClass,
  toolboxNebulaMicroLabelClass,
  toolboxNebulaOverlayTextShadowClass,
} from "./toolboxNebulaOverlayClasses";

export function ToolboxNebulaOverlayHeader({
  title,
  headline,
  instruction,
  meta,
  completed,
  completedLabel,
  className,
  headlineClassName,
}: {
  title: string;
  headline?: string;
  instruction?: string;
  meta?: string;
  completed?: boolean;
  completedLabel?: string;
  className?: string;
  headlineClassName?: string;
}) {
  return (
    <div className={cn("text-center", toolboxNebulaOverlayTextShadowClass, className)}>
      <p className={toolboxNebulaMicroLabelClass}>{title}</p>
      {completed && completedLabel ? (
        <p className="mt-1 font-cinzel text-base text-foreground">{completedLabel}</p>
      ) : (
        <>
          {headline ? (
            <p className={cn(toolboxNebulaHeadlineClass, headlineClassName)}>{headline}</p>
          ) : null}
          {instruction ? <p className={toolboxNebulaInstructionClass}>{instruction}</p> : null}
          {meta ? <p className={toolboxNebulaMetaClass}>{meta}</p> : null}
        </>
      )}
    </div>
  );
}
