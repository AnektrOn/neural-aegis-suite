import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Scan } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

export interface BodyScanZone {
  id: string;
  label: string;
  instruction: string;
  duration_sec: number;
}

export interface BodyScanConfig {
  zones?: BodyScanZone[];
  /** @deprecated Ancien format admin ; ignoré si `zones` est un tableau d’objets valides */
  duration_min?: number;
}

interface Props {
  config: BodyScanConfig;
  title: string;
  onComplete?: () => void;
  onAbandon?: () => void;
}

// SVG zone highlight positions (as % of body silhouette viewBox 0 0 80 200)
const ZONE_POSITIONS: Record<string, { cx: number; cy: number; rx: number; ry: number }> = {
  head: { cx: 40, cy: 18, rx: 14, ry: 16 },
  jaw: { cx: 40, cy: 32, rx: 10, ry: 6 },
  neck: { cx: 40, cy: 42, rx: 8, ry: 6 },
  shoulders: { cx: 40, cy: 54, rx: 26, ry: 8 },
  chest: { cx: 40, cy: 70, rx: 18, ry: 12 },
  arms: { cx: 40, cy: 78, rx: 28, ry: 10 },
  abdomen: { cx: 40, cy: 88, rx: 15, ry: 10 },
  hands: { cx: 40, cy: 104, rx: 22, ry: 8 },
  hips: { cx: 40, cy: 106, rx: 18, ry: 8 },
  thighs: { cx: 40, cy: 124, rx: 16, ry: 12 },
  knees: { cx: 40, cy: 142, rx: 12, ry: 6 },
  calves: { cx: 40, cy: 158, rx: 12, ry: 10 },
  feet: { cx: 40, cy: 174, rx: 16, ry: 8 },
};

const ZONE_COLOR = "hsl(176 70% 48%)";
const ZONE_COLOR_DONE_FILL = "hsl(176 70% 48% / 0.25)";
const ZONE_COLOR_ACTIVE_FILL = "hsl(176 70% 48% / 0.18)";
const ZONE_COLOR_DONE_STROKE = "hsl(176 70% 48% / 0.4)";

export const DEFAULT_BODY_SCAN_ZONES: BodyScanZone[] = [
  { id: "head", label: "Crâne & Front", instruction: "Relâchez le front, les yeux, la mâchoire. Sentez le poids de la tête.", duration_sec: 20 },
  { id: "jaw", label: "Mâchoire", instruction: "Décollez légèrement les dents. Relâchez la langue.", duration_sec: 15 },
  { id: "shoulders", label: "Épaules", instruction: "Laissez les épaules tomber. Sentez leur poids.", duration_sec: 20 },
  { id: "chest", label: "Poitrine", instruction: "Observez votre respiration naturelle sans la contrôler.", duration_sec: 20 },
  { id: "abdomen", label: "Ventre", instruction: "Relâchez le ventre complètement. Pas de contraction.", duration_sec: 20 },
  { id: "hands", label: "Mains & Bras", instruction: "Sentez le poids de vos bras. Doigts légèrement ouverts.", duration_sec: 15 },
  { id: "thighs", label: "Cuisses", instruction: "Relâchez les quadriceps. Laissez les jambes s'ouvrir.", duration_sec: 15 },
  { id: "feet", label: "Pieds", instruction: "Sentez le contact du sol. Relâchez chaque orteil.", duration_sec: 15 },
];

export const DEFAULT_BODY_SCAN_TOTAL_SEC = DEFAULT_BODY_SCAN_ZONES.reduce((s, z) => s + z.duration_sec, 0);

function normalizeZones(config: BodyScanConfig): BodyScanZone[] {
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

export default function BodyScanWidget({ config, title, onComplete, onAbandon }: Props) {
  const { t } = useLanguage();
  const zones = normalizeZones(config);
  const [isRunning, setIsRunning] = useState(false);
  const [currentZoneIdx, setCurrentZoneIdx] = useState(0);
  const [phaseProgress, setPhaseProgress] = useState(0);
  const [completedZones, setCompletedZones] = useState<Set<string>>(new Set());
  const [completed, setCompleted] = useState(false);
  const hasStartedRef = useRef(false);
  const completedRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentZone = zones[Math.min(currentZoneIdx, zones.length - 1)];
  const totalSeconds = Math.max(1, zones.reduce((s, z) => s + z.duration_sec, 0));
  const elapsedSeconds =
    zones.slice(0, currentZoneIdx).reduce((s, z) => s + z.duration_sec, 0) + phaseProgress * currentZone.duration_sec;

  useEffect(() => {
    if (isRunning && !hasStartedRef.current) hasStartedRef.current = true;
  }, [isRunning]);

  useEffect(() => {
    return () => {
      if (hasStartedRef.current && !completedRef.current) onAbandon?.();
    };
  }, []);

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    const tickMs = 50;
    intervalRef.current = setInterval(() => {
      setPhaseProgress((prev) => {
        const next = prev + tickMs / (currentZone.duration_sec * 1000);
        if (next >= 1) {
          const nextIdx = currentZoneIdx + 1;
          setCompletedZones((cz) => new Set([...cz, currentZone.id]));
          if (nextIdx >= zones.length) {
            setIsRunning(false);
            setCompleted(true);
            completedRef.current = true;
            onComplete?.();
            return 1;
          }
          setCurrentZoneIdx(nextIdx);
          return 0;
        }
        return next;
      });
    }, tickMs);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, currentZoneIdx, currentZone, zones.length, onComplete]);

  const reset = useCallback(() => {
    setIsRunning(false);
    setCurrentZoneIdx(0);
    setPhaseProgress(0);
    setCompletedZones(new Set());
    setCompleted(false);
    completedRef.current = false;
    hasStartedRef.current = false;
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  const overallProgress = elapsedSeconds / totalSeconds;
  const remaining = Math.max(0, totalSeconds - elapsedSeconds);

  const scanLineTop = `${((ZONE_POSITIONS[currentZone.id]?.cy ?? 100) / 200) * 100}%`;

  return (
    <div className="flex flex-col items-center space-y-5 py-4">
      <div className="flex items-center gap-2 text-neural-label">
        <Scan size={14} className="text-primary" />
        <span className="text-xs uppercase tracking-[0.3em]">{title}</span>
      </div>

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
                  {zone.label}
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
            <p className="text-xs text-muted-foreground/80 italic leading-relaxed">« {currentZone.instruction} »</p>
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
            style={{ background: `linear-gradient(90deg, hsl(176 70% 48% / 0.5), ${ZONE_COLOR})` }}
            animate={{ width: `${overallProgress * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setIsRunning(!isRunning)}
          disabled={completed}
          className="w-12 h-12 rounded-2xl border border-primary/30 bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors"
        >
          {isRunning ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <button
          type="button"
          onClick={reset}
          className="w-12 h-12 rounded-2xl border border-border/30 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
        >
          <RotateCcw size={18} />
        </button>
      </div>
    </div>
  );
}
