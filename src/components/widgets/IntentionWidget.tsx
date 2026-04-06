import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Target, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import type { TranslationKey } from "@/i18n/translations";
import { hslWithAlpha } from "@/components/widgets/VisualizationWidget";

export interface IntentionConfig {
  question?: string;
  duration_sec?: number;
  allow_note?: boolean;
  note_prompt?: string;
  /** @deprecated */
  duration_min?: number;
  /** @deprecated → question */
  intention?: string;
}

interface Props {
  config: IntentionConfig;
  title: string;
  onComplete?: (note?: string) => void;
  onAbandon?: () => void;
}

const COLOR = "hsl(270 50% 60%)";

const RINGS = [
  { r: 88, delay: 0, duration: 4 },
  { r: 72, delay: 0.6, duration: 3.5 },
  { r: 56, delay: 1.2, duration: 3 },
];

type Phase = "idle" | "reflecting" | "noting" | "done";

function normalizeIntentionConfig(raw: IntentionConfig | undefined, t: (k: TranslationKey, p?: Record<string, string | number>) => string) {
  const c = raw ?? {};
  let question = c.question?.trim();
  let durationSec = c.duration_sec;
  let allowNote = c.allow_note;
  let notePrompt = c.note_prompt?.trim();

  if (typeof c.duration_min === "number" && c.duration_sec == null && !c.question) {
    durationSec = c.duration_min * 60;
    if (typeof c.intention === "string" && c.intention.trim()) {
      question = c.intention.trim();
    }
  }

  return {
    question: question || t("toolbox.intentionWidget.defaultQuestion"),
    duration_sec: Math.max(30, durationSec ?? 120),
    allow_note: allowNote ?? true,
    note_prompt: notePrompt || t("toolbox.intentionWidget.notePlaceholder"),
  };
}

export default function IntentionWidget({ config, title, onComplete, onAbandon }: Props) {
  const { t } = useLanguage();
  const cfg = useMemo(() => normalizeIntentionConfig(config, t), [config, t]);

  const [phase, setPhase] = useState<Phase>("idle");
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [note, setNote] = useState("");
  const hasStartedRef = useRef(false);
  const completedRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const totalSeconds = cfg.duration_sec;
  const remaining = totalSeconds - elapsed;
  const progress = elapsed / totalSeconds;

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
    intervalRef.current = setInterval(() => {
      setElapsed((prev) => {
        if (prev + 1 >= totalSeconds) {
          setIsRunning(false);
          if (cfg.allow_note) {
            setPhase("noting");
            setTimeout(() => textareaRef.current?.focus(), 300);
          } else {
            setPhase("done");
            completedRef.current = true;
            onComplete?.();
          }
          return totalSeconds;
        }
        return prev + 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, totalSeconds, cfg.allow_note, onComplete]);

  const startReflection = () => {
    setPhase("reflecting");
    setIsRunning(true);
  };

  const handleComplete = () => {
    completedRef.current = true;
    setPhase("done");
    onComplete?.(note.trim() || undefined);
  };

  const reset = useCallback(() => {
    setIsRunning(false);
    setElapsed(0);
    setNote("");
    setPhase("idle");
    completedRef.current = false;
    hasStartedRef.current = false;
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  const pulseScale = isRunning ? 1 + Math.sin((elapsed / totalSeconds) * Math.PI * 4) * 0.04 : 1;

  return (
    <div className="flex flex-col items-center space-y-5 py-4">
      <div className="flex items-center gap-2 text-neural-label">
        <Target size={14} style={{ color: COLOR }} />
        <span className="text-xs uppercase tracking-[0.3em]">{title}</span>
      </div>

      <AnimatePresence mode="wait">
        {phase !== "noting" ? (
          <motion.div
            key="orb"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative w-48 h-48 flex items-center justify-center"
          >
            <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full -rotate-90">
              {RINGS.map(({ r }) => (
                <circle
                  key={r}
                  cx="100"
                  cy="100"
                  r={r}
                  fill="none"
                  stroke={COLOR}
                  strokeWidth="1"
                  opacity={phase === "reflecting" ? 0.12 : 0.06}
                  style={{ transition: "all 0.5s" }}
                />
              ))}
              {phase === "reflecting" && (
                <circle
                  cx="100"
                  cy="100"
                  r={88}
                  fill="none"
                  stroke={COLOR}
                  strokeWidth="2"
                  strokeDasharray={2 * Math.PI * 88}
                  strokeDashoffset={2 * Math.PI * 88 * (1 - progress)}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 1s linear" }}
                />
              )}
            </svg>

            {phase === "reflecting" &&
              RINGS.map(({ r, delay, duration }) => (
                <motion.div
                  key={r}
                  className="absolute rounded-full"
                  style={{
                    width: r * 2,
                    height: r * 2,
                    border: `1px solid ${COLOR}`,
                    opacity: 0,
                  }}
                  animate={{ scale: [1, 1.08, 1], opacity: [0, 0.15, 0] }}
                  transition={{ duration, delay, repeat: Infinity, ease: "easeInOut" }}
                />
              ))}

            <motion.div
              className="w-28 h-28 rounded-full flex items-center justify-center"
              style={{
                background: `radial-gradient(circle, ${hslWithAlpha(COLOR, 0.1)} 0%, transparent 70%)`,
                border: `1.5px solid ${hslWithAlpha(COLOR, 0.22)}`,
                boxShadow:
                  phase === "reflecting"
                    ? `0 0 40px ${hslWithAlpha(COLOR, 0.14)}, inset 0 0 20px ${hslWithAlpha(COLOR, 0.05)}`
                    : "none",
              }}
              animate={{ scale: phase === "reflecting" ? pulseScale : 1 }}
              transition={{ duration: 0.1 }}
            >
              <div className="text-center px-2">
                {phase === "idle" && (
                  <Target size={22} style={{ color: COLOR, opacity: 0.5 }} className="mx-auto" />
                )}
                {phase === "reflecting" && (
                  <div>
                    <p className="text-2xl font-cinzel text-foreground">{formatTime(Math.max(0, remaining))}</p>
                    <p className="text-[9px] text-muted-foreground mt-1 uppercase tracking-[0.15em]">
                      {t("toolbox.intentionWidget.reflecting")}
                    </p>
                  </div>
                )}
                {phase === "done" && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                  >
                    <CheckCircle2 size={28} style={{ color: COLOR }} className="mx-auto" />
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="note"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full max-w-[280px] space-y-3"
          >
            <p className="text-[9px] uppercase tracking-[0.2em] text-center" style={{ color: COLOR }}>
              {t("toolbox.intentionWidget.anchorNote")}
            </p>
            <textarea
              ref={textareaRef}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={cfg.note_prompt}
              rows={3}
              className="w-full rounded-xl border bg-secondary/20 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/30 focus:outline-none resize-none transition-colors"
              style={{ borderColor: hslWithAlpha(COLOR, 0.22) }}
            />
            <p className="text-[9px] text-muted-foreground/40 text-center">{t("toolbox.intentionWidget.optionalHint")}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {phase !== "done" && (
        <AnimatePresence>
          <motion.p
            key="question"
            className="text-sm text-center italic max-w-[260px] leading-relaxed text-foreground/70"
            animate={{ opacity: phase === "noting" ? 0.5 : 1 }}
          >
            « {cfg.question} »
          </motion.p>
        </AnimatePresence>
      )}

      {phase === "done" && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-1"
        >
          <p className="text-sm font-cinzel" style={{ color: COLOR }}>
            {t("toolbox.intentionWidget.posed")}
          </p>
          {note ? (
            <p className="text-xs text-muted-foreground/60 italic max-w-[240px]">« {note} »</p>
          ) : null}
        </motion.div>
      )}

      {phase === "reflecting" && (
        <div className="w-full max-w-[260px] h-1 rounded-full bg-secondary overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, ${hslWithAlpha(COLOR, 0.4)}, ${COLOR})`,
            }}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 1 }}
          />
        </div>
      )}

      <div className="flex gap-3">
        {phase === "idle" && (
          <button
            type="button"
            onClick={startReflection}
            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-medium transition-all active:scale-95"
            style={{
              background: hslWithAlpha(COLOR, 0.1),
              border: `1px solid ${hslWithAlpha(COLOR, 0.28)}`,
              color: COLOR,
            }}
          >
            <Play size={14} />
            {t("toolbox.intentionWidget.start")}
          </button>
        )}
        {phase === "reflecting" && (
          <>
            <button
              type="button"
              onClick={() => setIsRunning(!isRunning)}
              className="w-12 h-12 rounded-2xl border flex items-center justify-center transition-colors hover:opacity-90"
              style={{
                borderColor: hslWithAlpha(COLOR, 0.35),
                backgroundColor: hslWithAlpha(COLOR, 0.1),
                color: COLOR,
              }}
            >
              {isRunning ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <button
              type="button"
              onClick={reset}
              className="w-12 h-12 rounded-2xl border border-border/30 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <RotateCcw size={18} />
            </button>
          </>
        )}
        {phase === "noting" && (
          <>
            <button
              type="button"
              onClick={handleComplete}
              className="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-medium transition-all active:scale-95"
              style={{
                background: hslWithAlpha(COLOR, 0.1),
                border: `1px solid ${hslWithAlpha(COLOR, 0.28)}`,
                color: COLOR,
              }}
            >
              <CheckCircle2 size={14} />
              {t("toolbox.widgetValidate")}
            </button>
            <button
              type="button"
              onClick={reset}
              className="w-10 h-10 rounded-2xl border border-border/30 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <RotateCcw size={16} />
            </button>
          </>
        )}
        {phase === "done" && (
          <button
            type="button"
            onClick={reset}
            className="w-12 h-12 rounded-2xl border border-border/30 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcw size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
