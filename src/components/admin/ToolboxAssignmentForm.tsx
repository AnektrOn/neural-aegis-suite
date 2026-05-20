import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wind, Eye, Scan, BookOpen, Heart, Sparkles, Stars, Link as LinkIcon, Send, ShieldAlert, Target, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_BODY_SCAN_TOTAL_SEC, DEFAULT_BODY_SCAN_ZONES } from "@/components/widgets/BodyScanWidget";
import { DEFAULT_VISUALIZATION_SCENES, DEFAULT_VISUALIZATION_TOTAL_SEC } from "@/components/widgets/VisualizationWidget";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { translations, type TranslationKey, type Locale } from "@/i18n/translations";

function tFor(loc: Locale, key: TranslationKey, params?: Record<string, string | number>): string {
  let str: string = (translations as any)[key]?.[loc] || (translations as any)[key]?.fr || key;
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      str = str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    });
  }
  return str;
}
import { assignToolboxDirect, logProgramEvent } from "@/services/programBuilderService";
import { isLikelyVideoUrl } from "@/lib/video-links";
import { bilingualPair } from "@/lib/content-i18n";

interface Props {
  userId: string;
  onAssigned: () => void;
}

function parseStopSteps(text: string): { title: string; hint: string }[] {
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
function mergeParallelLines(frBlock: string, enBlock: string): { fr: string[]; en: string[] } {
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

const WIDGET_TYPE_DEFS: Array<{
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

export default function ToolboxAssignmentForm({ userId, onAssigned }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, locale } = useLanguage();

  const WIDGET_TYPES = useMemo(
    () => WIDGET_TYPE_DEFS.map((d) => ({ ...d, label: t(d.labelKey) })),
    [t]
  );
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Breathwork config
  const [bwCycles, setBwCycles] = useState(4);
  const [bwBreathIn, setBwBreathIn] = useState(4);
  const [bwPause1, setBwPause1] = useState(4);
  const [bwBreathOut, setBwBreathOut] = useState(6);
  const [bwPause2, setBwPause2] = useState(2);

  // Focus Introspectif config
  const [fiDuration, setFiDuration] = useState(15);
  const [fiIntention, setFiIntention] = useState("");
  const [fiIntentionEn, setFiIntentionEn] = useState("");

  // Body Scan config
  const [bsDuration, setBsDuration] = useState(10);

  // Affirmations config
  const [affDuration, setAffDuration] = useState(5);
  const [affirmations, setAffirmations] = useState("");
  const [affirmationsEn, setAffirmationsEn] = useState("");

  // Gratitude config
  const [gratEntries, setGratEntries] = useState(3);

  // Journal Prompt config
  const [jpPrompt, setJpPrompt] = useState("");
  const [jpPromptEn, setJpPromptEn] = useState("");

  // Visualization config
  const [vizDuration, setVizDuration] = useState(8);
  const [vizCues, setVizCues] = useState("");
  const [vizCuesEn, setVizCuesEn] = useState("");
  const [vizMode, setVizMode] = useState<"timed" | "manual">("timed");

  // STOP protocol (optional custom steps: "Titre — indication" per line)
  const [stopStepsRaw, setStopStepsRaw] = useState("");
  const [stopStepsRawEn, setStopStepsRawEn] = useState("");
  const [stopMode, setStopMode] = useState<"timed" | "manual">("manual");
  const [stopStepSec, setStopStepSec] = useState(30);

  // Intention (dedicated widget)
  const [inDuration, setInDuration] = useState(2);
  const [inQuestion, setInQuestion] = useState("");
  const [inQuestionEn, setInQuestionEn] = useState("");
  const [inAllowNote, setInAllowNote] = useState(true);
  const [inNotePrompt, setInNotePrompt] = useState("");
  const [inNotePromptEn, setInNotePromptEn] = useState("");

  // External Link config
  const [elTitle, setElTitle] = useState("");
  const [elTitleEn, setElTitleEn] = useState("");
  const [elUrl, setElUrl] = useState("");
  const [elDuration, setElDuration] = useState("");

  // Optional English title override (applies to all auto-generated titles)
  const [customTitleEn, setCustomTitleEn] = useState("");

  // Micro Practice config
  const [mpInstructions, setMpInstructions] = useState("");
  const [mpInstructionsEn, setMpInstructionsEn] = useState("");
  const [mpDurationMin, setMpDurationMin] = useState(5);
  const [mpStepsRaw, setMpStepsRaw] = useState("");
  const [mpStepsRawEn, setMpStepsRawEn] = useState("");

  const computeBreathworkDuration = () => {
    const cycleTime = bwBreathIn + bwPause1 + bwBreathOut + bwPause2;
    return Math.ceil((cycleTime * bwCycles) / 60);
  };

  const handleSubmit = async () => {
    if (!user || !selectedType) return;
    setSubmitting(true);

    let title = "";
    let titleFr = "";
    let titleEn = "";
    let duration = "";
    let widgetConfig: Record<string, unknown> | null = null;
    let externalUrl: string | null = null;
    let journalCardTitleFr = "";
    let journalCardTitleEn = "";

    switch (selectedType) {
      case "breathwork":
        titleFr = tFor("fr", "admin.toolboxForm.titleBreathwork", { n: bwCycles });
        titleEn = tFor("en", "admin.toolboxForm.titleBreathwork", { n: bwCycles });
        duration = `${computeBreathworkDuration()} min`;
        widgetConfig = {
          cycles: bwCycles,
          breath_in_sec: bwBreathIn,
          pause1_sec: bwPause1,
          breath_out_sec: bwBreathOut,
          pause2_sec: bwPause2,
        };
        break;
      case "focus_introspectif": {
        const intFr = fiIntention.trim();
        const intEn = fiIntentionEn.trim();
        const topicFr = intFr || intEn || tFor("fr", "admin.toolboxForm.topicFree");
        const topicEn = intEn || intFr || tFor("en", "admin.toolboxForm.topicFree");
        const topicPair = intFr || intEn ? bilingualPair(intFr || intEn, intEn || intFr) : bilingualPair(topicFr, topicEn);
        titleFr = tFor("fr", "admin.toolboxForm.titleFocus", { topic: topicFr });
        titleEn = tFor("en", "admin.toolboxForm.titleFocus", { topic: topicEn });
        duration = `${fiDuration} min`;
        widgetConfig = {
          duration_min: fiDuration,
          intention: topicPair.fr,
          intention_i18n: topicPair,
        };
        break;
      }
      case "body_scan": {
        titleFr = tFor("fr", "admin.toolboxForm.titleBodyScan");
        titleEn = tFor("en", "admin.toolboxForm.titleBodyScan");
        duration = `${bsDuration} min`;
        const scale = (bsDuration * 60) / DEFAULT_BODY_SCAN_TOTAL_SEC;
        widgetConfig = {
          zones: DEFAULT_BODY_SCAN_ZONES.map((z) => ({
            ...z,
            duration_sec: Math.max(5, Math.round(z.duration_sec * scale)),
          })),
        };
        break;
      }
      case "visualization": {
        titleFr = tFor("fr", "admin.toolboxForm.titleVizGuided");
        titleEn = tFor("en", "admin.toolboxForm.titleVizGuided");
        duration = `${vizDuration} min`;
        const cuesFr = vizCues.split("\n").map((l) => l.trim()).filter(Boolean);
        const cuesEn = vizCuesEn.split("\n").map((l) => l.trim()).filter(Boolean);
        const palette = ["hsl(176 70% 48%)", "hsl(220 70% 60%)", "hsl(270 50% 60%)", "hsl(35 80% 58%)"];
        if (cuesFr.length === 0 && cuesEn.length === 0) {
          const scale = (vizDuration * 60) / DEFAULT_VISUALIZATION_TOTAL_SEC;
          widgetConfig = {
            mode: vizMode,
            scenes: DEFAULT_VISUALIZATION_SCENES.map((s) => ({
              ...s,
              duration_sec: Math.max(8, Math.round(s.duration_sec * scale)),
            })),
          };
        } else {
          const primaryCues = cuesFr.length ? cuesFr : cuesEn;
          const per = Math.max(5, Math.round((vizDuration * 60) / primaryCues.length));
          widgetConfig = {
            mode: vizMode,
            scenes: primaryCues.map((instructionFr, i) => {
              const instructionEn = (cuesFr.length ? cuesEn[i] : cuesFr[i]) ?? instructionFr;
              const ins = bilingualPair(instructionFr, instructionEn);
              return {
                id: `cue_${i}`,
                label: tFor("fr", "admin.toolboxForm.sceneLabel", { n: i + 1 }),
                label_i18n: bilingualPair(
                  tFor("fr", "admin.toolboxForm.sceneLabel", { n: i + 1 }),
                  tFor("en", "admin.toolboxForm.sceneLabel", { n: i + 1 })
                ),
                instruction: ins.fr,
                instruction_i18n: ins,
                duration_sec: per,
                color: palette[i % palette.length],
              };
            }),
          };
        }
        break;
      }
      case "stop_protocol": {
        titleFr = tFor("fr", "admin.toolboxForm.titleStop");
        titleEn = tFor("en", "admin.toolboxForm.titleStop");
        const stepsFr = parseStopSteps(stopStepsRaw);
        const stepsEn = parseStopSteps(stopStepsRawEn);
        const n = Math.max(stepsFr.length, stepsEn.length);
        const mergedStop: Array<{
          title: string;
          hint: string;
          title_i18n: ReturnType<typeof bilingualPair>;
          hint_i18n: ReturnType<typeof bilingualPair>;
        }> = [];
        for (let i = 0; i < n; i++) {
          const sf = stepsFr[i];
          const se = stepsEn[i];
          if (!sf && !se) continue;
          const titleFrS = (sf?.title ?? "").trim() || (se?.title ?? "").trim();
          const titleEnS = (se?.title ?? "").trim() || (sf?.title ?? "").trim();
          const hintFrS = (sf?.hint ?? "").trim() || (se?.hint ?? "").trim();
          const hintEnS = (se?.hint ?? "").trim() || (sf?.hint ?? "").trim();
          if (!titleFrS && !titleEnS && !hintFrS && !hintEnS) continue;
          mergedStop.push({
            title: titleFrS || titleEnS,
            hint: hintFrS || hintEnS,
            title_i18n: bilingualPair(titleFrS || titleEnS, titleEnS || titleFrS),
            hint_i18n: bilingualPair(hintFrS || hintEnS, hintEnS || hintFrS),
          });
        }
        const nSteps = mergedStop.length || 4;
        duration = `${Math.max(1, Math.round((stopStepSec * nSteps) / 60))} min`;
        widgetConfig = {
          mode: stopMode,
          step_duration_sec: stopStepSec,
          ...(mergedStop.length ? { steps: mergedStop } : {}),
        };
        break;
      }
      case "intention": {
        const qTrim = inQuestion.trim();
        const qEnTrim = inQuestionEn.trim() || qTrim;
        const qShortFr = qTrim ? `${qTrim.slice(0, 48)}${qTrim.length > 48 ? "…" : ""}` : "";
        const qShortEn = qEnTrim ? `${qEnTrim.slice(0, 48)}${qEnTrim.length > 48 ? "…" : ""}` : "";
        titleFr = qTrim
          ? tFor("fr", "admin.toolboxForm.titleIntention", { q: qShortFr })
          : tFor("fr", "admin.toolboxForm.titleIntentionShort");
        titleEn = qEnTrim
          ? tFor("en", "admin.toolboxForm.titleIntention", { q: qShortEn })
          : tFor("en", "admin.toolboxForm.titleIntentionShort");
        duration = `${inDuration} min`;
        widgetConfig = {
          ...(qTrim || inQuestionEn.trim()
            ? {
                question: qTrim || inQuestionEn.trim(),
                question_i18n: bilingualPair(qTrim || qEnTrim, qEnTrim || qTrim),
              }
            : {}),
          duration_sec: inDuration * 60,
          allow_note: inAllowNote,
          ...(inNotePrompt.trim() || inNotePromptEn.trim()
            ? {
                note_prompt: inNotePrompt.trim() || inNotePromptEn.trim(),
                note_prompt_i18n: bilingualPair(
                  inNotePrompt.trim() || inNotePromptEn.trim(),
                  inNotePromptEn.trim() || inNotePrompt.trim()
                ),
              }
            : {}),
        };
        break;
      }
      case "affirmations": {
        const { fr: affFr, en: affEn } = mergeParallelLines(affirmations, affirmationsEn);
        if (affFr.length === 0) {
          toast({
            title: t("toast.error"),
            description: t("admin.toolboxForm.errAffirmationsRequired"),
            variant: "destructive",
          });
          setSubmitting(false);
          return;
        }
        titleFr = tFor("fr", "admin.toolboxForm.titleAffirmations");
        titleEn = tFor("en", "admin.toolboxForm.titleAffirmations");
        duration = `${affDuration} min`;
        widgetConfig = {
          duration_min: affDuration,
          affirmations: affFr,
          affirmations_i18n: { fr: affFr, en: affEn },
        };
        break;
      }
      case "gratitude":
        titleFr = tFor("fr", "admin.toolboxForm.titleGratitude");
        titleEn = tFor("en", "admin.toolboxForm.titleGratitude");
        duration = "5 min";
        widgetConfig = { entries_count: gratEntries };
        break;
      case "journal_prompt": {
        const jpFr = jpPrompt.trim();
        const jpEn = (jpPromptEn.trim() || jpFr).trim();
        if (!jpFr) { toast({ title: t("toast.error"), description: t("admin.toolboxForm.errPromptRequired"), variant: "destructive" }); setSubmitting(false); return; }
        // Insert into journal_prompts table
        const { error: jpError } = await supabase.from("journal_prompts").insert({
          user_id: userId,
          assigned_by: user.id,
          prompt_text: jpFr,
          prompt_text_i18n: bilingualPair(jpFr, jpEn),
        });
        if (jpError) { toast({ title: t("toast.error"), description: jpError.message, variant: "destructive" }); setSubmitting(false); return; }
        // Also create toolbox assignment for tracking
        journalCardTitleFr = jpFr.length > 72 ? `${jpFr.slice(0, 72)}…` : jpFr;
        journalCardTitleEn = jpEn.length > 72 ? `${jpEn.slice(0, 72)}…` : jpEn;
        titleFr = tFor("fr", "admin.toolboxForm.titleJournalPrompt");
        titleEn = tFor("en", "admin.toolboxForm.titleJournalPrompt");
        duration = "10 min";
        widgetConfig = { prompt: jpFr, prompt_i18n: bilingualPair(jpFr, jpEn) };
        break;
      }
      case "external_link":
        if (!elTitle.trim() || !elUrl.trim()) { toast({ title: t("toast.error"), description: t("admin.toolboxForm.errTitleUrlRequired"), variant: "destructive" }); setSubmitting(false); return; }
        if (isLikelyVideoUrl(elUrl)) {
          toast({
            title: t("toast.error"),
            description: "Videos must be added via the admin library, not in the Toolbox.",
            variant: "destructive",
          });
          setSubmitting(false);
          return;
        }
        titleFr = elTitle.trim();
        titleEn = (elTitleEn.trim() || elTitle.trim());
        duration = elDuration || "—";
        externalUrl = elUrl;
        widgetConfig = {};
        break;
      case "micro_practice": {
        const insFr = mpInstructions.trim();
        const insEn = mpInstructionsEn.trim();
        if (!insFr && !insEn) {
          toast({
            title: t("toast.error"),
            description: t("admin.toolboxForm.errMicroInstructionsRequired"),
            variant: "destructive",
          });
          setSubmitting(false);
          return;
        }
        const instructionsPair = bilingualPair(insFr || insEn, insEn || insFr);
        const frSteps = mpStepsRaw.split("\n").map((l) => l.trim()).filter(Boolean);
        const enSteps = mpStepsRawEn.split("\n").map((l) => l.trim()).filter(Boolean);
        const nS = Math.max(frSteps.length, enSteps.length);
        const mpSteps =
          nS > 0
            ? Array.from({ length: nS }, (_, i) => {
                const fr = frSteps[i] ?? enSteps[i] ?? "";
                const en = enSteps[i] ?? frSteps[i] ?? "";
                const tx = bilingualPair(fr || en, en || fr);
                return { text: tx.fr, text_i18n: tx };
              }).filter((s) => s.text.trim())
            : [];
        const mpTitleFr = instructionsPair.fr.slice(0, 60) + (instructionsPair.fr.length > 60 ? "…" : "");
        const mpTitleEn = instructionsPair.en.slice(0, 60) + (instructionsPair.en.length > 60 ? "…" : "");
        titleFr = mpTitleFr;
        titleEn = mpTitleEn;
        duration = `${mpDurationMin} min`;
        widgetConfig = {
          instructions: instructionsPair.fr,
          instructions_i18n: instructionsPair,
          ...(mpDurationMin > 0 ? { duration_sec: mpDurationMin * 60 } : {}),
          ...(mpSteps.length > 0 ? { steps: mpSteps } : {}),
        };
        break;
      }
    }

    // Apply optional manual EN override (for journal_prompt we keep its own card title pair)
    if (selectedType !== "journal_prompt" && selectedType !== "external_link" && customTitleEn.trim()) {
      titleEn = customTitleEn.trim();
    }
    // Legacy `title` column: FR-first canonical string for search/exports — end-user UI uses `title_i18n` + locale (not admin UI language).
    title = titleFr || titleEn || "";
    const toastTitle = (locale === "en" ? titleEn : titleFr) || titleFr || titleEn;

    try {
      await assignToolboxDirect({
        actorId: user.id,
        userId,
        contentType: selectedType,
        title,
        titleI18n:
          selectedType === "journal_prompt" && journalCardTitleFr && journalCardTitleEn
            ? bilingualPair(journalCardTitleFr, journalCardTitleEn)
            : (titleFr || titleEn)
              ? bilingualPair(titleFr || titleEn, titleEn || titleFr)
              : undefined,
        duration,
        externalUrl,
        widgetConfig,
      });
      if (selectedType === "journal_prompt" && jpPrompt.trim()) {
        await logProgramEvent({
          actor_id: user.id,
          user_id: userId,
          entity_type: "journal_prompt",
          event_type: "assigned_from_toolbox_form",
          metadata: { prompt_length: jpPrompt.trim().length },
        });
      }
      toast({ title: t("admin.toolboxForm.toastAssignedTitle"), description: t("admin.toolboxForm.toastAssignedDesc", { title: toastTitle }) });
      onAssigned();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : t("toast.unexpected");
      toast({ title: t("toast.error"), description: msg, variant: "destructive" });
    }
    setSubmitting(false);
  };

  const inputClass =
    "flex h-11 w-full rounded-lg border border-border/60 bg-bg-elevated/80 px-3 py-2 text-base text-text-primary shadow-sm transition-colors placeholder:text-text-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base md:text-sm";
  const labelClass = "mb-2 block text-sm font-medium text-text-primary";

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <p className={labelClass}>{t("admin.toolboxMgmt.filterByType")}</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {WIDGET_TYPES.map((wt) => (
            <button
              key={wt.value}
              type="button"
              onClick={() => setSelectedType(wt.value)}
              className={`flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                selectedType === wt.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/60 bg-bg-elevated/60 text-text-secondary hover:border-primary/30 hover:text-text-primary"
              }`}
            >
              <wt.icon size={16} className="shrink-0" aria-hidden />
              <span className="truncate">{wt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Config forms */}
      <AnimatePresence mode="wait">
        {selectedType && (
          <motion.div key={selectedType} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="rounded-xl border border-border/50 bg-muted/20 p-5 space-y-5 md:p-6">

            {selectedType === "breathwork" && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div>
                    <label className={labelClass}>{t("admin.toolboxForm.label.cycles")}</label>
                    <input type="number" min={1} max={20} value={bwCycles} onChange={(e) => setBwCycles(+e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>{t("admin.toolboxForm.label.inhaleSec")}</label>
                    <input type="number" min={1} max={30} value={bwBreathIn} onChange={(e) => setBwBreathIn(+e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>{t("admin.toolboxForm.label.pause1Sec")}</label>
                    <input type="number" min={0} max={30} value={bwPause1} onChange={(e) => setBwPause1(+e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>{t("admin.toolboxForm.label.exhaleSec")}</label>
                    <input type="number" min={1} max={30} value={bwBreathOut} onChange={(e) => setBwBreathOut(+e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>{t("admin.toolboxForm.label.pause2Sec")}</label>
                    <input type="number" min={0} max={30} value={bwPause2} onChange={(e) => setBwPause2(+e.target.value)} className={inputClass} />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{t("admin.toolboxForm.breathworkEstimated")} <span className="text-primary font-medium">{computeBreathworkDuration()} min</span> ({bwCycles} × {bwBreathIn + bwPause1 + bwBreathOut + bwPause2}s)</p>

                {/* Cycle preview */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(bwCycles, 8) }).map((_, i) => (
                    <div key={i} className="flex items-center gap-0.5">
                      <div className="w-2 h-6 rounded-sm bg-primary/40" title={`${t("admin.toolboxForm.breathTitleInhale")} ${bwBreathIn}s`} />
                      <div className="w-1.5 h-3 rounded-sm bg-primary/20" title={`${t("admin.toolboxForm.breathTitlePause")} ${bwPause1}s`} />
                      <div className="w-2 h-6 rounded-sm bg-neural-accent/40" title={`${t("admin.toolboxForm.breathTitleExhale")} ${bwBreathOut}s`} />
                      <div className="w-1.5 h-3 rounded-sm bg-neural-accent/20" title={`${t("admin.toolboxForm.breathTitlePause")} ${bwPause2}s`} />
                    </div>
                  ))}
                  {bwCycles > 8 && <span className="text-neural-label ml-1">+{bwCycles - 8}</span>}
                </div>
              </>
            )}

            {selectedType === "focus_introspectif" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>{t("admin.toolboxForm.intentionLabel")} (FR)</label>
                  <input type="text" value={fiIntention} onChange={(e) => setFiIntention(e.target.value)} placeholder={t("admin.toolboxForm.intentionPlaceholder")} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>{t("admin.toolboxForm.focusTopicEnLabel")}</label>
                  <input type="text" value={fiIntentionEn} onChange={(e) => setFiIntentionEn(e.target.value)} placeholder={t("admin.toolboxForm.langEnOptionalMirror")} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>{t("admin.toolboxForm.durationMin")}</label>
                  <input type="number" min={1} max={60} value={fiDuration} onChange={(e) => setFiDuration(+e.target.value)} className={inputClass} />
                </div>
              </div>
            )}

            {selectedType === "body_scan" && (
              <div>
                <label className={labelClass}>{t("admin.toolboxForm.bodyScanDuration")}</label>
                <input type="number" min={1} max={60} value={bsDuration} onChange={(e) => setBsDuration(+e.target.value)} className={inputClass} />
              </div>
            )}

            {selectedType === "visualization" && (
              <div className="space-y-3">
                <div>
                  <label className={labelClass}>{t("admin.toolboxForm.modeLabel")}</label>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        { v: "timed" as const, l: t("admin.toolboxForm.vizModeTimed") },
                        { v: "manual" as const, l: t("admin.toolboxForm.vizModeManual") },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.v}
                        type="button"
                        onClick={() => setVizMode(opt.v)}
                        className={`text-[9px] uppercase tracking-[0.15em] px-3 py-2 rounded-lg border ${
                          vizMode === opt.v ? "border-primary/40 bg-primary/5 text-primary" : "border-border/30 text-muted-foreground"
                        }`}
                      >
                        {opt.l}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={labelClass}>{t("admin.toolboxForm.vizTargetMin")}</label>
                  <input type="number" min={1} max={45} value={vizDuration} onChange={(e) => setVizDuration(+e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>{t("admin.toolboxForm.vizCuesLabel")}</label>
                  <textarea
                    value={vizCues}
                    onChange={(e) => setVizCues(e.target.value)}
                    rows={4}
                    placeholder={t("admin.toolboxForm.vizCuesPlaceholder")}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>{t("admin.toolboxForm.vizCuesEnLabel")}</label>
                  <textarea
                    value={vizCuesEn}
                    onChange={(e) => setVizCuesEn(e.target.value)}
                    rows={4}
                    placeholder={t("admin.toolboxForm.vizCuesEnPlaceholder")}
                    className={inputClass}
                  />
                  <p className="text-xs text-muted-foreground mt-1">{t("admin.toolboxForm.langEnOptionalMirror")}</p>
                </div>
              </div>
            )}

            {selectedType === "stop_protocol" && (
              <div className="space-y-3">
                <div>
                  <label className={labelClass}>{t("admin.toolboxForm.modeLabel")}</label>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        { v: "manual" as const, l: t("admin.toolboxForm.stopModeManual") },
                        { v: "timed" as const, l: t("admin.toolboxForm.stopModeTimed") },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.v}
                        type="button"
                        onClick={() => setStopMode(opt.v)}
                        className={`text-[9px] uppercase tracking-[0.15em] px-3 py-2 rounded-lg border ${
                          stopMode === opt.v ? "border-primary/40 bg-primary/5 text-primary" : "border-border/30 text-muted-foreground"
                        }`}
                      >
                        {opt.l}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={labelClass}>{t("admin.toolboxForm.stopStepSec")}</label>
                  <input
                    type="number"
                    min={10}
                    max={120}
                    value={stopStepSec}
                    onChange={(e) => setStopStepSec(+e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>{t("admin.toolboxForm.stopStepsLabel")}</label>
                  <textarea
                    value={stopStepsRaw}
                    onChange={(e) => setStopStepsRaw(e.target.value)}
                    rows={5}
                    placeholder={t("admin.toolboxForm.stopStepsPlaceholder")}
                    className={inputClass}
                  />
                  <p className="text-xs text-muted-foreground mt-1">{t("admin.toolboxForm.stopDefaultHint")}</p>
                </div>
                <div>
                  <label className={labelClass}>{t("admin.toolboxForm.stopStepsLabelEn")}</label>
                  <textarea
                    value={stopStepsRawEn}
                    onChange={(e) => setStopStepsRawEn(e.target.value)}
                    rows={5}
                    placeholder={t("admin.toolboxForm.stopStepsPlaceholder")}
                    className={inputClass}
                  />
                  <p className="text-xs text-muted-foreground mt-1">{t("admin.toolboxForm.langEnOptionalMirror")}</p>
                </div>
              </div>
            )}

            {selectedType === "intention" && (
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>{t("admin.toolboxForm.intentionQuestion")} (FR)</label>
                  <textarea
                    value={inQuestion}
                    onChange={(e) => setInQuestion(e.target.value)}
                    rows={2}
                    placeholder={t("admin.toolboxForm.intentionQuestionPlaceholder")}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>{t("admin.toolboxForm.intentionQuestionEnLabel")}</label>
                  <textarea
                    value={inQuestionEn}
                    onChange={(e) => setInQuestionEn(e.target.value)}
                    rows={2}
                    placeholder={t("admin.toolboxForm.langEnOptionalMirror")}
                    className={inputClass}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>{t("admin.toolboxForm.reflectionMin")}</label>
                    <input type="number" min={1} max={30} value={inDuration} onChange={(e) => setInDuration(+e.target.value)} className={inputClass} />
                  </div>
                  <div className="flex items-end pb-2">
                    <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                      <input
                        type="checkbox"
                        checked={inAllowNote}
                        onChange={(e) => setInAllowNote(e.target.checked)}
                        className="rounded border-border"
                      />
                      {t("admin.toolboxForm.offerNoteAfter")}
                    </label>
                  </div>
                </div>
                {inAllowNote && (
                  <div className="space-y-3">
                    <div>
                      <label className={labelClass}>{t("admin.toolboxForm.notePlaceholderLabel")} (FR)</label>
                      <input
                        type="text"
                        value={inNotePrompt}
                        onChange={(e) => setInNotePrompt(e.target.value)}
                        placeholder={t("toolbox.intentionWidget.notePlaceholder")}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>{t("admin.toolboxForm.notePromptEnLabel")}</label>
                      <input
                        type="text"
                        value={inNotePromptEn}
                        onChange={(e) => setInNotePromptEn(e.target.value)}
                        placeholder={t("admin.toolboxForm.langEnOptionalMirror")}
                        className={inputClass}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {selectedType === "affirmations" && (
              <div className="space-y-3">
                <div>
                  <label className={labelClass}>{t("admin.toolboxForm.affirmDuration")}</label>
                  <input type="number" min={1} max={30} value={affDuration} onChange={(e) => setAffDuration(+e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>{t("admin.toolboxForm.affirmLines")} (FR)</label>
                  <textarea value={affirmations} onChange={(e) => setAffirmations(e.target.value)} rows={4} placeholder={t("admin.toolboxForm.affirmPlaceholder")} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>{t("admin.toolboxForm.affirmLinesEnLabel")}</label>
                  <textarea value={affirmationsEn} onChange={(e) => setAffirmationsEn(e.target.value)} rows={4} placeholder={t("admin.toolboxForm.affirmPlaceholder")} className={inputClass} />
                  <p className="text-xs text-muted-foreground mt-1">{t("admin.toolboxForm.langEnOptionalMirror")}</p>
                </div>
              </div>
            )}

            {selectedType === "gratitude" && (
              <div>
                <label className={labelClass}>{t("admin.toolboxForm.gratitudeEntries")}</label>
                <input type="number" min={1} max={10} value={gratEntries} onChange={(e) => setGratEntries(+e.target.value)} className={inputClass} />
              </div>
            )}

            {selectedType === "journal_prompt" && (
              <div className="space-y-3">
                <div>
                  <label className={labelClass}>{t("admin.toolboxForm.journalPromptLabel")} (FR)</label>
                  <textarea value={jpPrompt} onChange={(e) => setJpPrompt(e.target.value)} rows={3}
                    placeholder={t("admin.toolboxForm.journalPromptPlaceholder")}
                    className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>{t("admin.toolboxForm.journalPromptLabel")} (EN)</label>
                  <textarea value={jpPromptEn} onChange={(e) => setJpPromptEn(e.target.value)} rows={3}
                    placeholder={"Optional — if empty, English will mirror French."}
                    className={inputClass} />
                  <p className="text-xs text-muted-foreground mt-1">If EN is empty, we mirror FR for both languages.</p>
                </div>
              </div>
            )}

            {selectedType === "micro_practice" && (
              <div className="space-y-3">
                <div>
                  <label className={labelClass}>{t("admin.toolboxForm.microInstructionsFr")}</label>
                  <textarea
                    value={mpInstructions}
                    onChange={(e) => setMpInstructions(e.target.value)}
                    rows={4}
                    placeholder={t("admin.toolboxForm.affirmPlaceholder")}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>{t("admin.toolboxForm.microInstructionsEn")}</label>
                  <textarea
                    value={mpInstructionsEn}
                    onChange={(e) => setMpInstructionsEn(e.target.value)}
                    rows={4}
                    placeholder={t("admin.toolboxForm.langEnOptionalMirror")}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>{t("admin.toolboxForm.microDurationMin")}</label>
                  <input type="number" min={1} max={60} value={mpDurationMin} onChange={(e) => setMpDurationMin(+e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>{t("admin.toolboxForm.microStepsFr")}</label>
                  <textarea
                    value={mpStepsRaw}
                    onChange={(e) => setMpStepsRaw(e.target.value)}
                    rows={5}
                    placeholder={t("admin.toolboxForm.affirmPlaceholder")}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>{t("admin.toolboxForm.microStepsEn")}</label>
                  <textarea
                    value={mpStepsRawEn}
                    onChange={(e) => setMpStepsRawEn(e.target.value)}
                    rows={5}
                    placeholder={t("admin.toolboxForm.langEnOptionalMirror")}
                    className={inputClass}
                  />
                </div>
              </div>
            )}

            {selectedType === "external_link" && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>{t("admin.toolboxForm.extTitle")} (FR)</label>
                    <input type="text" value={elTitle} onChange={(e) => setElTitle(e.target.value)} placeholder={t("admin.toolboxForm.extTitlePlaceholder")} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>{t("admin.toolboxForm.extTitle")} (EN)</label>
                    <input type="text" value={elTitleEn} onChange={(e) => setElTitleEn(e.target.value)} placeholder="Optional — falls back to FR" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>{t("admin.toolboxForm.extDurationOptional")}</label>
                    <input type="text" value={elDuration} onChange={(e) => setElDuration(e.target.value)} placeholder="45 min" className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>{t("admin.toolboxForm.extUrl")}</label>
                  <input type="url" value={elUrl} onChange={(e) => setElUrl(e.target.value)} placeholder="https://..." className={inputClass} />
                </div>
              </div>
            )}

            {selectedType !== "journal_prompt" && selectedType !== "external_link" && (
              <div className="pt-2 border-t border-border/20">
                <label className={labelClass}>Title (EN) — optional override</label>
                <input
                  type="text"
                  value={customTitleEn}
                  onChange={(e) => setCustomTitleEn(e.target.value)}
                  placeholder="Leave empty to auto-translate from the catalog"
                  className={inputClass}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Use this to provide a custom English title. If left empty, the English version is generated from the built-in translations.
                </p>
              </div>
            )}

            <button onClick={handleSubmit} disabled={submitting}
              className="btn-neural disabled:opacity-50">
              <Send size={14} /> {submitting ? t("admin.toolboxForm.submitting") : t("admin.toolboxForm.submit")}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
