import { useState } from "react";
import { FileText } from "lucide-react";
import ToolboxMarkdownImportTab from "@/features/toolbox-admin/ToolboxMarkdownImportTab";
import { ToolboxPanel } from "@/components/admin/toolbox/ToolboxAdminUi";
import { useLanguage } from "@/i18n/LanguageContext";

export default function ToolboxImportPanel() {
  const { t } = useLanguage();
  const [importKey, setImportKey] = useState(0);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 pb-16">
      <header className="space-y-3 border-b border-border/40 pb-6">
        <p className="text-xs font-medium uppercase tracking-widest text-text-secondary">
          {t("admin.hub.tab.toolboxImportMd")}
        </p>
        <h2 className="text-2xl font-semibold text-text-primary md:text-3xl">
          {t("admin.toolboxImport.title")}
        </h2>
        <p className="max-w-2xl text-sm text-muted-foreground">{t("admin.toolboxImport.description")}</p>
      </header>

      <ToolboxPanel title={t("admin.toolboxImport.panelTitle")} description={t("admin.toolboxImport.panelDesc")} highlight>
        <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
          <FileText className="size-3.5" aria-hidden />
          {t("admin.toolboxImport.batchLabel")}
        </div>
        <ToolboxMarkdownImportTab key={importKey} onImported={() => setImportKey((k) => k + 1)} />
      </ToolboxPanel>
    </div>
  );
}
