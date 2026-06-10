import type { ReactNode, MouseEvent, KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface Props {
  to: string;
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
}

/** Tappable dashboard panel — navigates on click; use `data-dashboard-stop-nav` on nested controls. */
export function DashboardNavCard({ to, children, className, ariaLabel }: Props) {
  const navigate = useNavigate();

  const go = () => navigate(to);

  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("[data-dashboard-stop-nav]")) return;
    go();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      go();
    }
  };

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={ariaLabel}
      className={cn("dashboard-panel-interactive block outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-2xl sm:rounded-[18px]", className)}
    >
      {children}
    </div>
  );
}
