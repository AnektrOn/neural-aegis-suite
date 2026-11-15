import { Component, useMemo, useState, type ErrorInfo, type ReactNode } from "react";
import { Eye, Layers, Sparkles, X, AlertCircle } from "lucide-react";
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
import {
  canRenderToolboxWidget,
  renderToolboxWidget,
} from "@/lib/toolbox-renderer-registry";
import { ToolboxNebulaExerciseView } from "@/features/toolbox/nebula/ToolboxNebulaExerciseView";
import { cn } from "@/lib/utils";

interface PreviewErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
  onError?: () => void;
}

interface PreviewErrorBoundaryState {
  hasError: boolean;
}

class PreviewErrorBoundary extends Component<
  PreviewErrorBoundaryProps,
  PreviewErrorBoundaryState
> {
  constructor(props: PreviewErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): PreviewErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn("[ToolboxItemPreview] Player render failed, falling back to widget:", error, info);
    this.props.onError?.();
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

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
  definitionsBySlug = {},
  contentTypeSlug,
}: PreviewArgs) {
  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"player" | "widget">("player");
  const [playerError, setPlayerError] = useState(false);
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

  const renderableItem = useMemo(
    () => ({
      content_type: contentType,
      content_type_slug: contentTypeSlug ?? undefined,
      title: displayTitle,
      widget_config: widgetConfig ?? {},
      external_url: externalUrl ?? null,
    }),
    [contentType, contentTypeSlug, displayTitle, widgetConfig, externalUrl],
  );

  const canRenderWidget = canRenderToolboxWidget(renderableItem, definitionsBySlug);

  const widgetView = (
    <div className="flex h-full min-h-0 w-full items-center justify-center overflow-y-auto p-4 sm:p-6 pt-20">
      <div className="w-full max-w-2xl rounded-2xl border border-border/40 bg-background/95 p-5 sm:p-6 shadow-2xl backdrop-blur-md">
        {playerError && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
            <AlertCircle size={14} className="shrink-0" />
            <span>
              {locale === "en"
                ? "3D animation player unavailable in this environment — showing interactive widget."
                : "Player 3D non disponible dans cet environnement — affichage du widget interactif."}
            </span>
          </div>
        )}
        {canRenderWidget ? (
          renderToolboxWidget({
            item: renderableItem,
            locale: loc,
            title: displayTitle,
            definitionsBySlug,
            fallbackForExternalLink: (
              <p className="text-sm text-muted-foreground">{t("toolbox.noContentAssigned")}</p>
            ),
          })
        ) : (
          <div className="py-8 text-center space-y-2">
            <p className="text-base font-medium text-foreground">{displayTitle}</p>
            {displayDescription ? (
              <p className="text-xs text-muted-foreground max-w-md mx-auto">{displayDescription}</p>
            ) : null}
            <p className="text-xs text-muted-foreground/70 italic pt-2">
              {t("admin.toolboxMgmt.previewUnavailable")}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setPlayerError(false);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="default" className="w-full sm:w-auto">
          <Eye className="size-4" aria-hidden />
          {t("admin.toolboxMgmt.preview")}
        </Button>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        overlayClassName="hidden"
        className="fixed inset-0 left-0 top-0 z-[150] h-[100dvh] w-screen max-w-none translate-x-0 translate-y-0 gap-0 overflow-hidden rounded-none border-0 bg-[radial-gradient(ellipse_at_center,_rgba(15,23,42,0.98)_0%,_rgba(3,7,18,0.99)_100%)] p-0"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-3 p-3 sm:p-4">
          <div className="pointer-events-auto min-w-0 max-w-[min(100%,20rem)] rounded-2xl border border-border/30 bg-background/80 px-3 py-2 backdrop-blur-md sm:max-w-xs sm:px-4">
            <p className="truncate text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {t("admin.toolboxMgmt.preview")}
            </p>
            <p className="truncate text-sm font-medium text-foreground">{displayTitle}</p>
            {displayDescription ? (
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{displayDescription}</p>
            ) : null}
          </div>

          <div className="pointer-events-auto flex items-center gap-2">
            <div className="flex items-center rounded-full border border-border/40 bg-background/80 p-0.5 backdrop-blur-md">
              <button
                type="button"
                onClick={() => setViewMode("player")}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium tracking-wide transition-colors",
                  viewMode === "player" && !playerError
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Sparkles size={11} />
                <span>{locale === "en" ? "Player 3D" : "Player 3D"}</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("widget")}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium tracking-wide transition-colors",
                  viewMode === "widget" || playerError
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Layers size={11} />
                <span>{locale === "en" ? "Widget Card" : "Fiche Widget"}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-full border border-border/40 bg-background/80 text-muted-foreground backdrop-blur-md transition-colors hover:text-foreground"
              aria-label={t("general.close")}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="relative h-full min-h-0 w-full">
          {viewMode === "player" && !playerError ? (
            <PreviewErrorBoundary
              fallback={widgetView}
              onError={() => setPlayerError(true)}
            >
              <ToolboxNebulaExerciseView
                item={renderableItem}
                locale={loc}
                title={displayTitle}
                variant="modal"
              />
            </PreviewErrorBoundary>
          ) : (
            widgetView
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
