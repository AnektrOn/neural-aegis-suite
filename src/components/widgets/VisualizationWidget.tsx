import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Sparkles, ChevronRight } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

export interface VisualizationScene {
  id: string;
  label: string;
  instruction: string;
  duration_sec: number;
  color?: string;
}

export interface VisualizationConfig {
  scenes?: VisualizationScene[];
  mode?: "timed" | "manual";
  /** @deprecated Ancien format admin */
  duration_min?: number;
  cues?: string[];
}

interface Props {
  config: VisualizationConfig;
  title: string;
  onComplete?: () => void;
  onAbandon?: () => void;
}

/** "hsl(H S% L%)" -> "hsl(H S% L% / alpha)" */
export function hslWithAlpha(hsl: string, alpha: number): string {
  const trimmed = hsl.trim();
  const m = trimmed.match(/^hsl\(\s*(.+?)\s*\)$/i);
  if (!m) return trimmed;
  return `hsl(${m[1]} / ${alpha})`;
}

export const DEFAULT_VISUALIZATION_SCENES: VisualizationScene[] = [
  {
    id: "anchor",
    label: "Ancrage",
    instruction:
      "Fermez les yeux. Sentez le poids de votre corps. Vous êtes ici, maintenant. Prenez trois respirations lentes.",
    duration_sec: 25,
    color: "hsl(176 70% 48%)",
  },
  {
    id: "place",
    label: "Lieu sûr",
    instruction:
      "Visualisez un endroit où vous vous sentez pleinement en sécurité. Une lumière, une texture, une odeur. Rendez-le réel.",
    duration_sec: 30,
    color: "hsl(220 70% 60%)",
  },
  {
    id: "scene",
    label: "La Scène",
    instruction:
      "Voyez-vous dans la situation à venir. Vous êtes calme, ancré, précis. Chaque détail est net. Vous maîtrisez.",
    duration_sec: 40,
    color: "hsl(270 50% 60%)",
  },
  {
    id: "success",
    label: "Réussite",
    instruction:
      "Ressentez ce que vous éprouvez quand c'est terminé. La sensation dans votre corps. Cette certitude. Ancrez-la.",
    duration_sec: 25,
    color: "hsl(35 80% 58%)",
  },
  {
    id: "return",
    label: "Retour",
    instruction:
      "Revenez doucement. Bougez les doigts, les pieds. Ouvrez les yeux. Portez cet état dans vos prochaines heures.",
    duration_sec: 15,
    color: "hsl(176 70% 48%)",
  },
];

export const DEFAULT_VISUALIZATION_TOTAL_SEC = DEFAULT_VISUALIZATION_SCENES.reduce((s, sc) => s + sc.duration_sec, 0);

const VIZ_PALETTE = [
  "hsl(176 70% 48%)",
  "hsl(220 70% 60%)",
  "hsl(270 50% 60%)",
  "hsl(35 80% 58%)",
];

function isSceneArray(raw: unknown): raw is VisualizationScene[] {
  if (!Array.isArray(raw) || raw.length === 0) return false;
  const a = raw[0] as Record<string, unknown>;
  return typeof a === "object" && a !== null && typeof a.instruction === "string" && typeof a.duration_sec === "number";
}

function normalizeVisualizationConfig(config: VisualizationConfig): { scenes: VisualizationScene[]; mode: "timed" | "manual" } {
  const mode = config.mode === "manual" ? "manual" : "timed";
  if (isSceneArray(config.scenes)) {
    return {
      scenes: config.scenes.map((s) => ({ ...s, label: s.label || s.id })),
      mode,
    };
  }
  const cues = config.cues?.map((c) => c.trim()).filter(Boolean) ?? [];
  const dm = config.duration_min ?? 8;
  if (cues.length === 0) {
    const scale = (dm * 60) / DEFAULT_VISUALIZATION_TOTAL_SEC;
    return {
      mode,
      scenes: DEFAULT_VISUALIZATION_SCENES.map((s) => ({
        ...s,
        duration_sec: Math.max(8, Math.round(s.duration_sec * scale)),
      })),
    };
  }
  const per = Math.max(5, Math.round((dm * 60) / cues.length));
  return {
    mode,
    scenes: cues.map((instruction, i) => ({
      id: `cue_${i}`,
      label: `Scène ${i + 1}`,
      instruction,
      duration_sec: per,
      color: VIZ_PALETTE[i % VIZ_PALETTE.length],
    })),
  };
}

function deterministicParticles(count: number) {
  const rand = (seed: number) => {
    const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
    return x - Math.floor(x);
  };
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: rand(i * 3) * 100,
    y: rand(i * 3 + 1) * 100,
    size: 1 + rand(i * 3 + 2) * 2,
    delay: rand(i + 100) * 3,
    duration: 2 + rand(i + 200) * 3,
  }));
}

export default function VisualizationWidget({ config, title, onComplete, onAbandon }: Props) {
  const { t } = useLanguage();
  const { scenes, mode } = useMemo(() => normalizeVisualizationConfig(config), [config]);

  const [isRunning, setIsRunning] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [phaseProgress, setPhaseProgress] = useState(0);
  const [completed, setCompleted] = useState(false);
  const hasStartedRef = useRef(false);
  const completedRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const particles = useMemo(() => deterministicParticles(18), []);

  const currentScene = scenes[Math.min(currentIdx, scenes.length - 1)];
  const totalSeconds = Math.max(1, scenes.reduce((s, sc) => s + sc.duration_sec, 0));
  const elapsedSeconds =
    scenes.slice(0, currentIdx).reduce((s, sc) => s + sc.duration_sec, 0) + phaseProgress * currentScene.duration_sec;

  const sceneColor = currentScene.color ?? "hsl(270 50% 60%)";

  useEffect(() => {
    if (isRunning && !hasStartedRef.current) hasStartedRef.current = true;
  }, [isRunning]);

  useEffect(() => {
    return () => {
      if (hasStartedRef.current && !completedRef.current) onAbandon?.();
    };
  }, []);

  const advanceScene = useCallback(() => {
    hasStartedRef.current = true;
    setCurrentIdx((idx) => {
      const nextIdx = idx + 1;
      if (nextIdx >= scenes.length) {
        setIsRunning(false);
        setCompleted(true);
        completedRef.current = true;
        onComplete?.();
        return idx;
      }
      setPhaseProgress(0);
      return nextIdx;
    });
  }, [scenes.length, onComplete]);

  useEffect(() => {
    if (!isRunning || mode === "manual") {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    const tickMs = 50;
    const durSec = currentScene.duration_sec;
    intervalRef.current = setInterval(() => {
      setPhaseProgress((prev) => {
        const next = prev + tickMs / (durSec * 1000);
        if (next >= 1) {
          advanceScene();
          return 0;
        }
        return next;
      });
    }, tickMs);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, currentScene.duration_sec, currentScene.id, mode, advanceScene]);

  const reset = useCallback(() => {
    setIsRunning(false);
    setCurrentIdx(0);
    setPhaseProgress(0);
    setCompleted(false);
    completedRef.current = false;
    hasStartedRef.current = false;
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  const overallProgress = elapsedSeconds / totalSeconds;
  const remaining = mode === "timed" ? totalSeconds - elapsedSeconds : null;

  const borderSoft = hslWithAlpha(sceneColor, 0.4);
  const fillSoft = hslWithAlpha(sceneColor, 0.12);
  const orbBorder = hslWithAlpha(sceneColor, 0.35);
  const orbGlow = hslWithAlpha(sceneColor, 0.2);
  const orbInner = hslWithAlpha(sceneColor, 0.08);

  return (
    <div className="flex flex-col items-center space-y-5 py-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        {isRunning &&
          particles.map((p) => (
            <motion.div
              key={p.id}
              className="absolute rounded-full"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.size,
                height: p.size,
                backgroundColor: sceneColor,
              }}
              animate={{
                opacity: [0, 0.6, 0],
                scale: [1, 1.8, 1],
                y: [0, -12, 0],
              }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
      </div>

      <div className="flex items-center gap-2 text-neural-label relative z-10">
        <Sparkles size={14} style={{ color: sceneColor }} />
        <span className="text-xs uppercase tracking-[0.3em]">{title}</span>
      </div>

      <div className="relative w-44 h-44 flex items-center justify-center z-10">
        {[1, 0.6, 0.3].map((opacity, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${60 + i * 25}%`,
              height: `${60 + i * 25}%`,
              border: `1px solid ${sceneColor}`,
              opacity: isRunning ? opacity * 0.4 : 0,
            }}
            animate={
              isRunning
                ? {
                    scale: [1, 1.06, 1],
                    opacity: [opacity * 0.2, opacity * 0.5, opacity * 0.2],
                  }
                : { scale: 1, opacity: 0 }
            }
            transition={{
              duration: 2.5 + i * 0.8,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.4,
            }}
          />
        ))}

        <motion.div
          className="w-24 h-24 rounded-full flex items-center justify-center"
          style={{
            background: `radial-gradient(circle, ${hslWithAlpha(sceneColor, 0.15)} 0%, ${orbInner} 60%, transparent 100%)`,
            border: `1.5px solid ${orbBorder}`,
            boxShadow: isRunning ? `0 0 40px ${orbGlow}, inset 0 0 20px ${hslWithAlpha(sceneColor, 0.06)}` : "none",
          }}
          animate={isRunning ? { scale: [1, 1.05, 1] } : { scale: 1 }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="text-center">
            {completed ? (
              <p className="text-xs font-cinzel" style={{ color: sceneColor }}>
                ✦
              </p>
            ) : mode === "timed" && remaining !== null ? (
              <div>
                <p className="text-lg font-cinzel text-foreground">{formatTime(Math.max(0, remaining))}</p>
                <p className="text-[9px] text-muted-foreground mt-0.5">
                  {isRunning ? t("toolbox.vizRunning") : t("toolbox.vizReady")}
                </p>
              </div>
            ) : (
              <Sparkles size={20} style={{ color: sceneColor, opacity: 0.5 }} />
            )}
          </div>
        </motion.div>
      </div>

      <div className="flex items-center gap-2 z-10">
        {scenes.map((scene, i) => {
          const c = scene.color ?? sceneColor;
          return (
            <div
              key={scene.id}
              className="transition-all duration-500"
              style={{
                width: i === currentIdx && !completed ? 20 : 6,
                height: 6,
                borderRadius: 3,
                backgroundColor:
                  i < currentIdx || completed ? c : i === currentIdx ? c : "hsl(220 10% 25%)",
                opacity: i > currentIdx && !completed ? 0.3 : 1,
              }}
            />
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentScene.id + String(completed)}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.5 }}
          className="text-center z-10 px-4 space-y-2"
        >
          {!completed && (
            <p className="text-[9px] uppercase tracking-[0.25em] font-medium" style={{ color: sceneColor }}>
              {currentScene.label}
            </p>
          )}
          <p className="text-sm text-foreground/75 italic leading-relaxed max-w-[280px]">
            {completed ? t("toolbox.vizCarryState") : `« ${currentScene.instruction} »`}
          </p>
        </motion.div>
      </AnimatePresence>

      {mode === "timed" && !completed && (
        <div className="w-full max-w-[260px] space-y-1.5 z-10">
          <div className="flex justify-between text-[9px] text-muted-foreground">
            <span>{t("toolbox.vizSceneProgress", { current: currentIdx + 1, total: scenes.length })}</span>
            <span>{Math.round(phaseProgress * 100)}%</span>
          </div>
          <div className="w-full h-0.5 rounded-full bg-secondary/40 overflow-hidden">
            <motion.div
              className="h-full rounded-full transition-all"
              style={{ backgroundColor: sceneColor, width: `${phaseProgress * 100}%` }}
            />
          </div>
        </div>
      )}

      {mode === "timed" && (
        <div className="w-full max-w-[260px] h-1 rounded-full bg-secondary overflow-hidden z-10">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, ${hslWithAlpha(sceneColor, 0.45)}, ${sceneColor})`,
            }}
            animate={{ width: `${Math.min(overallProgress * 100, 100)}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      )}

      <div className="flex gap-3 z-10">
        {mode === "timed" ? (
          <>
            <button
              type="button"
              onClick={() => setIsRunning(!isRunning)}
              disabled={completed}
              className="w-12 h-12 rounded-2xl border flex items-center justify-center transition-colors hover:opacity-90"
              style={{
                borderColor: borderSoft,
                backgroundColor: fillSoft,
                color: sceneColor,
              }}
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
          </>
        ) : (
          <>
            {!completed && (
              <button
                type="button"
                onClick={advanceScene}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl border text-sm font-medium transition-all active:scale-95"
                style={{
                  borderColor: borderSoft,
                  backgroundColor: fillSoft,
                  color: sceneColor,
                }}
              >
                {currentIdx === 0 ? t("toolbox.vizManualStart") : t("toolbox.vizManualNext")}
                <ChevronRight size={14} />
              </button>
            )}
            <button
              type="button"
              onClick={reset}
              className="w-10 h-10 rounded-2xl border border-border/30 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <RotateCcw size={16} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
