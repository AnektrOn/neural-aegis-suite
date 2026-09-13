import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import {
  toolboxWidgetChatInputClass,
  toolboxWidgetChatInputStyle,
  toolboxWidgetInputClass,
  toolboxWidgetTextareaClass,
} from "./toolboxWidgetClasses";

type InputProps = React.ComponentProps<"input"> & {
  variant?: "default" | "chat";
  chatSide?: "start" | "end";
  accentColor?: string;
};

export function ToolboxWidgetInput({
  className,
  variant = "default",
  chatSide = "start",
  accentColor,
  style,
  ...props
}: InputProps) {
  const chatStyle =
    variant === "chat" && accentColor ? { ...toolboxWidgetChatInputStyle(accentColor), ...style } : style;

  return (
    <input
      data-slot="toolbox-widget-input"
      className={cn(
        variant === "chat"
          ? toolboxWidgetChatInputClass(chatSide, accentColor ?? "hsl(var(--primary))", className)
          : toolboxWidgetInputClass,
        variant === "default" ? className : undefined,
      )}
      style={chatStyle}
      {...props}
    />
  );
}

type TextareaProps = React.ComponentProps<"textarea">;

export const ToolboxWidgetTextarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function ToolboxWidgetTextarea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        data-slot="toolbox-widget-textarea"
        className={cn(toolboxWidgetTextareaClass, className)}
        {...props}
      />
    );
  },
);
