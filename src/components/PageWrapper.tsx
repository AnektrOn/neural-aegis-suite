import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

/** Plain wrapper — avoid enter opacity:0 (blank screen if animation does not run). */
export function PageWrapper({
  children,
  className,
  memberShell = false,
}: {
  children: React.ReactNode;
  className?: string;
  /** Member shell v2: dock reserve; dashboard pages may opt out via own layout. */
  memberShell?: boolean;
}) {
  const isMobile = useIsMobile();

  return (
    <div
      className={cn(
        memberShell && "min-h-[100dvh] w-full",
        isMobile && !memberShell && "pb-3",
        className,
      )}
    >
      {children}
    </div>
  );
}
