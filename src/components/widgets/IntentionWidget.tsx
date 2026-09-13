import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useWidgetAbandonGuard } from "@/hooks/useWidgetAbandonGuard";
import { usePersistedExerciseTimer } from "@/hooks/usePersistedExerciseTimer";
import { loadTimerSession } from "@/lib/toolbox-session-storage";
import { motion, AnimatePresence } from "framer-motion";
import { Target, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import type { TranslationKey } from "@/i18n/translations";
import type { Locale } from "@/i18n/translations";
import { pickWidgetCatalogCopy } from "@/lib/toolbox-widget-i18n";
import { playToolboxTimerCompleteSound } from "@/lib/toolbox-timer-sound";
import { hslWithAlpha } from "@/features/toolbox/ui/toolboxPhaseColors";
import {
  TOOLBOX_PHASE_COLORS,
  ToolboxWidgetHeader,
  ToolboxWidgetLaunchButton,
  ToolboxWidgetPrimaryButton,
  ToolboxWidgetRoot,
  ToolboxWidgetTextarea,
  ToolboxWidgetTimerControls,
} from "@/features/toolbox/ui";
import {
  useSaveToolboxWritingToJournal,
  type ToolboxJournalMeta,
} from "@/features/journal/useSaveToolboxWritingToJournal";
import { formatLabeledJournalContent } from "@/features/journal/saveToolboxWritingToJournal";

export interface IntentionConfig {
  question?: string;
  question_i18n?: unknown;
  duration_sec?: number;
  allow_note?: boolean;
  note_prompt?: string;
  note_prompt_i18n?: unknown;
  /** @deprecated */
  duration_min?: number;
  /** @deprecated → question */
  intention?: string;
}

interface Props {
  config: IntentionConfig;
  title: string;
  hideTitle?: boolean;
  sessionKey?: string;
  journal?: ToolboxJournalMeta;
  onComplete?: (note?: string) => void;
  onAbandon?: () => void;
}

const COLOR = TOOLBOX_PHASE_COLORS.hold;

const RINGS = [
  { r: 88, delay: 0, duration: 4 },
  { r: 72, delay: 0.6, duration: 3.5 },
  { r: 56, delay: 1.2, duration: 3 },
];

type Phase = "idle" | "reflecting" | "noting" | "done";

function normalizeIntentionConfig(
  raw: IntentionConfig | undefined,
  t: (k: TranslationKey, p?: Record<string, string | number>) => string,
  locale: Locale
) {
  const c = raw ?? {};
  let question = c.question?.trim();
  let durationSec = c.duration_sec;
  let allowNote = c.allow_note;
  let notePrompt = c.note_prompt?.trim();

  if (durationSec == null && typeof c.duration_min === "number") {
    durationSec = c.duration_min * 60;
  }

  if (typeof c.duration_min === "number" && c.duration_sec == null && !c.question) {
    durationSec = c.duration_min * 60;
    if (typeof c.intention === "string" && c.intention.trim()) {
      question = c.intention.trim();
    }
  }

  const questionResolved =
    pickWidgetCatalogCopy(locale, c.question_i18n as any, question) || t("toolbox.intentionWidget.defaultQuestion");
  const noteResolved =
    pickWidgetCatalogCopy(locale, c.note_prompt_i18n as any, notePrompt) || t("toolbox.intentionWidget.notePlaceholder");

  return {
    question: questionResolved,
    duration_sec: Math.max(30, durationSec ?? 120),
    allow_note: allowNote ?? true,
    note_prompt: noteResolved,
  };
}

export default function IntentionWidget({ config, title, hideTitle, sessionKey, journal, onComplete, onAbandon }: Props) {
  const { t, locale } = useLanguage();
  const cfg = useMemo(() => normalizeIntentionConfig(config, t, locale as Locale), [config, t, locale]);

  const totalSeconds = cfg.duration_sec;
  const onTimerCompleteRef = useRef<() => void>(() => {});

  const timer = usePersistedExerciseTimer({
    sessionKey,
    totalSeconds,
    onComplete: () => onTimerCompleteRef.current(),
  });

  const [phase, setPhase] = useState<Phase>(() => {
    if (!sessionKey) return "idle";
    const saved = loadTimerSession(sessionKey);
    if (saved && !saved.completed && (saved.accumulatedSec > 0 || saved.runningSince !== null)) {
      return "reflecting";
    }
    return "idle";
  });
  const [note, setNote] = useState("");
  const completedRef = timer.completedRef;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { saveWriting, saving } = useSaveToolboxWritingToJournal(journal);

  const elapsed = timer.elapsedSec;
  const isRunning = timer.isRunning;
  const remaining = totalSeconds - elapsed;
  const progress = elapsed / totalSeconds;

  const persistIntention = useCallback(async (noteText?: string) => {
    const sections = [
      { label: t("toolbox.intentionWidget.defaultQuestion"), body: cfg.question },
    ];
    if (noteText?.trim()) {
      sections.push({ label: cfg.note_prompt, body: noteText.trim() });
    }
    return saveWriting(formatLabeledJournalContent(sections));
  }, [cfg.note_prompt, cfg.question, saveWriting, t]);

  const persistIntentionRef = useRef(persistIntention);
  persistIntentionRef.current = persistIntention;

  useEffect(() => {
    onTimerCompleteRef.current = () => {
      playToolboxTimerCompleteSound();
      if (cfg.allow_note) {
        setPhase("noting");
        setTimeout(() => textareaRef.current?.focus(), 300);
      } else {
        void (async () => {
          const ok = await persistIntentionRef.current();
          if (!ok) return;
          setPhase("done");
          completedRef.current = true;
          onComplete?.();
        })();
      }
    };
  }, [cfg.allow_note, onComplete, completedRef]);

  const reset = useCallback(() => {
    timer.reset();
    setNote("");
    setPhase("idle");
  }, [timer]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  const pulseScale = isRunning ? 1 + Math.sin((elapsed / totalSeconds) * Math.PI * 4) * 0.04 : 1;

  useWidgetAbandonGuard(timer.hasStartedRef, completedRef, onAbandon);

  const startReflection = () => {
    setPhase("reflecting");
    timer.setRunning(true);
  };

  const handleComplete = async () => {
    if (saving) return;
    const ok = await persistIntention(note);
    if (!ok) return;
    completedRef.current = true;
    setPhase("done");
    onComplete?.(note.trim() || undefined);
  };

  return (
    <ToolboxWidgetRoot className="items-center space-y-5">
      {!hideTitle ? (
        <ToolboxWidgetHeader title={title} icon={Target} iconClassName="text-primary" />
      ) : null}

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
            <ToolboxWidgetTextarea
              ref={textareaRef}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={cfg.note_prompt}
              rows={3}
              className="min-h-0 resize-none"
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

      <div className="flex flex-wrap items-center justify-center gap-3">
        {phase === "idle" && (
          <ToolboxWidgetLaunchButton type="button" onClick={startReflection} className="inline-flex items-center gap-2">
            {t("toolbox.intentionWidget.start")}
          </ToolboxWidgetLaunchButton>
        )}
        {phase === "reflecting" && (
          <ToolboxWidgetTimerControls
            isRunning={isRunning}
            onToggle={() => timer.toggleRunning()}
            onReset={reset}
            playLabel={t("toolbox.launch")}
            pauseLabel={t("toolbox.pause")}
            resetLabel="Reset"
          />
        )}
        {phase === "noting" && (
          <>
            <ToolboxWidgetPrimaryButton
              disabled={saving}
              onClick={handleComplete}
              className="w-auto min-w-[12rem] px-6"
            >
              {t("toolbox.widgetValidate")}
            </ToolboxWidgetPrimaryButton>
            <ToolboxWidgetTimerControls
              isRunning={false}
              onToggle={() => {}}
              onReset={reset}
              playLabel={t("toolbox.launch")}
              pauseLabel={t("toolbox.pause")}
              resetLabel="Reset"
            />
          </>
        )}
        {phase === "done" && (
          <ToolboxWidgetTimerControls
            isRunning={false}
            onToggle={() => {}}
            onReset={reset}
            playLabel={t("toolbox.launch")}
            pauseLabel={t("toolbox.pause")}
            resetLabel="Reset"
          />
        )}
      </div>
    </ToolboxWidgetRoot>
  );
}
