import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Scan } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import type { Locale } from "@/i18n/translations";
import { pickWidgetCatalogCopy } from "@/lib/toolbox-widget-i18n";
import { resolveSequenceFromElapsed } from "@/lib/exercise-sequence-position";
import { usePersistedExerciseTimer } from "@/hooks/usePersistedExerciseTimer";
import { useWidgetAbandonGuard } from "@/hooks/useWidgetAbandonGuard";
import {
  TOOLBOX_PHASE_COLORS,
  ToolboxWidgetHeader,
  ToolboxWidgetProgress,
  ToolboxWidgetRoot,
  ToolboxWidgetTimerControls,
  hslWithAlpha,
} from "@/features/toolbox/ui";

export interface BodyScanZone {
  id: string;
  label: string;
  instruction: string;
  duration_sec: number;
}

export interface BodyScanConfig {
  zones?: BodyScanZone[];
  /** @deprecated Legacy admin format; ignored if `zones` is a valid object array */
  duration_min?: number;
}

interface Props {
  config: BodyScanConfig;
  title: string;
  hideTitle?: boolean;
  sessionKey?: string;
  onComplete?: () => void;
  onAbandon?: () => void;
}

// SVG zone highlight positions (viewBox 0 0 80 200)
const ZONE_POSITIONS: Record<string, { cx: number; cy: number; rx: number; ry: number }> = {
  head: { cx: 40, cy: 18, rx: 14, ry: 16 },
  forehead: { cx: 40, cy: 12, rx: 12, ry: 8 },
  temples: { cx: 40, cy: 16, rx: 16, ry: 8 },
  eyes: { cx: 40, cy: 18, rx: 12, ry: 5 },
  face: { cx: 40, cy: 24, rx: 12, ry: 8 },
  back_head: { cx: 40, cy: 16, rx: 12, ry: 10 },
  jaw: { cx: 40, cy: 32, rx: 10, ry: 6 },
  mouth: { cx: 40, cy: 30, rx: 8, ry: 4 },
  ears: { cx: 40, cy: 20, rx: 18, ry: 8 },
  throat: { cx: 40, cy: 40, rx: 7, ry: 5 },
  neck: { cx: 40, cy: 42, rx: 8, ry: 6 },
  nape: { cx: 40, cy: 40, rx: 8, ry: 6 },
  shoulders: { cx: 40, cy: 54, rx: 26, ry: 8 },
  trapezius: { cx: 40, cy: 52, rx: 22, ry: 8 },
  chest: { cx: 40, cy: 70, rx: 18, ry: 12 },
  upper_back: { cx: 40, cy: 68, rx: 16, ry: 10 },
  solar_plexus: { cx: 40, cy: 78, rx: 12, ry: 8 },
  mid_back: { cx: 40, cy: 80, rx: 14, ry: 8 },
  arms: { cx: 40, cy: 78, rx: 28, ry: 10 },
  upper_arms: { cx: 40, cy: 72, rx: 28, ry: 10 },
  back_arms: { cx: 18, cy: 72, rx: 8, ry: 14 },
  elbows: { cx: 40, cy: 86, rx: 26, ry: 6 },
  forearms: { cx: 40, cy: 94, rx: 26, ry: 8 },
  back_forearms: { cx: 16, cy: 94, rx: 8, ry: 10 },
  wrists: { cx: 40, cy: 100, rx: 24, ry: 5 },
  abdomen: { cx: 40, cy: 88, rx: 15, ry: 10 },
  lower_back: { cx: 40, cy: 92, rx: 14, ry: 8 },
  flanks: { cx: 40, cy: 90, rx: 20, ry: 8 },
  pelvis: { cx: 40, cy: 102, rx: 16, ry: 7 },
  glutes: { cx: 40, cy: 108, rx: 16, ry: 8 },
  hands: { cx: 40, cy: 104, rx: 22, ry: 8 },
  back_hands: { cx: 16, cy: 104, rx: 8, ry: 8 },
  fingers: { cx: 40, cy: 110, rx: 20, ry: 6 },
  hips: { cx: 40, cy: 106, rx: 18, ry: 8 },
  thighs: { cx: 40, cy: 124, rx: 16, ry: 12 },
  hamstrings: { cx: 40, cy: 126, rx: 14, ry: 12 },
  knees: { cx: 40, cy: 142, rx: 12, ry: 6 },
  shins: { cx: 40, cy: 154, rx: 12, ry: 8 },
  calves: { cx: 40, cy: 158, rx: 12, ry: 10 },
  ankles: { cx: 40, cy: 168, rx: 12, ry: 5 },
  feet: { cx: 40, cy: 174, rx: 16, ry: 8 },
  soles: { cx: 40, cy: 176, rx: 14, ry: 6 },
  toes: { cx: 40, cy: 182, rx: 14, ry: 5 },
  heels: { cx: 40, cy: 178, rx: 10, ry: 5 },
};

const ZONE_COLOR = TOOLBOX_PHASE_COLORS.inhale;
const ZONE_COLOR_DONE_FILL = hslWithAlpha(ZONE_COLOR, 0.25);
const ZONE_COLOR_ACTIVE_FILL = hslWithAlpha(ZONE_COLOR, 0.18);
const ZONE_COLOR_DONE_STROKE = hslWithAlpha(ZONE_COLOR, 0.4);

export const DEFAULT_BODY_SCAN_ZONES: BodyScanZone[] = [
  { id: "head", label: "Head & Forehead", instruction: "Soften your forehead, eyes, and jaw. Feel the weight of your head.", duration_sec: 20 },
  { id: "jaw", label: "Jaw", instruction: "Let your teeth separate slightly. Relax your tongue.", duration_sec: 15 },
  { id: "shoulders", label: "Shoulders", instruction: "Let your shoulders drop. Feel their weight.", duration_sec: 20 },
  { id: "chest", label: "Chest", instruction: "Observe your natural breathing without trying to control it.", duration_sec: 20 },
  { id: "abdomen", label: "Abdomen", instruction: "Let your belly soften completely. No bracing.", duration_sec: 20 },
  { id: "hands", label: "Hands & Arms", instruction: "Feel the weight of your arms. Fingers gently open.", duration_sec: 15 },
  { id: "thighs", label: "Thighs", instruction: "Release your quadriceps. Let your legs soften.", duration_sec: 15 },
  { id: "feet", label: "Feet", instruction: "Feel the contact with the ground. Relax each toe.", duration_sec: 15 },
];

export const DEFAULT_BODY_SCAN_TOTAL_SEC = DEFAULT_BODY_SCAN_ZONES.reduce((s, z) => s + z.duration_sec, 0);

export function normalizeBodyScanZones(config: BodyScanConfig): BodyScanZone[] {
  const raw = config.zones;
  if (!Array.isArray(raw) || raw.length === 0) {
    return DEFAULT_BODY_SCAN_ZONES;
  }
  const first = raw[0] as unknown;
  if (typeof first === "string") {
    return DEFAULT_BODY_SCAN_ZONES;
  }
  if (
    first &&
    typeof first === "object" &&
    "id" in (first as object) &&
    "duration_sec" in (first as object) &&
    "label" in (first as object) &&
    "instruction" in (first as object)
  ) {
    return raw as BodyScanZone[];
  }
  return DEFAULT_BODY_SCAN_ZONES;
}

export default function BodyScanWidget({
  config,
  title,
  hideTitle,
  sessionKey,
  onComplete,
  onAbandon,
}: Props) {
  const { t, locale } = useLanguage();
  const zones = normalizeBodyScanZones(config);
  const totalSeconds = Math.max(1, zones.reduce((s, z) => s + z.duration_sec, 0));
  const segments = useMemo(
    () => zones.map((z) => ({ id: z.id, durationSec: z.duration_sec })),
    [zones],
  );

  const {
    elapsedSec: elapsedSeconds,
    isRunning,
    completed,
    toggleRunning,
    reset,
    hasStartedRef,
    completedRef,
  } = usePersistedExerciseTimer({ sessionKey, totalSeconds, onComplete });

  useWidgetAbandonGuard(hasStartedRef, completedRef, onAbandon);

  const position = useMemo(
    () => resolveSequenceFromElapsed(elapsedSeconds, segments),
    [elapsedSeconds, segments],
  );
  const currentZoneIdx = position.index;
  const phaseProgress = position.phaseProgress;
  const completedZones = position.completedIds;
  const currentZone = zones[Math.min(currentZoneIdx, zones.length - 1)];

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  const overallProgress = elapsedSeconds / totalSeconds;
  const remaining = Math.max(0, totalSeconds - elapsedSeconds);

  const scanLineTop = `${((ZONE_POSITIONS[currentZone.id]?.cy ?? 100) / 200) * 100}%`;

  return (
    <ToolboxWidgetRoot className="items-center space-y-5">
      {!hideTitle ? (
        <ToolboxWidgetHeader title={title} icon={Scan} iconClassName="text-primary" />
      ) : null}

      <div className="relative flex items-start gap-6">
        <div className="relative w-[80px] h-[200px] shrink-0">
          <svg viewBox="0 0 80 200" className="w-full h-full">
            <path
              d="M40 2 C34 2 28 8 28 16 C28 24 32 30 36 33 L34 44 C28 46 22 50 20 56 L16 80 L24 82 L22 104 L18 130 L22 132 L20 172 L28 174 L30 148 L34 130 L40 128 L46 130 L50 148 L52 174 L60 172 L58 132 L62 130 L58 104 L56 82 L64 80 L60 56 C58 50 52 46 46 44 L44 33 C48 30 52 24 52 16 C52 8 46 2 40 2Z"
              fill="hsl(220 15% 12%)"
              stroke="hsl(220 15% 22%)"
              strokeWidth="1"
            />

            {zones.map((zone) => {
              const pos = ZONE_POSITIONS[zone.id];
              if (!pos) return null;
              const isDone = completedZones.has(zone.id);
              const isActive = currentZone.id === zone.id && !completed;
              return (
                <ellipse
                  key={zone.id}
                  cx={pos.cx}
                  cy={pos.cy}
                  rx={pos.rx}
                  ry={pos.ry}
                  fill={isDone ? ZONE_COLOR_DONE_FILL : isActive ? ZONE_COLOR_ACTIVE_FILL : "transparent"}
                  stroke={isDone ? ZONE_COLOR_DONE_STROKE : isActive ? ZONE_COLOR : "transparent"}
                  strokeWidth={isActive ? 1.5 : 0.5}
                  style={{
                    filter: isActive ? `drop-shadow(0 0 6px ${ZONE_COLOR})` : "none",
                    transition: "all 0.4s ease",
                  }}
                />
              );
            })}
          </svg>

          {isRunning && !completed && (
            <motion.div
              key={currentZone.id}
              className="absolute left-0 right-0 h-px"
              style={{
                background: `linear-gradient(90deg, transparent, ${ZONE_COLOR}, transparent)`,
                boxShadow: `0 0 8px ${ZONE_COLOR}`,
              }}
              animate={{
                top: scanLineTop,
                opacity: [0.3, 1, 0.3],
              }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
        </div>

        <div className="flex flex-col gap-1.5 min-w-[140px]">
          {zones.map((zone) => {
            const isDone = completedZones.has(zone.id);
            const isActive = currentZone.id === zone.id && !completed;
            return (
              <motion.div
                key={zone.id}
                className={`flex items-center gap-2 px-2 py-1 rounded-lg transition-all duration-300 ${
                  isActive ? "bg-primary/10 border border-primary/20" : isDone ? "opacity-40" : "opacity-20"
                }`}
                animate={isActive ? { x: [0, 2, 0] } : { x: 0 }}
                transition={{ duration: 2, repeat: isActive ? Infinity : 0 }}
              >
                <div
                  className="w-2 h-2 rounded-full shrink-0 transition-all duration-300"
                  style={{
                    backgroundColor: isDone ? ZONE_COLOR : isActive ? ZONE_COLOR : "hsl(220 10% 30%)",
                    boxShadow: isActive ? `0 0 6px ${ZONE_COLOR}` : "none",
                  }}
                />
                <span
                  className={`text-[10px] uppercase tracking-[0.1em] ${
                    isActive ? "text-primary font-medium" : isDone ? "text-primary/50" : "text-muted-foreground"
                  }`}
                >
                  {(() => {
                    const k = `toolbox.bodyScan.zone.${zone.id}.label` as any;
                    const v = t(k);
                    if (v !== k) return v;
                    return pickWidgetCatalogCopy(locale as Locale, (zone as any).label_i18n, zone.label);
                  })()}
                </span>
                {isActive && (
                  <span className="text-[9px] text-muted-foreground ml-auto">
                    {Math.ceil(currentZone.duration_sec - phaseProgress * currentZone.duration_sec)}s
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentZone.id + String(completed)}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.4 }}
          className="text-center max-w-[260px] min-h-[40px] flex items-center justify-center"
        >
          {completed ? (
            <p className="text-sm text-primary font-medium">{t("toolbox.bodyScanDone")}</p>
          ) : (
            <p className="text-xs text-muted-foreground/80 italic leading-relaxed">« {(() => { const k = `toolbox.bodyScan.zone.${currentZone.id}.instruction` as any; const v = t(k); if (v !== k) return v; return pickWidgetCatalogCopy(locale as Locale, (currentZone as any).instruction_i18n, currentZone.instruction); })()} »</p>
          )}
        </motion.div>
      </AnimatePresence>

      {!completed && (
        <div className="w-full max-w-[260px] h-0.5 rounded-full bg-secondary/40 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: ZONE_COLOR }}
            animate={{ width: `${phaseProgress * 100}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
      )}

      <div className="w-full max-w-[260px] space-y-2">
        <div className="flex justify-between text-[9px] text-muted-foreground">
          <span>
            {completed
              ? t("toolbox.bodyScanFinishedShort")
              : t("toolbox.bodyScanZoneProgress", { current: currentZoneIdx + 1, total: zones.length })}
          </span>
          <span>{t("toolbox.bodyScanRemaining", { time: formatTime(remaining) })}</span>
        </div>
        <div className="w-full h-1 rounded-full bg-secondary overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${hslWithAlpha(ZONE_COLOR, 0.5)}, ${ZONE_COLOR})` }}
            animate={{ width: `${overallProgress * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      <ToolboxWidgetTimerControls
        isRunning={isRunning}
        onToggle={toggleRunning}
        onReset={reset}
        disabled={completed}
        playLabel={t("toolbox.launch")}
        pauseLabel={t("toolbox.pause")}
        resetLabel="Reset"
      />
    </ToolboxWidgetRoot>
  );
}
