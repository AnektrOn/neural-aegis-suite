import type { ReactNode, MutableRefObject } from "react";
import { useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ToolboxParticleEngine,
  type ToolboxV3Drive,
} from "./ToolboxParticleEngine";
import type { ToolboxShapeId } from "../toolboxParticleShapes";
import { ToolboxOverlayChrome } from "./ToolboxOverlayChrome";

interface ToolboxParticleShellProps {
  driveRef: MutableRefObject<ToolboxV3Drive>;
  variant?: "modal" | "panel";
  embedded?: boolean;
  label?: string;
  children: ReactNode;
  className?: string;
  figure?: string;
  overlay?: "chrome" | "split";
  baseHue?: number;
  hueVariance?: number;
  initialShape?: ToolboxShapeId;
  headerControls?: ReactNode;
}

export function ToolboxParticleShell({
  driveRef,
  variant = "panel",
  embedded = false,
  label = "Particules",
  children,
  className,
  overlay = "chrome",
  baseHue = 185,
  hueVariance = 14,
  initialShape = "sphere",
  headerControls,
}: ToolboxParticleShellProps) {
  const isModal = variant === "modal";
  const splitPanelRef = useRef<HTMLDivElement | null>(null);
  const isLungAnatomy = initialShape === "lungs";
  const frameClass = cn(
    "relative overflow-hidden",
    isModal
      ? "h-full min-h-[100dvh] rounded-none"
      : cn(
          "rounded-xl border border-violet-500/25",
          embedded ? "min-h-[min(52dvh,520px)]" : "min-h-[min(72dvh,680px)]",
        ),
    overlay === "split" && "flex flex-col",
    className,
  );

  const underlay = isLungAnatomy ? (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 bg-black" />
  ) : (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_rgba(10,6,22,0.95)_0%,_rgba(3,2,8,0.98)_75%)]"
    />
  );

  useEffect(() => {
    if (overlay !== "split") return;
    const node = splitPanelRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    // #region agent log
    fetch("http://127.0.0.1:7734/ingest/5c724db7-3dd7-4e14-aa0c-d7fe395f7450", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "c757ff" },
      body: JSON.stringify({
        sessionId: "c757ff",
        runId: "journal-panel-pre",
        hypothesisId: "H2-H4",
        location: "ToolboxParticleShell.tsx:splitPanel",
        message: "split bottom panel geometry",
        data: {
          overlay,
          variant,
          embedded,
          panelHeight: Math.round(rect.height),
          panelWidth: Math.round(rect.width),
          childCount: node.childElementCount,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
  }, [overlay, variant, embedded, children]);

  if (overlay === "split") {
    return (
      <div className={frameClass}>
        <div className="relative min-h-0 flex-1">
          {underlay}
          <ToolboxParticleEngine
            driveRef={driveRef}
            className="z-[1]"
            baseHue={baseHue}
            hueVariance={hueVariance}
            initialShape={initialShape}
          >
            {headerControls ? (
              <div className="pointer-events-none absolute inset-x-0 top-3 z-20 flex justify-between gap-3 px-4">
                {headerControls}
              </div>
            ) : null}
            <div
              className={cn(
                "absolute left-1/2 z-10 -translate-x-1/2",
                headerControls ? "top-12" : "top-2",
              )}
            >
              <Badge
                variant="secondary"
                className="border-violet-400/25 bg-black/40 text-[10px] uppercase tracking-wider text-violet-100 backdrop-blur-sm"
              >
                {label}
              </Badge>
            </div>
          </ToolboxParticleEngine>
        </div>
        <div
          ref={splitPanelRef}
          data-slot="toolbox-split-panel"
          className="relative z-10 flex-[0_0_min(48%,28rem)] min-h-[14rem] max-h-[52%] shrink-0 overflow-y-auto border-t border-border/25 bg-background/70 p-3 backdrop-blur-md sm:p-4 [-webkit-overflow-scrolling:touch]"
        >
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className={frameClass}>
      {underlay}
      <ToolboxParticleEngine
        driveRef={driveRef}
        className="z-[1]"
        baseHue={baseHue}
        hueVariance={hueVariance}
        initialShape={initialShape}
      >
        {headerControls ? (
          <div className="pointer-events-none absolute inset-x-0 top-3 z-20 flex justify-between gap-3 px-4">
            {headerControls}
          </div>
        ) : null}
        <div
          className={cn(
            "absolute left-1/2 z-10 -translate-x-1/2",
            headerControls ? "top-12" : "top-2",
          )}
        >
          <Badge
            variant="secondary"
            className="border-violet-400/25 bg-black/40 text-[10px] uppercase tracking-wider text-violet-100 backdrop-blur-sm"
          >
            {label}
          </Badge>
        </div>
        <ToolboxOverlayChrome>{children}</ToolboxOverlayChrome>
      </ToolboxParticleEngine>
    </div>
  );
}
