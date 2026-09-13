import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessagesSquare } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useWidgetAbandonGuard } from "@/hooks/useWidgetAbandonGuard";
import {
  useSaveToolboxWritingToJournal,
  type ToolboxJournalMeta,
} from "@/features/journal/useSaveToolboxWritingToJournal";
import { formatLabeledJournalContent } from "@/features/journal/saveToolboxWritingToJournal";
import {
  TOOLBOX_ACCENT_SLOTS,
  ToolboxWidgetHeader,
  ToolboxWidgetInput,
  ToolboxWidgetInstructions,
  ToolboxWidgetPrimaryButton,
  ToolboxWidgetRoot,
  ToolboxWidgetSecondaryButton,
  phaseColorMix,
} from "@/features/toolbox/ui";

interface Props {
  config: { instructions?: string; fields?: string[]; accent_color?: string };
  title: string;
  hideTitle?: boolean;
  journal?: ToolboxJournalMeta;
  onComplete?: () => void;
  onAbandon?: () => void;
}

export default function DialoguePartsWidget({
  config,
  title,
  hideTitle,
  journal,
  onComplete,
  onAbandon,
}: Props) {
  const { t } = useLanguage();
  const { saveWriting, saving } = useSaveToolboxWritingToJournal(journal);
  const labels = config.fields?.length
    ? config.fields
    : [t("toolbox.widgetFallback.voiceA"), t("toolbox.widgetFallback.voiceB")];
  const [activeVoice, setActiveVoice] = useState<0 | 1>(0);
  const [linesA, setLinesA] = useState<string[]>([""]);
  const [linesB, setLinesB] = useState<string[]>([""]);
  const touchedRef = useRef(false);
  const completedRef = useRef(false);

  useWidgetAbandonGuard(touchedRef, completedRef, onAbandon);

  const currentLines = activeVoice === 0 ? linesA : linesB;
  const setCurrentLines = activeVoice === 0 ? setLinesA : setLinesB;
  const accentA = TOOLBOX_ACCENT_SLOTS[0];
  const accentB = TOOLBOX_ACCENT_SLOTS[1];
  const accent = activeVoice === 0 ? accentA : accentB;

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
    <ToolboxWidgetRoot>
      {!hideTitle ? (
        <ToolboxWidgetHeader title={title} icon={MessagesSquare} iconClassName="text-neural-accent" />
      ) : null}
      <ToolboxWidgetInstructions>{config.instructions}</ToolboxWidgetInstructions>

      <div className="flex rounded-2xl border border-border/30 p-1 gap-1">
        {([0, 1] as const).map((v) => {
          const voiceAccent = v === 0 ? accentA : accentB;
          return (
            <button
              key={v}
              type="button"
              onClick={() => setActiveVoice(v)}
              className="flex-1 min-h-[44px] rounded-xl text-[10px] uppercase tracking-[0.15em] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              style={{
                background: activeVoice === v ? phaseColorMix(voiceAccent, 18) : "transparent",
                color: activeVoice === v ? voiceAccent : undefined,
              }}
            >
              {labels[v] ?? (v === 0 ? "A" : "B")}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeVoice}
          initial={{ opacity: 0, x: activeVoice === 0 ? -12 : 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0 }}
          className="space-y-2 max-h-56 overflow-y-auto pr-1 [-webkit-overflow-scrolling:touch]"
        >
          {currentLines.map((line, idx) => (
            <motion.div
              key={`${activeVoice}-${idx}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${activeVoice === 0 ? "justify-start" : "justify-end"}`}
            >
              <ToolboxWidgetInput
                type="text"
                variant="chat"
                chatSide={activeVoice === 0 ? "start" : "end"}
                accentColor={accent}
                value={line}
                onChange={(e) => updateLine(idx, e.target.value)}
                placeholder={t("toolbox.dialogue.linePlaceholder", { voice: labels[activeVoice] })}
              />
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      <ToolboxWidgetSecondaryButton type="button" onClick={addLine} className="w-full">
        + {t("toolbox.dialogue.addLine")}
      </ToolboxWidgetSecondaryButton>

      <ToolboxWidgetPrimaryButton
        disabled={!canComplete || saving}
        onClick={async () => {
          if (saving) return;
          const content = formatLabeledJournalContent([
            { label: labels[0] ?? "A", body: linesA.filter((l) => l.trim()).join("\n") },
            { label: labels[1] ?? "B", body: linesB.filter((l) => l.trim()).join("\n") },
          ]);
          const ok = await saveWriting(content);
          if (!ok) return;
          completedRef.current = true;
          onComplete?.();
        }}
      >
        {t("toolbox.markDone")}
      </ToolboxWidgetPrimaryButton>
    </ToolboxWidgetRoot>
  );
}
