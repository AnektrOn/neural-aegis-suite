import { useState, useEffect, useRef } from "react";
import { Heart } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useWidgetAbandonGuard } from "@/hooks/useWidgetAbandonGuard";
import {
  useSaveToolboxWritingToJournal,
  type ToolboxJournalMeta,
} from "@/features/journal/useSaveToolboxWritingToJournal";
import {
  ToolboxWidgetField,
  ToolboxWidgetHeader,
  ToolboxWidgetInput,
  ToolboxWidgetInstructions,
  ToolboxWidgetPrimaryButton,
  ToolboxWidgetRoot,
} from "@/features/toolbox/ui";

interface Props {
  config: { entries_count?: number };
  title: string;
  hideTitle?: boolean;
  journal?: ToolboxJournalMeta;
  onComplete?: () => void;
  onAbandon?: () => void;
}

export default function GratitudeWidget({ config, title, hideTitle, journal, onComplete, onAbandon }: Props) {
  const { t } = useLanguage();
  const { saveWriting, saving } = useSaveToolboxWritingToJournal(journal);
  const n = Math.min(10, Math.max(1, config.entries_count ?? 3));
  const [values, setValues] = useState<string[]>(() => Array.from({ length: n }, () => ""));
  const completedRef = useRef(false);
  const touchedRef = useRef(false);

  useEffect(() => {
    setValues(Array.from({ length: n }, () => ""));
    touchedRef.current = false;
    completedRef.current = false;
  }, [n]);

  useWidgetAbandonGuard(touchedRef, completedRef, onAbandon);

  const setAt = (i: number, v: string) => {
    touchedRef.current = true;
    setValues((prev) => {
      const next = [...prev];
      next[i] = v;
      return next;
    });
  };

  const allFilled = values.every((v) => v.trim().length > 0);

  const submit = async () => {
    if (!allFilled || saving) return;
    const content = values
      .map((v, i) => `${i + 1}. ${v.trim()}`)
      .join("\n");
    const ok = await saveWriting(content, { extraTags: ["gratitude"] });
    if (!ok) return;
    completedRef.current = true;
    onComplete?.();
  };

  return (
    <ToolboxWidgetRoot>
      {!hideTitle ? (
        <ToolboxWidgetHeader title={title} icon={Heart} iconClassName="text-destructive" />
      ) : null}

      <ToolboxWidgetInstructions>{t("toolbox.gratitudeIntro")}</ToolboxWidgetInstructions>

      <div className="space-y-3">
        {values.map((v, i) => (
          <ToolboxWidgetField key={i} label={t("toolbox.gratitudeEntry", { n: i + 1 })}>
            <ToolboxWidgetInput
              type="text"
              value={v}
              onChange={(e) => setAt(i, e.target.value)}
              placeholder={t("toolbox.gratitudePlaceholder")}
            />
          </ToolboxWidgetField>
        ))}
      </div>

      <ToolboxWidgetPrimaryButton onClick={submit} disabled={!allFilled || saving}>
        {t("toolbox.widgetValidate")}
      </ToolboxWidgetPrimaryButton>
    </ToolboxWidgetRoot>
  );
}
