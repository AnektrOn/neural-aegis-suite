import { Bell, MoreVertical } from "lucide-react";
import { NavLink } from "react-router-dom";
import { MobileDockCircleMenu } from "@/components/MobileDockCircleMenu";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  DEFAULT_MOBILE_RADIAL_MENU_IDS,
  RADIAL_CATALOG,
  radialPathIsActive,
} from "@/lib/mobileRadialMenuCatalog";
import aegisLogo from "@/assets/aegis-logo.png";
import { PROMOTE_USER } from "./promoteDemoData";
import { PATH_TO_PROMOTE_SLUG } from "./promoteScenes";
import { usePromotePlayer } from "./PromotePlayerContext";

function virtualPathForScene(slug: string): string {
  const hit = Object.entries(PATH_TO_PROMOTE_SLUG).find(([, s]) => s === slug);
  if (hit) return hit[0];
  if (slug === "dashboard") return "/dashboard";
  if (slug === "welcome") return "/";
  return `/${slug}`;
}

export function PromotePhoneChrome({ children }: { children: React.ReactNode }) {
  const { t, locale } = useLanguage();
  const { sceneSlug } = usePromotePlayer();
  const dateLocale = locale === "fr" ? "fr-FR" : "en-US";
  const dateStr = new Date()
    .toLocaleDateString(dateLocale, { weekday: "short", day: "numeric", month: "short" })
    .toUpperCase();
  const virtualPath = virtualPathForScene(sceneSlug);

  const radialItems = DEFAULT_MOBILE_RADIAL_MENU_IDS.map((id) => {
    const def = RADIAL_CATALOG[id];
    const promoteSlug = PATH_TO_PROMOTE_SLUG[def.to];
    return {
      to: promoteSlug ? `/dev/promote/${promoteSlug}` : def.to,
      Icon: def.icon,
      label: t(def.labelKey),
      isActive: radialPathIsActive(virtualPath, def.to),
    };
  });
  const dockRadialHasActive = radialItems.some((item) => item.isActive);

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col bg-bg-base">
      <div
        className="absolute inset-x-0 top-0 z-50 flex flex-col bg-bg-surface/90 backdrop-blur-xl border-b border-border-subtle"
        style={{ paddingTop: "var(--safe-top)" }}
      >
        <div className="relative flex h-[var(--mobile-header-toolbar)] shrink-0 items-center justify-between box-border px-4">
          <NavLink
            to="/dev/promote/dashboard"
            end
            aria-label={t("nav.dashboard")}
            className="inline-flex h-10 w-10 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl"
          >
            <img src={aegisLogo} alt="" className="h-8 w-8 rounded-lg object-contain" />
          </NavLink>
          <div className="pointer-events-none absolute left-1/2 top-1/2 flex max-w-[55%] -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center">
            <span className="font-barlow text-[10px] font-medium uppercase leading-tight tracking-[0.22em] text-text-tertiary/80">
              {dateStr}
            </span>
            <span className="mt-0.5 font-cormorant text-[13px] font-light tracking-[0.2em] text-primary/80 leading-tight">
              AEGIS
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <span className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl p-2 text-text-tertiary">
              <Bell size={20} strokeWidth={1.5} aria-hidden />
            </span>
            <span className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl p-2 text-text-tertiary">
              <MoreVertical size={22} strokeWidth={1.5} aria-hidden />
            </span>
            <NavLink
              to="/dev/promote/persona"
              aria-label={t("nav.profile")}
              className="inline-flex h-10 w-10 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-accent-primary/25 bg-accent-primary/10 font-display text-[11px] font-medium text-accent-primary"
            >
              {PROMOTE_USER.initial}
            </NavLink>
          </div>
        </div>
      </div>

      <div
        className="mobile-main-scroll min-h-0 flex-1 overflow-y-auto px-3"
        style={{
          paddingTop: "var(--mobile-main-padding-top)",
          paddingBottom: "var(--mobile-dock-padding)",
        }}
      >
        {children}
      </div>

      <div
        role="navigation"
        aria-label={t("nav.dockMoreAria")}
        className="pointer-events-none absolute inset-x-0 bottom-0 z-40 flex justify-center"
      >
        <div className="pointer-events-auto pb-[max(0.5rem,var(--safe-bottom))] pt-1">
          <MobileDockCircleMenu
            key={sceneSlug}
            items={radialItems}
            ariaLabel={t("nav.dockMoreAria")}
            menuTitle={t("nav.dockMoreTitle")}
            hasActiveShortcut={dockRadialHasActive}
          />
        </div>
      </div>
    </div>
  );
}
