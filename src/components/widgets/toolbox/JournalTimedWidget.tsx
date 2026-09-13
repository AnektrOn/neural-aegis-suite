import { useState, useRef, useCallback } from "react";
import { PenLine } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useWidgetAbandonGuard } from "@/hooks/useWidgetAbandonGuard";
import { usePersistedExerciseTimer } from "@/hooks/usePersistedExerciseTimer";
import { loadTimerSession } from "@/lib/toolbox-session-storage";
import { playToolboxTimerCompleteSound } from "@/lib/toolbox-timer-sound";
import {
  useSaveToolboxWritingToJournal,
  type ToolboxJournalMeta,
} from "@/features/journal/useSaveToolboxWritingToJournal";
import {
  ToolboxWidgetHeader,
  ToolboxWidgetInstructions,
  ToolboxWidgetLaunchButton,
  ToolboxWidgetPrimaryButton,
  ToolboxWidgetProgress,
  ToolboxWidgetRoot,
  ToolboxWidgetTextarea,
  ToolboxWidgetTimerControls,
  resolveToolboxAccent,
} from "@/features/toolbox/ui";

export interface JournalTimedConfig {
  prompt?: string;
  duration_sec?: number;
  accent_color?: string;
}

interface Props {
  config: JournalTimedConfig;
  title: string;
  hideTitle?: boolean;
  sessionKey?: string;
  journal?: ToolboxJournalMeta;
  onComplete?: () => void;
  onAbandon?: () => void;
}

export default function JournalTimedWidget({
  config,
  title,
  hideTitle,
  sessionKey,
  journal,
  onComplete,
  onAbandon,
}: Props) {
  const { t } = useLanguage();
  const { saveWriting, saving } = useSaveToolboxWritingToJournal(journal);
  const accent = resolveToolboxAccent(config.accent_color, 1);
  const totalSec = Math.max(60, config.duration_sec ?? 600);
  const [body, setBody] = useState("");
  const [started, setStarted] = useState(() => {
    if (!sessionKey) return false;
    const saved = loadTimerSession(sessionKey);
    return Boolean(saved && !saved.completed && (saved.accumulatedSec > 0 || saved.runningSince !== null));
  });
  const completedRef = useRef(false);
  const touchedRef = useRef(false);

  const timer = usePersistedExerciseTimer({
    sessionKey,
    totalSeconds: totalSec,
    onComplete: () => {
      playToolboxTimerCompleteSound();
    },
  });

  const { elapsedSec: elapsed, isRunning: running, toggleRunning, reset: resetTimer } = timer;

  const remaining = Math.max(0, totalSec - elapsed);

  useWidgetAbandonGuard(touchedRef, completedRef, onAbandon);

  const fmt = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  const submit = useCallback(async () => {
    if (!body.trim() || saving) return;
    const content = config.prompt?.trim()
      ? `${config.prompt.trim()}\n\n${body.trim()}`
      : body.trim();
    const ok = await saveWriting(content);
    if (!ok) return;
    completedRef.current = true;
    onComplete?.();
  }, [body, config.prompt, onComplete, saveWriting, saving]);

  const reset = () => {
    resetTimer();
    setBody("");
    setStarted(false);
    completedRef.current = false;
    touchedRef.current = false;
  };

  const start = () => {
    setStarted(true);
    touchedRef.current = true;
    timer.setRunning(true);
  };

  return (
    <ToolboxWidgetRoot className="items-center">
      {!hideTitle ? (
        <ToolboxWidgetHeader title={title} icon={PenLine} iconClassName="text-neural-accent" />
      ) : null}

      <ToolboxWidgetInstructions className="text-sm max-w-sm">
        {config.prompt}
      </ToolboxWidgetInstructions>

      <ToolboxWidgetProgress
        className="max-w-xs"
        value={elapsed}
        max={totalSec}
        accentColor={accent}
      />

      <p className="text-neural-label text-xs font-mono">{fmt(remaining)}</p>

      <ToolboxWidgetTextarea
        value={body}
        onChange={(e) => {
          touchedRef.current = true;
          setBody(e.target.value);
        }}
        rows={6}
        placeholder={t("toolbox.journalWriteHere")}
      />

      {!started ? (
        <ToolboxWidgetLaunchButton type="button" onClick={start} className="inline-flex items-center gap-2">
          {t("toolbox.launch")}
        </ToolboxWidgetLaunchButton>
      ) : (
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
          <ToolboxWidgetTimerControls
            isRunning={running}
            onToggle={toggleRunning}
            onReset={reset}
            playLabel={t("toolbox.launch")}
            pauseLabel={t("toolbox.pause")}
            resetLabel="Reset"
          />
          <ToolboxWidgetPrimaryButton
            onClick={submit}
            disabled={!body.trim() || saving}
            className="w-full sm:w-auto sm:min-w-[12rem]"
          >
            {t("toolbox.widgetFinishJournal")}
          </ToolboxWidgetPrimaryButton>
        </div>
      )}
    </ToolboxWidgetRoot>
  );
}
