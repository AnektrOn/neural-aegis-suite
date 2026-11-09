import type { ReactNode, TouchEvent } from "react";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { PageWrapper } from "@/components/PageWrapper";
import { MobileAppDockBar } from "@/components/MobileAppDockBar";
import { MemberTopDockBar } from "@/components/MemberTopDockBar";
import AppCommandPalette from "@/components/AppCommandPalette";
import QuickLogModal from "@/components/QuickLogModal";
import FreePreviewToggle from "@/components/FreePreviewToggle";
import { MEMBER_SHELL_ROOT_CLASS } from "@/layouts/memberShellConfig";

type MemberAppShellProps = {
  children: ReactNode;
  online: boolean;
  commandOpen: boolean;
  onCommandOpenChange: (open: boolean) => void;
  quickLogOpen: boolean;
  onQuickLogClose: () => void;
  onQuickLog: () => void;
  onLogout: () => void;
  /** Mobile pull-to-refresh chrome */
  refreshing?: boolean;
  onTouchStart?: (e: TouchEvent) => void;
  onTouchEnd?: (e: TouchEvent) => void;
  mobile?: boolean;
};

/**
 * Shared shell for all subscribed member routes: full viewport content + bottom dock.
 * Replaces legacy sidebar + DesktopTopBar.
 */
export function MemberAppShell({
  children,
  online,
  commandOpen,
  onCommandOpenChange,
  quickLogOpen,
  onQuickLogClose,
  onQuickLog,
  onLogout,
  refreshing = false,
  onTouchStart,
  onTouchEnd,
  mobile = false,
}: MemberAppShellProps) {
  const location = useLocation();

  return (
    <div
      className={cn(
        MEMBER_SHELL_ROOT_CLASS,
        "flex min-h-[100dvh] w-full flex-col bg-bg-base relative z-10",
        !online && mobile && "pt-0",
      )}
    >
      <main
        className={cn(
          mobile ? "mobile-main-scroll flex-1 overflow-y-auto" : "flex-1 min-h-0 overflow-y-auto",
          mobile && !online && "mobile-main-scroll--offline",
          "px-0",
        )}
        style={{
          paddingTop: mobile
            ? online
              ? "var(--mobile-main-padding-top)"
              : "var(--mobile-main-padding-top-offline)"
            : online
              ? 0
              : undefined,
          paddingBottom: "var(--mobile-dock-padding)",
        }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {refreshing ? (
          <div className="flex justify-center py-2">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent-primary/30 border-t-accent-primary" />
          </div>
        ) : null}
        <PageWrapper key={location.pathname} memberShell>
          {children}
        </PageWrapper>
      </main>

      <MemberTopDockBar onLogout={onLogout} online={online} />
      <FreePreviewToggle />
      <MobileAppDockBar previewOnDesktop={!mobile} onLogout={onLogout} />

      <AppCommandPalette open={commandOpen} onOpenChange={onCommandOpenChange} onQuickLog={onQuickLog} />
      <QuickLogModal open={quickLogOpen} onClose={onQuickLogClose} />
    </div>
  );
}
