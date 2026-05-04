import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wind, Eye, Scan, BookOpen, Heart, Sparkles, Stars, Link as LinkIcon, Send, ShieldAlert, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_BODY_SCAN_TOTAL_SEC, DEFAULT_BODY_SCAN_ZONES } from "@/components/widgets/BodyScanWidget";
import { DEFAULT_VISUALIZATION_SCENES, DEFAULT_VISUALIZATION_TOTAL_SEC } from "@/components/widgets/VisualizationWidget";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import type { TranslationKey } from "@/i18n/translations";

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
];

export default function ToolboxAssignmentForm({ userId, onAssigned }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();

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

  // Body Scan config
  const [bsDuration, setBsDuration] = useState(10);

  // Affirmations config
  const [affDuration, setAffDuration] = useState(5);
  const [affirmations, setAffirmations] = useState("");

  // Gratitude config
  const [gratEntries, setGratEntries] = useState(3);

  // Journal Prompt config
  const [jpPrompt, setJpPrompt] = useState("");

  // Visualization config
  const [vizDuration, setVizDuration] = useState(8);
  const [vizCues, setVizCues] = useState("");
  const [vizMode, setVizMode] = useState<"timed" | "manual">("timed");

  // STOP protocol (optional custom steps: "Titre — indication" per line)
  const [stopStepsRaw, setStopStepsRaw] = useState("");
  const [stopMode, setStopMode] = useState<"timed" | "manual">("manual");
  const [stopStepSec, setStopStepSec] = useState(30);

  // Intention (dedicated widget)
  const [inDuration, setInDuration] = useState(2);
  const [inQuestion, setInQuestion] = useState("");
  const [inAllowNote, setInAllowNote] = useState(true);
  const [inNotePrompt, setInNotePrompt] = useState("");

  // External Link config
  const [elTitle, setElTitle] = useState("");
  const [elUrl, setElUrl] = useState("");
  const [elDuration, setElDuration] = useState("");

  const computeBreathworkDuration = () => {
    const cycleTime = bwBreathIn + bwPause1 + bwBreathOut + bwPause2;
    return Math.ceil((cycleTime * bwCycles) / 60);
  };

  const handleSubmit = async () => {
    if (!user || !selectedType) return;
    setSubmitting(true);

    let title = "";
    let duration = "";
    let widgetConfig: any = null;
    let externalUrl: string | null = null;

    switch (selectedType) {
      case "breathwork":
        title = t("admin.toolboxForm.titleBreathwork", { n: bwCycles });
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
        const topic = fiIntention.trim() || t("admin.toolboxForm.topicFree");
        title = t("admin.toolboxForm.titleFocus", { topic });
        duration = `${fiDuration} min`;
        widgetConfig = { duration_min: fiDuration, intention: topic };
        break;
      }
      case "body_scan": {
        title = t("admin.toolboxForm.titleBodyScan");
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
        title = t("admin.toolboxForm.titleVizGuided");
        duration = `${vizDuration} min`;
        const cues = vizCues.split("\n").map((l) => l.trim()).filter(Boolean);
        const palette = ["hsl(176 70% 48%)", "hsl(220 70% 60%)", "hsl(270 50% 60%)", "hsl(35 80% 58%)"];
        if (cues.length === 0) {
          const scale = (vizDuration * 60) / DEFAULT_VISUALIZATION_TOTAL_SEC;
          widgetConfig = {
            mode: vizMode,
            scenes: DEFAULT_VISUALIZATION_SCENES.map((s) => ({
              ...s,
              duration_sec: Math.max(8, Math.round(s.duration_sec * scale)),
            })),
          };
        } else {
          const per = Math.max(5, Math.round((vizDuration * 60) / cues.length));
          widgetConfig = {
            mode: vizMode,
            scenes: cues.map((instruction, i) => ({
              id: `custom_${i}`,
              label: t("admin.toolboxForm.sceneLabel", { n: i + 1 }),
              instruction,
              duration_sec: per,
              color: palette[i % palette.length],
            })),
          };
        }
        break;
      }
      case "stop_protocol": {
        title = t("admin.toolboxForm.titleStop");
        const steps = parseStopSteps(stopStepsRaw);
        const nSteps = steps.length || 4;
        duration = `${Math.max(1, Math.round((stopStepSec * nSteps) / 60))} min`;
        widgetConfig = {
          mode: stopMode,
          step_duration_sec: stopStepSec,
          ...(steps.length ? { steps } : {}),
        };
        break;
      }
      case "intention":
        title = inQuestion.trim()
          ? t("admin.toolboxForm.titleIntention", {
              q: `${inQuestion.trim().slice(0, 48)}${inQuestion.trim().length > 48 ? "…" : ""}`,
            })
          : t("admin.toolboxForm.titleIntentionShort");
        duration = `${inDuration} min`;
        widgetConfig = {
          ...(inQuestion.trim() ? { question: inQuestion.trim() } : {}),
          duration_sec: inDuration * 60,
          allow_note: inAllowNote,
          ...(inNotePrompt.trim() ? { note_prompt: inNotePrompt.trim() } : {}),
        };
        break;
      case "affirmations":
        title = t("admin.toolboxForm.titleAffirmations");
        duration = `${affDuration} min`;
        widgetConfig = {
          duration_min: affDuration,
          affirmations: affirmations.split("\n").filter(Boolean),
        };
        break;
      case "gratitude":
        title = t("admin.toolboxForm.titleGratitude");
        duration = "5 min";
        widgetConfig = { entries_count: gratEntries };
        break;
      case "journal_prompt":
        if (!jpPrompt.trim()) { toast({ title: t("toast.error"), description: t("admin.toolboxForm.errPromptRequired"), variant: "destructive" }); setSubmitting(false); return; }
        // Insert into journal_prompts table
        const { error: jpError } = await supabase.from("journal_prompts" as any).insert({
          user_id: userId, assigned_by: user.id, prompt_text: jpPrompt,
        } as any);
        if (jpError) { toast({ title: t("toast.error"), description: jpError.message, variant: "destructive" }); setSubmitting(false); return; }
        // Also create toolbox assignment for tracking
        title = t("admin.toolboxForm.titleJournalPrompt");
        duration = "10 min";
        widgetConfig = { prompt: jpPrompt };
        break;
      case "external_link":
        if (!elTitle.trim() || !elUrl.trim()) { toast({ title: t("toast.error"), description: t("admin.toolboxForm.errTitleUrlRequired"), variant: "destructive" }); setSubmitting(false); return; }
        title = elTitle;
        duration = elDuration || "—";
        externalUrl = elUrl;
        break;
    }

    const payload: any = {
      user_id: userId,
      content_type: selectedType,
      title,
      duration,
      assigned_by: user.id,
      widget_config: widgetConfig,
      external_url: externalUrl,
    };

    const { error } = await supabase.from("toolbox_assignments" as any).insert(payload);
    if (error) { toast({ title: t("toast.error"), description: error.message, variant: "destructive" }); }
    else { toast({ title: t("admin.toolboxForm.toastAssignedTitle"), description: t("admin.toolboxForm.toastAssignedDesc", { title }) }); onAssigned(); }
    setSubmitting(false);
  };

  const inputClass = "w-full bg-secondary/30 border border-border/30 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40 transition-colors";
  const labelClass = "text-neural-label block mb-1.5";

  return (
    <div className="space-y-4">
      <p className="text-neural-label">{t("admin.toolboxForm.assignHeading")}</p>

      {/* Widget type selector */}
      <div className="flex flex-wrap gap-2">
        {WIDGET_TYPES.map((wt) => (
          <button key={wt.value} onClick={() => setSelectedType(wt.value)}
            className={`flex items-center gap-2 text-[9px] uppercase tracking-[0.2em] px-3 py-2 rounded-lg border transition-all ${
              selectedType === wt.value ? "border-primary/40 bg-primary/5 text-primary" : "border-border/30 text-muted-foreground hover:border-primary/30 hover:text-primary"
            }`}>
            <wt.icon size={12} /> {wt.label}
          </button>
        ))}
      </div>

      {/* Config forms */}
      <AnimatePresence mode="wait">
        {selectedType && (
          <motion.div key={selectedType} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="bg-secondary/10 border border-border/20 rounded-xl p-5 space-y-4">

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
                  <label className={labelClass}>{t("admin.toolboxForm.durationMin")}</label>
                  <input type="number" min={1} max={60} value={fiDuration} onChange={(e) => setFiDuration(+e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>{t("admin.toolboxForm.intentionLabel")}</label>
                  <input type="text" value={fiIntention} onChange={(e) => setFiIntention(e.target.value)} placeholder={t("admin.toolboxForm.intentionPlaceholder")} className={inputClass} />
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
              </div>
            )}

            {selectedType === "intention" && (
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>{t("admin.toolboxForm.intentionQuestion")}</label>
                  <textarea
                    value={inQuestion}
                    onChange={(e) => setInQuestion(e.target.value)}
                    rows={2}
                    placeholder={t("admin.toolboxForm.intentionQuestionPlaceholder")}
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
                  <div>
                    <label className={labelClass}>{t("admin.toolboxForm.notePlaceholderLabel")}</label>
                    <input
                      type="text"
                      value={inNotePrompt}
                      onChange={(e) => setInNotePrompt(e.target.value)}
                      placeholder={t("toolbox.intentionWidget.notePlaceholder")}
                      className={inputClass}
                    />
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
                  <label className={labelClass}>{t("admin.toolboxForm.affirmLines")}</label>
                  <textarea value={affirmations} onChange={(e) => setAffirmations(e.target.value)} rows={4} placeholder={t("admin.toolboxForm.affirmPlaceholder")} className={inputClass} />
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
              <div>
                <label className={labelClass}>{t("admin.toolboxForm.journalPromptLabel")}</label>
                <textarea value={jpPrompt} onChange={(e) => setJpPrompt(e.target.value)} rows={3}
                  placeholder={t("admin.toolboxForm.journalPromptPlaceholder")}
                  className={inputClass} />
              </div>
            )}

            {selectedType === "external_link" && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>{t("admin.toolboxForm.extTitle")}</label>
                    <input type="text" value={elTitle} onChange={(e) => setElTitle(e.target.value)} placeholder={t("admin.toolboxForm.extTitlePlaceholder")} className={inputClass} />
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
