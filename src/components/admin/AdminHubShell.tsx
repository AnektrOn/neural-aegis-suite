import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  getHubItemByPath,
  resolveHubTab,
  type AdminHubTabId,
} from "@/lib/adminNavConfig";

type AdminHubShellProps = {
  pathname: string;
  panels: Partial<Record<AdminHubTabId, React.ReactNode>>;
};

export default function AdminHubShell({ pathname, panels }: AdminHubShellProps) {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();

  const hub = useMemo(() => getHubItemByPath(pathname), [pathname]);
  if (!hub) return null;

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
