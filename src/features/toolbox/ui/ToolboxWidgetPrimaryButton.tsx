import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function ToolboxWidgetPrimaryButton({
  children,
  className,
  ...props
}: React.ComponentProps<"button"> & { children: ReactNode }) {
  return (
    <button
      type="button"
      data-slot="toolbox-widget-primary-button"
      className={cn("btn-neural w-full min-h-[44px] disabled:opacity-40 disabled:pointer-events-none", className)}
      {...props}
    >
      {children}
    </button>
  );
}
