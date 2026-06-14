import {
  Wind, Eye, Scan, BookOpen, Heart, Sparkles, Stars, Link as LinkIcon, ShieldAlert, Target, Zap,
} from "lucide-react";
import type { TranslationKey } from "@/i18n/translations";

export const TOOLBOX_FORM_INPUT_CLASS =
  "flex h-11 w-full rounded-lg border border-border/60 bg-bg-elevated/80 px-3 py-2 text-base text-text-primary shadow-sm transition-colors placeholder:text-text-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base md:text-sm";

export const TOOLBOX_FORM_LABEL_CLASS = "mb-2 block text-sm font-medium text-text-primary";

export const WIDGET_TYPE_DEFS: Array<{
  value: string;
  labelKey: TranslationKey;
  icon: typeof Wind;
  color: string;
}> = [
  { value: "breathwork", labelKey: "toolbox.typeBreathwork", icon: Wind, color: "text-primary" },
  { value: "focus_introspectif", labelKey: "admin.toolboxForm.type.focus_introspectif", icon: Eye, color: "text-neural-accent" },
  { value: "body_scan", labelKey: "toolbox.typeBodyScan", icon: Scan, color: "text-neural-warm" },
  { value: "visualization", labelKey: "admin.toolboxForm.type.visualization", icon: Sparkles, color: "text-neural-accent" },
  { value: "stop_protocol", labelKey: "admin.toolboxForm.type.stop_protocol", icon: ShieldAlert, color: "text-destructive" },
  { value: "intention", labelKey: "toolbox.typeIntention", icon: Target, color: "text-primary" },
  { value: "affirmations", labelKey: "toolbox.typeAffirmations", icon: Stars, color: "text-primary" },
  { value: "gratitude", labelKey: "admin.toolboxForm.type.gratitude", icon: Heart, color: "text-destructive" },
  { value: "journal_prompt", labelKey: "toolbox.typeJournalPrompt", icon: BookOpen, color: "text-neural-accent" },
  { value: "external_link", labelKey: "admin.toolboxForm.type.external_link", icon: LinkIcon, color: "text-muted-foreground" },
  { value: "micro_practice", labelKey: "toolbox.typeMicroPractice", icon: Zap, color: "text-neural-accent" },
];

export function parseStopSteps(text: string): { title: string; hint: string }[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const m = line.match(/^(.+?)\s*[—–-]\s*(.+)$/);
      if (m) return { title: m[1].trim(), hint: m[2].trim() };
      return { title: line, hint: "" };
    });
}

/** Pair FR/EN lines (same index); empty block yields { fr: [], en: [] }. */
export function mergeParallelLines(frBlock: string, enBlock: string): { fr: string[]; en: string[] } {
  const fr = frBlock.split("\n").map((l) => l.trim()).filter(Boolean);
  const en = enBlock.split("\n").map((l) => l.trim()).filter(Boolean);
  const len = Math.max(fr.length, en.length);
  if (len === 0) return { fr: [], en: [] };
  const outFr: string[] = [];
  const outEn: string[] = [];
  for (let i = 0; i < len; i++) {
    const f = fr[i] ?? en[i] ?? "";
    const e = en[i] ?? fr[i] ?? "";
    outFr.push(f || e);
    outEn.push(e || f);
  }
  return { fr: outFr, en: outEn };
}
