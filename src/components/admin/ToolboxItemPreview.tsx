import { useMemo, useState } from "react";
import { Eye, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import type { Locale } from "@/i18n/translations";
import {
  pickCatalogTemplateDescription,
  pickCatalogTemplateDisplayTitle,
} from "@/lib/catalog-i18n";
import type { ToolboxContentTypeDefinition } from "@/lib/toolbox-content-type-definitions";
import { ToolboxNebulaExerciseView } from "@/features/toolbox/nebula/ToolboxNebulaExerciseView";

interface PreviewArgs {
  contentType: string;
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
  contentTypeSlug,
}: PreviewArgs) {
  const [open, setOpen] = useState(false);
  const { t, locale } = useLanguage();
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="default" className="w-full sm:w-auto">
          <Eye className="size-4" aria-hidden />
          {t("admin.toolboxMgmt.preview")}
        </Button>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="fixed inset-0 left-0 top-0 z-50 h-[100dvh] w-screen max-w-none translate-x-0 translate-y-0 gap-0 overflow-hidden rounded-none border-0 bg-black p-0"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-3 p-3 sm:p-4">
          <div className="pointer-events-auto min-w-0 max-w-[min(100%,20rem)] rounded-2xl border border-border/30 bg-background/70 px-3 py-2 backdrop-blur-md sm:max-w-xs sm:px-4">
            <p className="truncate text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {t("admin.toolboxMgmt.preview")}
            </p>
            <p className="truncate text-sm font-medium text-foreground">{displayTitle}</p>
            {displayDescription ? (
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{displayDescription}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="pointer-events-auto flex min-h-[40px] min-w-[40px] items-center justify-center rounded-full border border-border/40 bg-background/70 text-muted-foreground backdrop-blur-md transition-colors hover:text-foreground"
            aria-label={t("general.close")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="relative h-full min-h-0 w-full">
          <ToolboxNebulaExerciseView
            item={renderableItem}
            locale={loc}
            title={displayTitle}
            variant="modal"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
