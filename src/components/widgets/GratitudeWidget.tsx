import { useState, useEffect, useRef } from "react";
import { Heart } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

interface Props {
  config: { entries_count?: number };
  title: string;
  onComplete?: () => void;
  onAbandon?: () => void;
}

export default function GratitudeWidget({ config, title, onComplete, onAbandon }: Props) {
  const { t } = useLanguage();
  const n = Math.min(10, Math.max(1, config.entries_count ?? 3));
  const [values, setValues] = useState<string[]>(() => Array.from({ length: n }, () => ""));
  const completedRef = useRef(false);
  const touchedRef = useRef(false);

  useEffect(() => {
    setValues(Array.from({ length: n }, () => ""));
    touchedRef.current = false;
    completedRef.current = false;
  }, [n]);

  useEffect(() => {
    return () => {
      if (touchedRef.current && !completedRef.current) onAbandon?.();
    };
  }, []);

  const setAt = (i: number, v: string) => {
    touchedRef.current = true;
    setValues((prev) => {
      const next = [...prev];
      next[i] = v;
      return next;
    });
  };

  const allFilled = values.every((v) => v.trim().length > 0);

  const submit = () => {
    if (!allFilled) return;
    completedRef.current = true;
    onComplete?.();
  };

  const inputClass =
    "w-full bg-secondary/30 border border-border/30 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40 transition-colors";

  return (
    <div className="flex flex-col space-y-5 py-4 max-w-md mx-auto w-full">
      <div className="flex items-center gap-2 text-neural-label justify-center">
        <Heart size={14} className="text-destructive" />
        <span className="text-xs uppercase tracking-[0.3em]">{title}</span>
      </div>

      <p className="text-xs text-muted-foreground text-center">{t("toolbox.gratitudeIntro")}</p>

      <div className="space-y-3">
        {values.map((v, i) => (
          <div key={i}>
            <label className="text-neural-label text-[10px] uppercase tracking-[0.2em] block mb-1.5">
              {t("toolbox.gratitudeEntry", { n: i + 1 })}
            </label>
            <input
              type="text"
              value={v}
              onChange={(e) => setAt(i, e.target.value)}
              placeholder={t("toolbox.gratitudePlaceholder")}
              className={inputClass}
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={submit}
        disabled={!allFilled}
        className="btn-neural w-full disabled:opacity-40 disabled:pointer-events-none"
      >
        {t("toolbox.widgetValidate")}
      </button>
    </div>
  );
}
