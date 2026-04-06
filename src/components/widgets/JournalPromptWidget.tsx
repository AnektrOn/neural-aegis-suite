import { useState, useEffect, useRef } from "react";
import { BookOpen } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

interface Props {
  config: { prompt: string };
  title: string;
  onComplete?: () => void;
  onAbandon?: () => void;
}

export default function JournalPromptWidget({ config, title, onComplete, onAbandon }: Props) {
  const { t } = useLanguage();
  const [body, setBody] = useState("");
  const completedRef = useRef(false);
  const bodyRef = useRef(body);
  bodyRef.current = body;

  useEffect(() => {
    return () => {
      if (bodyRef.current.trim().length > 0 && !completedRef.current) onAbandon?.();
    };
  }, []);

  const submit = () => {
    if (!body.trim()) return;
    completedRef.current = true;
    onComplete?.();
  };

  const textareaClass =
    "w-full min-h-[140px] bg-secondary/30 border border-border/30 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40 transition-colors resize-y";

  return (
    <div className="flex flex-col space-y-5 py-4 max-w-lg mx-auto w-full">
      <div className="flex items-center gap-2 text-neural-label justify-center">
        <BookOpen size={14} className="text-neural-accent" />
        <span className="text-xs uppercase tracking-[0.3em]">{title}</span>
      </div>

      <div className="rounded-xl border border-border/20 bg-secondary/15 p-4">
        <p className="text-neural-label text-[10px] uppercase tracking-[0.2em] mb-2">{t("toolbox.journalPromptLabel")}</p>
        <p className="text-sm text-foreground leading-relaxed">{config.prompt}</p>
      </div>

      <div>
        <label className="text-neural-label text-[10px] uppercase tracking-[0.2em] block mb-1.5">{t("toolbox.journalYourReflection")}</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t("toolbox.journalWriteHere")}
          className={textareaClass}
        />
      </div>

      <button
        type="button"
        onClick={submit}
        disabled={!body.trim()}
        className="btn-neural w-full disabled:opacity-40 disabled:pointer-events-none"
      >
        {t("toolbox.widgetFinishJournal")}
      </button>
    </div>
  );
}
