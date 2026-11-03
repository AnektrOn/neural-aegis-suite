import { cn } from "@/lib/utils";

type MemberPageScaffoldProps = {
  children: React.ReactNode;
  className?: string;
  /** Full-bleed (no horizontal padding) — rare; dashboard uses its own lab frame. */
  bleed?: boolean;
};

/** Default content inset for member routes under MemberAppShell v2. */
export function MemberPageScaffold({ children, className, bleed = false }: MemberPageScaffoldProps) {
  return (
    <div
      className={cn(
        "w-full min-h-0",
        !bleed && "px-3 sm:px-5 lg:px-6 py-4 lg:py-5",
        className,
      )}
    >
      {children}
    </div>
  );
}
