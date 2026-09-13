import { useState, useRef } from "react";
import { BookOpen } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useWidgetAbandonGuard } from "@/hooks/useWidgetAbandonGuard";
import {
  useSaveToolboxWritingToJournal,
  type ToolboxJournalMeta,
} from "@/features/journal/useSaveToolboxWritingToJournal";
import {
  ToolboxWidgetCard,
  ToolboxWidgetField,
  ToolboxWidgetHeader,
  ToolboxWidgetPrimaryButton,
  ToolboxWidgetRoot,
  toolboxWidgetLabelClass,
} from "@/features/toolbox/ui";
import { ToolboxWidgetTextarea } from "@/features/toolbox/ui/ToolboxWidgetInput";

interface Props {
  config: { prompt: string };
  title: string;
  hideTitle?: boolean;
  journal?: ToolboxJournalMeta;
  onComplete?: () => void;
  onAbandon?: () => void;
}

export default function JournalPromptWidget({ config, title, hideTitle, journal, onComplete, onAbandon }: Props) {
  const { t } = useLanguage();
  const [body, setBody] = useState("");
  const completedRef = useRef(false);
  const touchedRef = useRef(false);
  const { saveWriting, saving } = useSaveToolboxWritingToJournal(journal);

  useWidgetAbandonGuard(touchedRef, completedRef, onAbandon);

  const submit = async () => {
    if (!body.trim() || saving) return;
    const promptBlock = config.prompt?.trim()
      ? `## ${t("toolbox.journalPromptLabel")}\n${config.prompt.trim()}\n\n## ${t("toolbox.journalYourReflection")}\n${body.trim()}`
      : body.trim();
    const ok = await saveWriting(promptBlock);
    if (!ok) return;
    completedRef.current = true;
    onComplete?.();
  };

  return (
    <ToolboxWidgetRoot>
      {!hideTitle ? (
        <ToolboxWidgetHeader title={title} icon={BookOpen} iconClassName="text-neural-accent" />
      ) : null}

      <ToolboxWidgetCard className="p-4">
        <p className={`${toolboxWidgetLabelClass} mb-2`}>{t("toolbox.journalPromptLabel")}</p>
        <p className="text-sm text-foreground leading-relaxed">{config.prompt}</p>
      </ToolboxWidgetCard>

      <ToolboxWidgetField label={t("toolbox.journalYourReflection")}>
        <ToolboxWidgetTextarea
          value={body}
          onChange={(e) => {
            if (e.target.value.trim()) touchedRef.current = true;
            setBody(e.target.value);
          }}
          placeholder={t("toolbox.journalWriteHere")}
        />
      </ToolboxWidgetField>

      <ToolboxWidgetPrimaryButton onClick={submit} disabled={!body.trim() || saving}>
        {t("toolbox.widgetFinishJournal")}
      </ToolboxWidgetPrimaryButton>
    </ToolboxWidgetRoot>
  );
}
