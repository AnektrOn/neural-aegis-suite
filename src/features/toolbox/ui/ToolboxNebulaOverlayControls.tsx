import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ToolboxWidgetLaunchButton } from "./ToolboxWidgetTimerControls";
import { ToolboxWidgetPrimaryButton } from "./ToolboxWidgetPrimaryButton";
import { ToolboxWidgetTimerControls } from "./ToolboxWidgetTimerControls";

export function ToolboxNebulaOverlayControls({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>{children}</div>
  );
}

export function ToolboxNebulaOverlayTimerRow({
  isRunning,
  onToggle,
  onReset,
  disabled,
  playLabel,
  pauseLabel,
  resetLabel,
  primaryLabel,
  onPrimary,
  primaryDisabled,
  primaryIcon,
}: {
  isRunning: boolean;
  onToggle: () => void;
  onReset: () => void;
  disabled?: boolean;
  playLabel: string;
  pauseLabel: string;
  resetLabel: string;
  primaryLabel?: string;
  onPrimary?: () => void;
  primaryDisabled?: boolean;
  primaryIcon?: ReactNode;
}) {
  if (primaryLabel && onPrimary) {
    return (
      <ToolboxNebulaOverlayControls>
        <ToolboxWidgetTimerControls
          isRunning={isRunning}
          onToggle={onToggle}
          onReset={onReset}
          disabled={disabled}
          playLabel={playLabel}
          pauseLabel={pauseLabel}
          resetLabel={resetLabel}
        />
        <ToolboxWidgetLaunchButton
          type="button"
          onClick={onPrimary}
          disabled={primaryDisabled}
          className="inline-flex h-11 min-w-[7.5rem] items-center justify-center gap-1.5 rounded-full px-4 text-sm"
        >
          {primaryIcon}
          {primaryLabel}
        </ToolboxWidgetLaunchButton>
      </ToolboxNebulaOverlayControls>
    );
  }

  return (
    <ToolboxNebulaOverlayControls>
      <ToolboxWidgetTimerControls
        isRunning={isRunning}
        onToggle={onToggle}
        onReset={onReset}
        disabled={disabled}
        playLabel={playLabel}
        pauseLabel={pauseLabel}
        resetLabel={resetLabel}
      />
    </ToolboxNebulaOverlayControls>
  );
}

export function ToolboxNebulaOverlayPrimaryButton({
  children,
  className,
  ...props
}: React.ComponentProps<typeof ToolboxWidgetPrimaryButton>) {
  return (
    <ToolboxWidgetPrimaryButton
      className={cn("h-11 min-w-[7.5rem] rounded-full px-4 text-sm", className)}
      {...props}
    >
      {children}
    </ToolboxWidgetPrimaryButton>
  );
}
