import type { MutableRefObject } from "react";
import type { BodyScanConfig } from "@/components/widgets/BodyScanWidget";
import type { MicroPracticeConfig } from "@/components/widgets/MicroPracticeWidget";
import { applySlugTheme } from "@/lib/toolbox-slug-themes";
import { canRenderToolboxWidget, renderToolboxWidget } from "@/lib/toolbox-renderer-registry";
import {
  BODY_MOVE_NEBULA_SLUGS,
  BODY_SCAN_NEBULA_SLUGS,
} from "../toolboxBodyNebula";
import { driveForMatterEngine } from "../toolboxMatterDrives";
import { useLiveElapsedSec } from "../useLiveExerciseElapsed";
import { useToolboxParticleDriveRef } from "../useToolboxParticleDriveRef";
import type { ToolboxNebulaPilotProps } from "./toolboxNebulaPilotTypes";
import { ToolboxMatterBodyScan } from "./ToolboxMatterBodyScan";
import { ToolboxMatterMovement } from "./ToolboxMatterMovement";
import { ToolboxMatterShell } from "./ToolboxMatterShell";
import type { ToolboxMatterDrive } from "./ToolboxMatterEngine";

interface ToolboxMatterPilotProps extends ToolboxNebulaPilotProps {}

export function ToolboxMatterPilot({
  slug,
  item,
  locale,
  embedded,
  variant = "panel",
  sessionKey,
  onComplete,
  onAbandon,
}: ToolboxMatterPilotProps) {
  const liveElapsedRef = useLiveElapsedSec(0, true, false);
  const driveRef = useToolboxParticleDriveRef<ToolboxMatterDrive>(() =>
    driveForMatterEngine(slug, liveElapsedRef.current),
  );
  const cfg = item.widget_config as Record<string, unknown>;
  const shared = { embedded, variant, sessionKey, onComplete, onAbandon };

  if (BODY_SCAN_NEBULA_SLUGS.has(slug)) {
    return (
      <ToolboxMatterBodyScan
        config={cfg as unknown as BodyScanConfig}
        title={item.title}
        {...shared}
      />
    );
  }

  if (BODY_MOVE_NEBULA_SLUGS.has(slug)) {
    const movementConfig = applySlugTheme(slug, cfg) as MicroPracticeConfig;
    return (
      <ToolboxMatterMovement
        slug={slug}
        config={movementConfig}
        title={item.title}
        {...shared}
      />
    );
  }

  return (
    <ToolboxMatterShell
      driveRef={driveRef as MutableRefObject<ToolboxMatterDrive>}
      embedded={embedded}
      variant={variant}
    >
      {canRenderToolboxWidget(item) ? (
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
    </ToolboxMatterShell>
  );
}
