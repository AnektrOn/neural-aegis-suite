import { useMemo, useState } from "react";
import { Eye } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import type { Locale } from "@/i18n/translations";
import {
  pickCatalogTemplateDescription,
  pickCatalogTemplateDisplayTitle,
} from "@/lib/catalog-i18n";
import {
  canRenderToolboxWidget,
  renderToolboxWidget,
} from "@/lib/toolbox-renderer-registry";
import type { ToolboxContentTypeDefinition } from "@/lib/toolbox-content-type-definitions";

interface PreviewArgs {
  contentType: string;
  /** Legacy single-locale title (fallback when title_i18n absent). */
  title?: string;
  title_i18n?: unknown;
  description?: string | null;
  description_i18n?: unknown;
  widgetConfig: Record<string, unknown> | null;
  externalUrl?: string | null;
  definitionsBySlug?: Record<string, ToolboxContentTypeDefinition>;
  contentTypeSlug?: string | null;
}

export default function ToolboxItemPreview({
  contentType,
  title,
  title_i18n,
  description,
  description_i18n,
  widgetConfig,
  externalUrl,
  definitionsBySlug,
  contentTypeSlug,
}: PreviewArgs) {
  const [open, setOpen] = useState(false);
  const { t, locale } = useLanguage();
  const defs = definitionsBySlug ?? {};
  const loc = locale as Locale;

  const displayTitle = useMemo(
    () => pickCatalogTemplateDisplayTitle(loc, { title, title_i18n }),
    [loc, title, title_i18n],
  );
  const displayDescription = useMemo(
    () => pickCatalogTemplateDescription(loc, { description, description_i18n }),
    [loc, description, description_i18n],
  );

  const renderableItem = {
    content_type: contentType,
    content_type_slug: contentTypeSlug ?? undefined,
    title: displayTitle,
    widget_config: widgetConfig ?? {},
    external_url: externalUrl ?? null,
  };
  const widget = canRenderToolboxWidget(renderableItem, defs)
    ? renderToolboxWidget({
        item: renderableItem,
        locale: loc,
        title: displayTitle,
        hideTitle: true,
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
          <DialogTitle className="text-lg leading-snug">{displayTitle}</DialogTitle>
          {displayDescription ? (
            <DialogDescription className="text-sm leading-relaxed">{displayDescription}</DialogDescription>
          ) : null}
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
