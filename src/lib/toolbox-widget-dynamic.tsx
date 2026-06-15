import { Suspense, lazy, type ComponentType, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import type { ToolboxOnAbandon, ToolboxOnComplete } from "@/lib/toolbox-completion";

export type DynamicToolboxWidgetKind =
  | "breathwork"
  | "focus_introspectif"
  | "body_scan"
  | "affirmations"
  | "gratitude"
  | "journal_prompt"
  | "visualization"
  | "stop_protocol"
  | "intention"
  | "micro_practice"
  | "journal_timed"
  | "dialogue_parts"
  | "decision_matrix"
  | "empathy_perspective"
  | "shadow_checkin"
  | "composed_v1";

const WIDGET_LOADERS = {
  breathwork: () => import("@/components/widgets/BreathworkWidget"),
  focus_introspectif: () => import("@/components/widgets/FocusIntrospectifWidget"),
  body_scan: () => import("@/components/widgets/BodyScanWidget"),
  affirmations: () => import("@/components/widgets/AffirmationsWidget"),
  gratitude: () => import("@/components/widgets/GratitudeWidget"),
  journal_prompt: () => import("@/components/widgets/JournalPromptWidget"),
  visualization: () => import("@/components/widgets/VisualizationWidget"),
  stop_protocol: () => import("@/components/widgets/StopProtocolWidget"),
  intention: () => import("@/components/widgets/IntentionWidget"),
  micro_practice: () => import("@/components/widgets/MicroPracticeWidget"),
  journal_timed: () => import("@/components/widgets/toolbox/JournalTimedWidget"),
  dialogue_parts: () => import("@/components/widgets/toolbox/DialoguePartsWidget"),
  decision_matrix: () => import("@/components/widgets/toolbox/DecisionMatrixWidget"),
  empathy_perspective: () => import("@/components/widgets/toolbox/EmpathyPerspectiveWidget"),
  shadow_checkin: () => import("@/components/widgets/toolbox/ShadowCheckinWidget"),
  composed_v1: () => import("@/components/widgets/ComposedRendererV1"),
} as const;

const lazyWidgets = Object.fromEntries(
  Object.entries(WIDGET_LOADERS).map(([kind, loader]) => [
    kind,
    lazy(() => loader().then((m) => ({ default: m.default as ComponentType<Record<string, unknown>> }))),
  ]),
) as unknown as Record<DynamicToolboxWidgetKind, ComponentType<Record<string, unknown>>>;

function WidgetFallback() {
  return (
    <div className="flex min-h-[8rem] items-center justify-center text-muted-foreground">
      <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
      <span className="sr-only">Loading widget…</span>
    </div>
  );
}

export interface DynamicToolboxWidgetProps {
  kind: DynamicToolboxWidgetKind;
  widgetProps: Record<string, unknown>;
  fallback?: ReactNode;
}

export function DynamicToolboxWidget({ kind, widgetProps, fallback }: DynamicToolboxWidgetProps) {
  const Widget = lazyWidgets[kind];
  if (!Widget) return fallback ?? null;
  return (
    <Suspense fallback={fallback ?? <WidgetFallback />}>
      <Widget {...widgetProps} />
    </Suspense>
  );
}

export type { ToolboxOnComplete, ToolboxOnAbandon };
