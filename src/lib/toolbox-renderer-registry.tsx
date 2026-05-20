import type { ReactNode } from "react";
import { BookOpen, Eye, Headphones, Heart, Link as LinkIcon, Scan, ShieldAlert, Sparkles, Stars, Target, Wind, Zap } from "lucide-react";
import BreathworkWidget from "@/components/widgets/BreathworkWidget";
import FocusIntrospectifWidget from "@/components/widgets/FocusIntrospectifWidget";
import BodyScanWidget from "@/components/widgets/BodyScanWidget";
import AffirmationsWidget from "@/components/widgets/AffirmationsWidget";
import GratitudeWidget from "@/components/widgets/GratitudeWidget";
import JournalPromptWidget from "@/components/widgets/JournalPromptWidget";
import VisualizationWidget from "@/components/widgets/VisualizationWidget";
import StopProtocolWidget from "@/components/widgets/StopProtocolWidget";
import IntentionWidget from "@/components/widgets/IntentionWidget";
import MicroPracticeWidget from "@/components/widgets/MicroPracticeWidget";
import ComposedRendererV1 from "@/components/widgets/ComposedRendererV1";
import JournalTimedWidget from "@/components/widgets/toolbox/JournalTimedWidget";
import DialoguePartsWidget from "@/components/widgets/toolbox/DialoguePartsWidget";
import DecisionMatrixWidget from "@/components/widgets/toolbox/DecisionMatrixWidget";
import EmpathyPerspectiveWidget from "@/components/widgets/toolbox/EmpathyPerspectiveWidget";
import ShadowCheckinWidget from "@/components/widgets/toolbox/ShadowCheckinWidget";
import type { Locale } from "@/i18n/translations";
import { pickWidgetCatalogCopy } from "@/lib/toolbox-widget-i18n";
import { getBuiltinToolboxContentTypeDefinition, type ToolboxContentTypeDefinition } from "@/lib/toolbox-content-type-definitions";
import {
  canResolveToolboxWidget,
  isResolverMappedSlug,
  resolveToolboxWidget,
} from "@/lib/toolbox-widget-resolver";

export interface ToolboxRenderableItem {
  id?: string;
  content_type: string;
  content_type_slug?: string | null;
  title: string;
  widget_config: Record<string, unknown> | null;
  external_url?: string | null;
}

export const TOOLBOX_TYPE_META: Record<
  string,
  { icon: typeof Headphones; color: string; labelKey: string }
> = {
  meditation: { icon: Headphones, color: "text-primary", labelKey: "toolbox.typeMeditation" },
  visualization: { icon: Sparkles, color: "text-neural-accent", labelKey: "toolbox.typeVisualization" },
  course: { icon: BookOpen, color: "text-neural-warm", labelKey: "toolbox.typeCourse" },
  breathwork: { icon: Wind, color: "text-primary", labelKey: "toolbox.typeBreathwork" },
  focus_introspectif: { icon: Eye, color: "text-neural-accent", labelKey: "toolbox.typeFocusIntrospectif" },
  body_scan: { icon: Scan, color: "text-neural-warm", labelKey: "toolbox.typeBodyScan" },
  affirmations: { icon: Stars, color: "text-primary", labelKey: "toolbox.typeAffirmations" },
  gratitude: { icon: Heart, color: "text-destructive", labelKey: "toolbox.typeGratitude" },
  journal_prompt: { icon: BookOpen, color: "text-neural-accent", labelKey: "toolbox.typeJournalPrompt" },
  external_link: { icon: LinkIcon, color: "text-muted-foreground", labelKey: "toolbox.typeExternalLink" },
  stop_protocol: { icon: ShieldAlert, color: "text-destructive", labelKey: "toolbox.typeStopProtocol" },
  intention: { icon: Target, color: "text-primary", labelKey: "toolbox.typeIntention" },
  micro_practice: { icon: Zap, color: "text-neural-accent", labelKey: "toolbox.typeMicroPractice" },
  breath_box: { icon: Wind, color: "text-primary", labelKey: "toolbox.typeBreathwork" },
  breath_coherence: { icon: Wind, color: "text-primary", labelKey: "toolbox.typeBreathwork" },
  physiological_sigh: { icon: Wind, color: "text-primary", labelKey: "toolbox.typeBreathwork" },
  vagal_hum: { icon: Wind, color: "text-primary", labelKey: "toolbox.typeBreathwork" },
  gratitude_triple: { icon: Heart, color: "text-destructive", labelKey: "toolbox.typeGratitude" },
  affirmations_cycle: { icon: Stars, color: "text-primary", labelKey: "toolbox.typeAffirmations" },
  dialogue_parts: { icon: BookOpen, color: "text-neural-accent", labelKey: "toolbox.typeJournalPrompt" },
  decision_matrix: { icon: Sparkles, color: "text-neural-accent", labelKey: "toolbox.typeVisualization" },
  shadow_checkin: { icon: Sparkles, color: "text-neural-accent", labelKey: "toolbox.typeIntention" },
};

const NATIVE_WIDGET_TYPES = new Set([
  "breathwork",
  "focus_introspectif",
  "body_scan",
  "visualization",
  "affirmations",
  "gratitude",
  "journal_prompt",
  "stop_protocol",
  "intention",
  "micro_practice",
]);

export function isInteractiveToolboxType(
  item: ToolboxRenderableItem,
  definitionsBySlug: Record<string, ToolboxContentTypeDefinition> = {},
): boolean {
  const slug = item.content_type_slug || item.content_type;
  if (slug === "external_link") return false;
  if (NATIVE_WIDGET_TYPES.has(slug)) return true;
  if (isResolverMappedSlug(slug)) return true;
  const def = definitionsBySlug[slug] || getBuiltinToolboxContentTypeDefinition(slug);
  return def?.renderer_kind === "composed_v1";
}

export function canRenderToolboxWidget(
  item: ToolboxRenderableItem,
  definitionsBySlug: Record<string, ToolboxContentTypeDefinition> = {},
): boolean {
  const slug = item.content_type_slug || item.content_type;
  const c = item.widget_config;

  if (slug === "external_link") {
    return Boolean(item.external_url);
  }

  if (NATIVE_WIDGET_TYPES.has(slug)) {
    switch (slug) {
      case "breathwork":
      case "focus_introspectif":
        return c != null;
      case "affirmations":
        return c != null && c.duration_min != null;
      case "journal_prompt":
        return !!c?.prompt?.trim();
      case "intention":
        return c != null;
      default:
        return true;
    }
  }

  return canResolveToolboxWidget(slug, c, definitionsBySlug);
}

interface RenderArgs {
  item: ToolboxRenderableItem;
  locale: Locale;
  title: string;
  hideTitle?: boolean;
  onComplete?: () => void;
  onAbandon?: () => void;
  definitionsBySlug?: Record<string, ToolboxContentTypeDefinition>;
  fallbackForExternalLink?: ReactNode;
}

function renderResolved(
  resolved: ReturnType<typeof resolveToolboxWidget>,
  args: RenderArgs,
): ReactNode {
  if (!resolved) return null;
  const { title, hideTitle, onComplete, onAbandon } = args;
  const noop = () => {};
  const safeOnComplete = onComplete ?? noop;
  const safeOnAbandon = onAbandon ?? noop;
  const cfg = resolved.config;

  switch (resolved.kind) {
    case "breathwork":
      return (
        <BreathworkWidget
          config={cfg}
          title={title}
          hideTitle={hideTitle}
          onComplete={safeOnComplete}
          onAbandon={safeOnAbandon}
          visualVariant={resolved.breathVisual}
        />
      );
    case "gratitude":
      return (
        <GratitudeWidget
          config={cfg}
          title={title}
          hideTitle={hideTitle}
          onComplete={safeOnComplete}
          onAbandon={safeOnAbandon}
        />
      );
    case "affirmations":
      return (
        <AffirmationsWidget
          config={cfg}
          title={title}
          hideTitle={hideTitle}
          onComplete={safeOnComplete}
          onAbandon={safeOnAbandon}
        />
      );
    case "intention":
      return (
        <IntentionWidget
          config={cfg}
          title={title}
          hideTitle={hideTitle}
          onComplete={safeOnComplete}
          onAbandon={safeOnAbandon}
        />
      );
    case "stop_protocol":
      return (
        <StopProtocolWidget
          config={cfg}
          title={title}
          hideTitle={hideTitle}
          onComplete={safeOnComplete}
          onAbandon={safeOnAbandon}
        />
      );
    case "visualization":
      return (
        <VisualizationWidget
          config={cfg}
          title={title}
          hideTitle={hideTitle}
          onComplete={safeOnComplete}
          onAbandon={safeOnAbandon}
        />
      );
    case "body_scan":
      return (
        <BodyScanWidget
          config={cfg}
          title={title}
          hideTitle={hideTitle}
          onComplete={safeOnComplete}
          onAbandon={safeOnAbandon}
        />
      );
    case "micro_practice":
      return (
        <MicroPracticeWidget
          config={cfg}
          title={title}
          hideTitle={hideTitle}
          onComplete={safeOnComplete}
          onAbandon={safeOnAbandon}
        />
      );
    case "journal_timed":
      return (
        <JournalTimedWidget
          config={cfg}
          title={title}
          hideTitle={hideTitle}
          onComplete={safeOnComplete}
          onAbandon={safeOnAbandon}
        />
      );
    case "dialogue_parts":
      return (
        <DialoguePartsWidget
          config={cfg}
          title={title}
          hideTitle={hideTitle}
          onComplete={safeOnComplete}
          onAbandon={safeOnAbandon}
        />
      );
    case "decision_matrix":
      return (
        <DecisionMatrixWidget
          config={cfg}
          title={title}
          hideTitle={hideTitle}
          onComplete={safeOnComplete}
          onAbandon={safeOnAbandon}
        />
      );
    case "empathy_perspective":
      return (
        <EmpathyPerspectiveWidget
          config={cfg}
          title={title}
          hideTitle={hideTitle}
          onComplete={safeOnComplete}
          onAbandon={safeOnAbandon}
        />
      );
    case "shadow_checkin":
      return (
        <ShadowCheckinWidget
          config={cfg}
          title={title}
          hideTitle={hideTitle}
          onComplete={safeOnComplete}
          onAbandon={safeOnAbandon}
        />
      );
    case "composed":
      return null;
    default:
      return null;
  }
}

export function renderToolboxWidget({
  item,
  locale,
  title,
  hideTitle,
  onComplete,
  onAbandon,
  definitionsBySlug = {},
  fallbackForExternalLink,
}: RenderArgs): ReactNode {
  const noop = () => {};
  const cfg = item.widget_config ?? {};
  const safeOnComplete = onComplete ?? noop;
  const safeOnAbandon = onAbandon ?? noop;
  const slug = item.content_type_slug || item.content_type;

  switch (slug) {
    case "breathwork":
      return (
        <BreathworkWidget
          config={cfg}
          title={title}
          hideTitle={hideTitle}
          onComplete={safeOnComplete}
          onAbandon={safeOnAbandon}
        />
      );
    case "focus_introspectif":
      return (
        <FocusIntrospectifWidget
          config={cfg}
          title={title}
          hideTitle={hideTitle}
          onComplete={safeOnComplete}
          onAbandon={safeOnAbandon}
        />
      );
    case "body_scan":
      return (
        <BodyScanWidget
          config={cfg}
          title={title}
          hideTitle={hideTitle}
          onComplete={safeOnComplete}
          onAbandon={safeOnAbandon}
        />
      );
    case "affirmations":
      if (cfg?.duration_min == null) return null;
      return (
        <AffirmationsWidget
          config={cfg}
          title={title}
          hideTitle={hideTitle}
          onComplete={safeOnComplete}
          onAbandon={safeOnAbandon}
        />
      );
    case "visualization":
      return (
        <VisualizationWidget
          config={cfg}
          title={title}
          hideTitle={hideTitle}
          onComplete={safeOnComplete}
          onAbandon={safeOnAbandon}
        />
      );
    case "stop_protocol":
      return (
        <StopProtocolWidget
          config={cfg}
          title={title}
          hideTitle={hideTitle}
          onComplete={safeOnComplete}
          onAbandon={safeOnAbandon}
        />
      );
    case "intention":
      return (
        <IntentionWidget
          config={cfg}
          title={title}
          hideTitle={hideTitle}
          onComplete={safeOnComplete}
          onAbandon={safeOnAbandon}
        />
      );
    case "gratitude":
      return (
        <GratitudeWidget
          config={cfg}
          title={title}
          hideTitle={hideTitle}
          onComplete={safeOnComplete}
          onAbandon={safeOnAbandon}
        />
      );
    case "micro_practice":
      return (
        <MicroPracticeWidget
          config={cfg}
          title={title}
          hideTitle={hideTitle}
          onComplete={safeOnComplete}
          onAbandon={safeOnAbandon}
        />
      );
    case "journal_prompt": {
      const prompt = pickWidgetCatalogCopy(locale, cfg?.prompt_i18n, cfg?.prompt);
      if (!prompt?.trim()) return null;
      return (
        <JournalPromptWidget
          config={{ ...cfg, prompt }}
          title={title}
          hideTitle={hideTitle}
          onComplete={safeOnComplete}
          onAbandon={safeOnAbandon}
        />
      );
    }
    case "external_link":
      return item.external_url
        ? (
            <a
              href={item.external_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-primary underline"
            >
              {item.external_url}
            </a>
          )
        : (fallbackForExternalLink ?? null);
    default: {
      const resolved = resolveToolboxWidget(slug, cfg as Record<string, unknown>, definitionsBySlug);
      if (resolved && resolved.kind !== "composed") {
        return renderResolved(resolved, {
          item,
          locale,
          title,
          hideTitle,
          onComplete,
          onAbandon,
          definitionsBySlug,
          fallbackForExternalLink,
        });
      }
      const def = definitionsBySlug[slug] || getBuiltinToolboxContentTypeDefinition(slug);
      if (def?.renderer_kind !== "composed_v1" && !resolved) return null;
      return (
        <ComposedRendererV1
          config={cfg}
          title={title}
          hideTitle={hideTitle}
          onComplete={safeOnComplete}
          onAbandon={safeOnAbandon}
          blueprint={def?.ui_blueprint}
        />
      );
    }
  }
}
