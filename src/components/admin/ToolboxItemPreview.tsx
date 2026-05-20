import { useState } from "react";
import { Eye } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  canRenderToolboxWidget,
  renderToolboxWidget,
} from "@/lib/toolbox-renderer-registry";
import type { ToolboxContentTypeDefinition } from "@/lib/toolbox-content-type-definitions";

interface PreviewArgs {
  contentType: string;
  title: string;
  description?: string | null;
  widgetConfig: Record<string, unknown> | null;
  externalUrl?: string | null;
  definitionsBySlug?: Record<string, ToolboxContentTypeDefinition>;
  contentTypeSlug?: string | null;
}

export default function ToolboxItemPreview({
  contentType, title, description, widgetConfig, externalUrl, definitionsBySlug, contentTypeSlug,
}: PreviewArgs) {
  const [open, setOpen] = useState(false);
  const { t, locale } = useLanguage();
  const defs = definitionsBySlug ?? {};
  const renderableItem = {
    content_type: contentType,
    content_type_slug: contentTypeSlug ?? undefined,
    title,
    widget_config: widgetConfig ?? {},
    external_url: externalUrl ?? null,
  };
  const widget = canRenderToolboxWidget(renderableItem, defs)
    ? renderToolboxWidget({
        item: renderableItem,
        locale,
        title,
        definitionsBySlug: defs,
        fallbackForExternalLink: (
          <p className="text-sm text-muted-foreground">{t("toolbox.noContentAssigned")}</p>
        ),
      })
    : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="default" className="w-full sm:w-auto">
          <Eye className="size-4" aria-hidden />
          {t("admin.toolboxMgmt.preview")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader className="space-y-2 text-left">
          <DialogTitle className="text-lg leading-snug">{title}</DialogTitle>
          {description ? <DialogDescription className="text-sm leading-relaxed">{description}</DialogDescription> : null}
        </DialogHeader>
        <div className="pt-2">
          {widget ?? (
            <p className="text-sm text-muted-foreground">{t("admin.toolboxMgmt.previewUnavailable")}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
