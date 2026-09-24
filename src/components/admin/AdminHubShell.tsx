import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { usePlatformRoles } from "@/hooks/use-admin";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  COMPANY_ADMIN_ALLOWED_TABS,
  getHubItemByPath,
  resolveHubTab,
  type AdminHubTabId,
  type AdminNavHubItem,
} from "@/lib/adminNavConfig";

type AdminHubShellProps = {
  pathname: string;
  panels: Partial<Record<AdminHubTabId, React.ReactNode>>;
};

function hubForRole(
  hub: AdminNavHubItem,
  isSuperAdmin: boolean,
  isCompanyAdmin: boolean,
): AdminNavHubItem {
  if (isSuperAdmin || !isCompanyAdmin) return hub;
  const allowed = COMPANY_ADMIN_ALLOWED_TABS[hub.to];
  if (!allowed) return { ...hub, tabs: [] };
  const tabs = hub.tabs.filter((t) => allowed.has(t.id));
  const defaultTab = allowed.has(hub.defaultTab) ? hub.defaultTab : (tabs[0]?.id ?? hub.defaultTab);
  return { ...hub, tabs, defaultTab };
}

export default function AdminHubShell({ pathname, panels }: AdminHubShellProps) {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isSuperAdmin, isCompanyAdmin } = usePlatformRoles();

  const hub = useMemo(() => {
    const raw = getHubItemByPath(pathname);
    if (!raw) return null;
    return hubForRole(raw, isSuperAdmin, isCompanyAdmin);
  }, [pathname, isSuperAdmin, isCompanyAdmin]);

  if (!hub || hub.tabs.length === 0) return null;

  const tabParam = searchParams.get("tab");
  const activeTab = resolveHubTab(hub, tabParam);

  const onTabChange = (value: string) => {
    setSearchParams({ tab: value }, { replace: true });
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-neural-label text-neural-accent/60">{t("admin.hub.kicker")}</p>
        <h1 className="text-neural-title text-2xl md:text-3xl text-foreground">{t(hub.titleKey)}</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">{t(hub.descriptionKey)}</p>
      </header>

      <Tabs value={activeTab} onValueChange={onTabChange} className="space-y-6">
        <TabsList
          className={cn(
            "flex h-auto min-h-11 w-full justify-start gap-1 overflow-x-auto rounded-xl bg-bg-elevated/80 p-1",
            "scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          )}
        >
          {hub.tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="min-h-11 shrink-0 px-4 text-xs uppercase tracking-wider data-[state=active]:bg-accent-warning/15 data-[state=active]:text-accent-warning"
            >
              {t(tab.labelKey)}
            </TabsTrigger>
          ))}
        </TabsList>

        {hub.tabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="mt-0 focus-visible:outline-none">
            {panels[tab.id] ?? null}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
