import { useState } from "react";
import { Library, FileText, Sparkles } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProgramBuilder from "@/pages/admin/ProgramBuilder";
import ToolboxWaitingConfirmation from "@/pages/admin/ToolboxWaitingConfirmation";
import ToolboxMarkdownImportTab from "@/features/toolbox-admin/ToolboxMarkdownImportTab";
import { cn } from "@/lib/utils";

const tabTriggerClass =
  "min-h-11 gap-2 text-xs uppercase tracking-wider data-[state=active]:bg-accent-warning/15 data-[state=active]:text-accent-warning";

export default function ToolboxStudio() {
  const { t } = useLanguage();
  const [importKey, setImportKey] = useState(0);

  return (
    <Tabs defaultValue="catalog" className="space-y-6">
      <TabsList className="ethereal-glass flex h-auto min-h-11 w-full flex-wrap justify-start gap-1 p-1">
        <TabsTrigger value="catalog" className={cn(tabTriggerClass, "shrink-0")}>
          <Library className="size-4" aria-hidden />
          {t("admin.hub.tab.toolboxStudioCatalog")}
        </TabsTrigger>
        <TabsTrigger value="import-md" className={cn(tabTriggerClass, "shrink-0")}>
          <FileText className="size-4" aria-hidden />
          {t("admin.hub.tab.toolboxStudioImportMd")}
        </TabsTrigger>
        <TabsTrigger value="types" className={cn(tabTriggerClass, "shrink-0")}>
          <Sparkles className="size-4" aria-hidden />
          {t("admin.hub.tab.toolboxStudioTypes")}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="catalog" className="mt-0 focus-visible:outline-none">
        <ProgramBuilder />
      </TabsContent>

      <TabsContent value="import-md" className="mt-0 focus-visible:outline-none">
        <ToolboxMarkdownImportTab key={importKey} onImported={() => setImportKey((k) => k + 1)} />
      </TabsContent>

      <TabsContent value="types" className="mt-0 focus-visible:outline-none">
        <ToolboxWaitingConfirmation />
      </TabsContent>
    </Tabs>
  );
}
