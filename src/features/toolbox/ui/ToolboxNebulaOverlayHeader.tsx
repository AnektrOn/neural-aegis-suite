import { cn } from "@/lib/utils";
import {
  toolboxNebulaHeadlineClass,
  toolboxNebulaInstructionClass,
  toolboxNebulaMetaClass,
  toolboxNebulaMicroLabelClass,
  toolboxNebulaOverlayTextShadowClass,
  toolboxNebulaProseScrollClass,
} from "./toolboxNebulaOverlayClasses";
import { isLongToolboxCopy } from "./toolboxStepText";

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
  const longHeadline = headline ? isLongToolboxCopy(headline) : false;
  const longInstruction = instruction ? isLongToolboxCopy(instruction) : false;
  const alignStart = longHeadline || longInstruction;

  return (
    <div
      className={cn(
        alignStart ? "text-left" : "text-center",
        toolboxNebulaOverlayTextShadowClass,
        className,
      )}
    >
      <p className={cn(toolboxNebulaMicroLabelClass, alignStart && "text-left")}>{title}</p>
      {completed && completedLabel ? (
        <p className="mt-1 font-cinzel text-base text-foreground">{completedLabel}</p>
      ) : (
        <>
          {headline ? (
            <p
              className={cn(
                longHeadline
                  ? "mt-1 text-sm font-medium leading-snug text-foreground"
                  : toolboxNebulaHeadlineClass,
                headlineClassName,
                longHeadline && toolboxNebulaProseScrollClass,
              )}
            >
              {headline}
            </p>
          ) : null}
          {instruction ? (
            <p
              className={cn(
                toolboxNebulaInstructionClass,
                longInstruction && toolboxNebulaProseScrollClass,
              )}
            >
              {instruction}
            </p>
          ) : null}
          {meta ? <p className={cn(toolboxNebulaMetaClass, alignStart && "text-left")}>{meta}</p> : null}
        </>
      )}
    </div>
  );
}
