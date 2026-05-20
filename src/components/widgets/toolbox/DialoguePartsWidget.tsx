import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessagesSquare, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

interface Props {
  config: { instructions?: string; fields?: string[]; accent_color?: string };
  title: string;
  hideTitle?: boolean;
  onComplete?: () => void;
  onAbandon?: () => void;
}

const ACCENT_A = "hsl(220 70% 60%)";
const ACCENT_B = "hsl(270 50% 60%)";

export default function DialoguePartsWidget({
  config,
  title,
  hideTitle,
  onComplete,
  onAbandon,
}: Props) {
  const { t } = useLanguage();
  const labels = config.fields?.length ? config.fields : ["Voix A", "Voix B"];
  const [activeVoice, setActiveVoice] = useState<0 | 1>(0);
  const [linesA, setLinesA] = useState<string[]>([""]);
  const [linesB, setLinesB] = useState<string[]>([""]);
  const touchedRef = useRef(false);
  const completedRef = useRef(false);

  useEffect(() => {
    return () => {
      if (touchedRef.current && !completedRef.current) onAbandon?.();
    };
  }, [onAbandon]);

  const currentLines = activeVoice === 0 ? linesA : linesB;
  const setCurrentLines = activeVoice === 0 ? setLinesA : setLinesB;
  const accent = activeVoice === 0 ? ACCENT_A : ACCENT_B;

  const addLine = () => {
    touchedRef.current = true;
    setCurrentLines((prev) => [...prev, ""]);
  };

  const updateLine = (idx: number, value: string) => {
    touchedRef.current = true;
    setCurrentLines((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
  };

  const canComplete =
    linesA.some((l) => l.trim()) && linesB.some((l) => l.trim());

  return (
    <div className="flex flex-col space-y-4 py-4 max-w-lg mx-auto w-full">
      {!hideTitle && (
        <motion.div
          className="flex items-center gap-2 text-neural-label justify-center"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <MessagesSquare size={14} className="text-neural-accent" />
          <span className="text-xs uppercase tracking-[0.3em]">{title}</span>
        </motion.div>
      )}
      {config.instructions ? (
        <p className="text-xs text-center text-muted-foreground">{config.instructions}</p>
      ) : null}

      <motion.div
        className="flex rounded-xl border border-border/30 p-1 gap-1"
        layout
      >
        {([0, 1] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setActiveVoice(v)}
            className="flex-1 py-2 rounded-lg text-[10px] uppercase tracking-[0.15em] transition-all"
            style={{
              background: activeVoice === v ? `color-mix(in srgb, ${v === 0 ? ACCENT_A : ACCENT_B} 18%, transparent)` : "transparent",
              color: activeVoice === v ? (v === 0 ? ACCENT_A : ACCENT_B) : undefined,
            }}
          >
            {labels[v] ?? (v === 0 ? "A" : "B")}
          </button>
        ))}
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeVoice}
          initial={{ opacity: 0, x: activeVoice === 0 ? -12 : 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0 }}
          className="space-y-2 max-h-56 overflow-y-auto pr-1"
        >
          {currentLines.map((line, idx) => (
            <motion.div
              key={`${activeVoice}-${idx}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${activeVoice === 0 ? "justify-start" : "justify-end"}`}
            >
              <input
                type="text"
                value={line}
                onChange={(e) => updateLine(idx, e.target.value)}
                placeholder={t("toolbox.dialogue.linePlaceholder", { voice: labels[activeVoice] })}
                className="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm border bg-background/60"
                style={{
                  borderColor: `color-mix(in srgb, ${accent} 35%, transparent)`,
                  borderTopLeftRadius: activeVoice === 0 ? 4 : undefined,
                  borderTopRightRadius: activeVoice === 1 ? 4 : undefined,
                }}
              />
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      <button
        type="button"
        onClick={addLine}
        className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
      >
        + {t("toolbox.dialogue.addLine")}
      </button>

      <button
        type="button"
        disabled={!canComplete}
        onClick={() => {
          completedRef.current = true;
          onComplete?.();
        }}
        className="inline-flex items-center justify-center gap-2 mx-auto text-[10px] uppercase tracking-[0.2em] px-4 py-2 rounded border border-primary/30 text-primary disabled:opacity-40"
      >
        <CheckCircle2 size={12} />
        {t("toolbox.markDone")}
      </button>
    </div>
  );
}
