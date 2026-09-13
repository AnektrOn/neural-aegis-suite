import type { MutableRefObject } from "react";
import { canRenderToolboxWidget, renderToolboxWidget } from "@/lib/toolbox-renderer-registry";
import { driveForParticleEngine } from "../toolboxParticleDrives";
import { engineIdForSlug } from "../toolboxNebulaVisuals";
import { useLiveElapsedSec } from "../useLiveExerciseElapsed";
import { useToolboxParticleDriveRef } from "../useToolboxParticleDriveRef";
import type { ToolboxNebulaPilotProps } from "./toolboxNebulaPilotTypes";
import { ToolboxParticleShell } from "./ToolboxParticleShell";
import type { ToolboxV3Drive } from "./ToolboxParticleEngine";

interface ToolboxParticleGenericProps extends ToolboxNebulaPilotProps {}

export function ToolboxParticleGeneric({
  slug,
  item,
  locale,
  embedded,
  variant = "panel",
  sessionKey,
  onComplete,
  onAbandon,
}: ToolboxParticleGenericProps) {
  const liveElapsedRef = useLiveElapsedSec(0, true, false);
  const driveRef = useToolboxParticleDriveRef<ToolboxV3Drive>(() =>
    driveForParticleEngine(slug, liveElapsedRef.current, true),
  );
  const engine = engineIdForSlug(slug);
  const split = engine === "stream";
  const canRender = canRenderToolboxWidget(item);

  // #region agent log
  fetch("http://127.0.0.1:7734/ingest/5c724db7-3dd7-4e14-aa0c-d7fe395f7450", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "c757ff" },
    body: JSON.stringify({
      sessionId: "c757ff",
      runId: "journal-panel-pre",
      hypothesisId: "H1-H3-H5",
      location: "ToolboxParticleGeneric.tsx:render",
      message: "particle generic journal routing",
      data: { slug, engine, split, canRender, overlay: split ? "split" : "chrome" },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  return (
    <ToolboxParticleShell
      driveRef={driveRef as MutableRefObject<ToolboxV3Drive>}
      embedded={embedded}
      variant={variant}
      overlay={split ? "split" : "chrome"}
      label="Particules"
    >
      {canRender ? (
        renderToolboxWidget({
          item,
          locale,
          title: item.title,
          hideTitle: true,
          sessionKey,
          onComplete,
          onAbandon,
        })
      ) : (
        <p className="text-center text-sm text-muted-foreground">{item.title}</p>
      )}
    </ToolboxParticleShell>
  );
}
