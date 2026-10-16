import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import type { Locale } from "@/i18n/translations";
import {
  canRenderToolboxWidget,
  renderToolboxWidget,
  type ToolboxRenderableItem,
} from "@/lib/toolbox-renderer-registry";
import { resolveToolboxContentSlug } from "@/lib/toolbox-content-slug";
import type { ToolboxOnAbandon, ToolboxOnComplete } from "@/lib/toolbox-completion";
import {
  isAudioVisualSlug,
  isMatterVisualSlug,
  isParticleVisualSlug,
} from "@/features/toolbox/nebula/toolboxNebulaVisuals";
import { ToolboxParticlePilot } from "@/features/toolbox/nebula/pilots/ToolboxParticlePilot";
import { ToolboxMatterPilot } from "@/features/toolbox/nebula/pilots/ToolboxMatterPilot";

const MeditationNebula = lazy(() =>
  import("@/features/meditation/components/MeditationNebula").then((mod) => ({
    default: mod.MeditationNebula,
  })),
);

export interface ToolboxNebulaExerciseViewProps {
  item: ToolboxRenderableItem;
  locale: Locale;
  title: string;
  variant?: "modal" | "panel";
  embedded?: boolean;
  sessionKey?: string;
  onComplete?: ToolboxOnComplete;
  onAbandon?: ToolboxOnAbandon;
}

function resolveExerciseSlug(item: ToolboxRenderableItem): string {
  const raw = item.content_type_slug || item.content_type;
  return resolveToolboxContentSlug(raw, item.widget_config);
}

export function ToolboxNebulaExerciseView({
  item,
  locale,
  title,
  variant = "modal",
  embedded = false,
  sessionKey,
  onComplete,
  onAbandon,
}: ToolboxNebulaExerciseViewProps) {
  const slug = resolveExerciseSlug(item);
  const pilotProps = {
    slug,
    item: { ...item, title },
    locale,
    embedded,
    variant,
    sessionKey,
    onComplete,
    onAbandon,
  };

  if (isParticleVisualSlug(slug)) {
    return <ToolboxParticlePilot {...pilotProps} />;
  }

  if (isMatterVisualSlug(slug)) {
    return <ToolboxMatterPilot {...pilotProps} />;
  }

  if (isAudioVisualSlug(slug)) {
    return (
      <div className="relative min-h-[min(70dvh,560px)] overflow-hidden rounded-[inherit] bg-background">
        <Suspense
          fallback={
            <div className="flex min-h-[min(70dvh,560px)] items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          }
        >
          <MeditationNebula className="absolute inset-0" />
        </Suspense>
      </div>
    );
  }

  if (canRenderToolboxWidget(item)) {
    return (
      <div className="min-h-[min(70dvh,560px)] rounded-[inherit] border border-border/30 bg-background/90 p-4">
        {renderToolboxWidget({
          item,
          locale,
          title,
          hideTitle: true,
          sessionKey,
          onComplete,
          onAbandon,
        })}
      </div>
    );
  }

  return (
    <p className="py-8 text-center text-sm text-muted-foreground">{title}</p>
  );
}
