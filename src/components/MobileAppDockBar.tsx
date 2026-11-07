import { useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { LogOut, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MobileDockCircleMenu } from "@/components/MobileDockCircleMenu";
import type { MobileDockCircleItem } from "@/components/MobileDockCircleMenu";
import { useAdmin } from "@/hooks/use-admin";
import { useUserMenuPrefs } from "@/hooks/useUserMenuPrefs";
import { useLanguage } from "@/i18n/LanguageContext";
import { panelPathIsActive } from "@/lib/appNavConfig";
import { getMenuPanel } from "@/lib/userMenuCatalog";
import { visibleDockPanels, visibleOverflowPanels } from "@/lib/userMenuPreferences";
import { cn } from "@/lib/utils";

export type MobileAppDockBarProps = {
  /** When true, show on md+ (dev lab preview). Default: mobile-only (`md:hidden`). */
  previewOnDesktop?: boolean;
  /** `fixed` for AppLayout; `absolute` for nested phone chrome; `relative` for stacked lab frames. */
  position?: "fixed" | "absolute" | "relative";
  className?: string;
  radialOpen?: boolean;
  onRadialOpenChange?: (open: boolean) => void;
  onLogout?: () => void;
};

export function MobileAppDockBar({
  previewOnDesktop = false,
  position = "fixed",
  className,
  radialOpen: radialOpenProp,
  onRadialOpenChange,
  onLogout,
}: MobileAppDockBarProps) {
  const [radialOpenInternal, setRadialOpenInternal] = useState(false);
  const radialOpen = radialOpenProp ?? radialOpenInternal;
  const setRadialOpen = onRadialOpenChange ?? setRadialOpenInternal;

  const location = useLocation();
  const { t } = useLanguage();
  const { prefs } = useUserMenuPrefs();
  const { isAdmin } = useAdmin();

  const { dockItems, radialItems, overflowHasActive } = useMemo(() => {
    const dockIds = visibleDockPanels(prefs);
    const dockItems = dockIds.map((id) => {
      const def = getMenuPanel(id);
      return {
        id: def.id,
        to: def.to,
        Icon: def.icon,
        label: t(def.labelKey),
        isActive: panelPathIsActive(location.pathname, def.to),
      };
    });

    const dockPaths = new Set(dockItems.map((item) => item.to));
    const overflowPaths = new Set<string>();
    const overflowItems: MobileDockCircleItem[] = [];
    for (const id of visibleOverflowPanels(prefs)) {
      const def = getMenuPanel(id);
      // Avoid duplicate destinations (e.g. portrait_hub + persona → /persona).
      if (dockPaths.has(def.to) || overflowPaths.has(def.to)) continue;
      overflowPaths.add(def.to);
      overflowItems.push({
        to: def.to,
        Icon: def.icon,
        label: t(def.labelKey),
        isActive: panelPathIsActive(location.pathname, def.to),
      });
    }

    const radialItems: MobileDockCircleItem[] = isAdmin
      ? [
          ...overflowItems,
          {
            to: "/admin",
            Icon: Shield,
            label: t("nav.admin"),
            isActive: location.pathname.startsWith("/admin"),
          },
        ]
      : overflowItems;

    const overflowHasActive = radialItems.some((item) => item.isActive);

    return { dockItems, radialItems, overflowHasActive };
  }, [prefs, location.pathname, t, isAdmin]);

  return (
    <div
      role="navigation"
      aria-label={t("nav.dockMoreAria")}
      className={cn(
        "pointer-events-none inset-x-0 bottom-0 flex justify-center border-0",
        position === "fixed" ? "fixed" : position === "relative" ? "relative" : "absolute",
        previewOnDesktop ? "flex" : "md:hidden",
        radialOpen ? "z-[130]" : "z-[60]",
        className,
      )}
    >
      <div className="pointer-events-auto flex max-w-[min(100vw-1rem,420px)] items-end justify-center gap-1 rounded-2xl border-0 bg-[hsl(var(--background)/0.72)] px-2 pb-[max(0.5rem,var(--safe-bottom))] pt-1 shadow-[0_-8px_24px_hsl(0_0%_0%/0.18)] backdrop-blur-[12px]">
        {dockItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.to}
            aria-label={item.label}
            className={cn(
              "inline-flex h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 flex-col items-center justify-center rounded-xl transition-colors active:scale-[0.98]",
              item.isActive
                ? "bg-accent-primary/12 text-accent-primary ring-1 ring-accent-primary/35"
                : "text-muted-foreground/80 hover:bg-bg-elevated/70 hover:text-foreground",
            )}
            style={{ WebkitTapHighlightColor: "transparent", touchAction: "manipulation" } as React.CSSProperties}
          >
            <item.Icon size={20} strokeWidth={1.5} aria-hidden />
          </NavLink>
        ))}
        <MobileDockCircleMenu
          items={radialItems}
          ariaLabel={t("nav.dockMoreAria")}
          menuTitle={t("nav.dockMoreTitle")}
          hasActiveShortcut={overflowHasActive}
          onOpenChange={setRadialOpen}
        />
        {onLogout && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11 shrink-0 text-muted-foreground hover:text-destructive"
                aria-label={t("nav.logout")}
                onClick={onLogout}
              >
                <LogOut size={20} strokeWidth={1.5} aria-hidden />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("nav.logout")}</TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
