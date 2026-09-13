import { useMemo, useRef } from "react";
import {
  type BodyScanConfig,
  type BodyScanZone,
  normalizeBodyScanZones,
} from "@/components/widgets/BodyScanWidget";
import { useLanguage } from "@/i18n/LanguageContext";
import type { Locale } from "@/i18n/translations";
import { pickWidgetCatalogCopy } from "@/lib/toolbox-widget-i18n";
import { resolveSequenceFromElapsed } from "@/lib/exercise-sequence-position";
import { usePersistedExerciseTimer } from "@/hooks/usePersistedExerciseTimer";
import {
  ToolboxNebulaOverlayControls,
  ToolboxNebulaOverlayHeader,
  ToolboxNebulaScenePills,
  ToolboxWidgetTimerControls,
  toolboxNebulaOverlayRootClass,
} from "@/features/toolbox/ui";
import { TOOLBOX_PHASE_COLORS } from "@/features/toolbox/ui/toolboxPhaseColors";
import { driveForMatterBodyScan } from "../toolboxMatterDrives";
import { useLiveElapsedSec, useLiveSequencePosition } from "../useLiveExerciseElapsed";
import { useToolboxParticleDriveRef } from "../useToolboxParticleDriveRef";
import type { ToolboxNebulaPilotProps } from "./toolboxNebulaPilotTypes";
import { ToolboxMatterShell } from "./ToolboxMatterShell";
import type { ToolboxMatterDrive } from "./ToolboxMatterEngine";

function zoneLabel(
  zone: BodyScanZone,
  t: (key: string) => string,
  locale: Locale,
): string {
  const k = `toolbox.bodyScan.zone.${zone.id}.label`;
  const v = t(k);
  if (v !== k) return v;
  return pickWidgetCatalogCopy(locale, (zone as { label_i18n?: unknown }).label_i18n, zone.label);
}

function zoneInstruction(
  zone: BodyScanZone,
  t: (key: string) => string,
  locale: Locale,
): string {
  const k = `toolbox.bodyScan.zone.${zone.id}.instruction`;
  const v = t(k);
  if (v !== k) return v;
  return pickWidgetCatalogCopy(
    locale,
    (zone as { instruction_i18n?: unknown }).instruction_i18n,
    zone.instruction,
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

interface Props extends Pick<ToolboxNebulaPilotProps, "embedded" | "variant" | "sessionKey" | "onComplete"> {
  config: BodyScanConfig;
  title: string;
}

export function ToolboxMatterBodyScan({
  config,
  title,
  embedded,
  variant = "panel",
  sessionKey,
  onComplete,
}: Props) {
  const { t, locale } = useLanguage();
  const zones = useMemo(() => normalizeBodyScanZones(config), [config]);
  const totalSec = Math.max(1, zones.reduce((sum, zone) => sum + zone.duration_sec, 0));
  const segments = useMemo(
    () => zones.map((zone) => ({ id: zone.id, durationSec: zone.duration_sec })),
    [zones],
  );

  const {
    elapsedSec,
    isRunning,
    completed,
    toggleRunning,
    reset,
  } = usePersistedExerciseTimer({
    totalSeconds: totalSec,
    sessionKey,
    onComplete: () => onComplete?.(),
  });

  const liveElapsedRef = useLiveElapsedSec(elapsedSec, isRunning, completed);
  const resolveTimedPosition = useLiveSequencePosition(liveElapsedRef, segments);

  const sessionRef = useRef({ isRunning, completed });
  sessionRef.current = { isRunning, completed };

  const zonesRef = useRef(zones);
  zonesRef.current = zones;

  const driveRef = useToolboxParticleDriveRef<ToolboxMatterDrive>(() => {
    const s = sessionRef.current;
    const clock = liveElapsedRef.current;
    const pos = resolveTimedPosition();
    return driveForMatterBodyScan(
      pos.index,
      zonesRef.current.length,
      pos.phaseProgress,
      s.isRunning && !s.completed,
      clock,
    );
  });

  const timedPosition = useMemo(
    () => resolveSequenceFromElapsed(elapsedSec, segments),
    [elapsedSec, segments],
  );

  const zoneIndex = timedPosition.index;
  const zoneProgress = timedPosition.phaseProgress;
  const currentZone = zones[zoneIndex] ?? zones[0];
  const remainingSec = Math.ceil(
    currentZone.duration_sec - zoneProgress * currentZone.duration_sec,
  );
  const sessionRemaining = Math.max(0, totalSec - elapsedSec);

  const meta =
    isRunning && !completed
      ? `${formatTime(sessionRemaining)} · ${t("toolbox.bodyScanZoneProgress", {
          current: zoneIndex + 1,
          total: zones.length,
        })}`
      : t("toolbox.bodyScanZoneProgress", {
          current: zoneIndex + 1,
          total: zones.length,
        });

  return (
    <ToolboxMatterShell embedded={embedded} variant={variant} driveRef={driveRef}>
      <div className={toolboxNebulaOverlayRootClass}>
        <ToolboxNebulaOverlayHeader
          title={title}
          headline={completed ? undefined : zoneLabel(currentZone, t, locale as Locale)}
          instruction={completed ? undefined : zoneInstruction(currentZone, t, locale as Locale)}
          meta={completed ? undefined : meta}
          completed={completed}
          completedLabel={t("toolbox.bodyScanDone")}
        />

        <ToolboxNebulaScenePills
          scenes={zones.map((zone) => ({
            id: zone.id,
            label: zoneLabel(zone, t, locale as Locale),
          }))}
          activeIndex={zoneIndex}
        />

        <div
          className="mx-auto h-1.5 w-full max-w-[12rem] overflow-hidden rounded-full bg-border/30"
          aria-hidden
        >
          <div
            className="h-full rounded-full transition-all duration-150"
            style={{
              width: `${Math.min(100, zoneProgress * 100)}%`,
              backgroundColor: TOOLBOX_PHASE_COLORS.inhale,
            }}
          />
        </div>

        <ToolboxNebulaOverlayControls>
          <ToolboxWidgetTimerControls
            isRunning={isRunning}
            onToggle={() => toggleRunning()}
            onReset={() => reset()}
            disabled={completed}
            playLabel={t("toolbox.launch")}
            pauseLabel={t("toolbox.pause")}
            resetLabel={t("toolbox.restart")}
          />
          {!completed && isRunning ? (
            <p className="text-center text-[10px] uppercase tracking-[0.14em] text-muted-foreground/75">
              {remainingSec}s · {t("toolbox.bodyScanAttend")}
            </p>
          ) : null}
        </ToolboxNebulaOverlayControls>
      </div>
    </ToolboxMatterShell>
  );
}
