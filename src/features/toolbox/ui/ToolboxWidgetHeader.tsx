import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toolboxWidgetHeaderClass } from "./toolboxWidgetClasses";

export function ToolboxWidgetHeader({
  title,
  icon: Icon,
  iconClassName,
  className,
}: {
  title: string;
  icon: LucideIcon;
  iconClassName?: string;
  className?: string;
}) {
  return (
    <div data-slot="toolbox-widget-header" className={cn(toolboxWidgetHeaderClass, className)}>
      <Icon size={14} className={cn("shrink-0", iconClassName)} aria-hidden />
      <span className="text-xs uppercase tracking-[0.3em]">{title}</span>
    </div>
  );
}
