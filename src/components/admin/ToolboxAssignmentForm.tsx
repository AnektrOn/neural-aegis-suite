import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wind, Eye, Scan, BookOpen, Heart, Sparkles, Stars, Link as LinkIcon, Send, ShieldAlert, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_BODY_SCAN_TOTAL_SEC, DEFAULT_BODY_SCAN_ZONES } from "@/components/widgets/BodyScanWidget";
import { DEFAULT_VISUALIZATION_SCENES, DEFAULT_VISUALIZATION_TOTAL_SEC } from "@/components/widgets/VisualizationWidget";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

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

const WIDGET_TYPES = [
  { value: "breathwork", label: "Breathwork", icon: Wind, color: "text-primary" },
  { value: "focus_introspectif", label: "Focus Introspectif", icon: Eye, color: "text-neural-accent" },
  { value: "body_scan", label: "Body Scan", icon: Scan, color: "text-neural-warm" },
  { value: "visualization", label: "Visualisation", icon: Sparkles, color: "text-neural-accent" },
  { value: "stop_protocol", label: "Protocole STOP", icon: ShieldAlert, color: "text-destructive" },
  { value: "intention", label: "Intention", icon: Target, color: "text-primary" },
  { value: "affirmations", label: "Affirmations", icon: Stars, color: "text-primary" },
  { value: "gratitude", label: "Gratitude Check-in", icon: Heart, color: "text-destructive" },
  { value: "journal_prompt", label: "Journal Prompt", icon: BookOpen, color: "text-neural-accent" },
  { value: "external_link", label: "Lien Externe", icon: LinkIcon, color: "text-muted-foreground" },
];

export default function ToolboxAssignmentForm({ userId, onAssigned }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
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
        title = `Breathwork ${bwCycles} cycles`;
        duration = `${computeBreathworkDuration()} min`;
        widgetConfig = {
          cycles: bwCycles,
          breath_in_sec: bwBreathIn,
          pause1_sec: bwPause1,
          breath_out_sec: bwBreathOut,
          pause2_sec: bwPause2,
        };
        break;
      case "focus_introspectif":
        title = `Focus Introspectif – ${fiIntention || "Libre"}`;
        duration = `${fiDuration} min`;
        widgetConfig = { duration_min: fiDuration, intention: fiIntention || "Libre" };
        break;
      case "body_scan": {
        title = `Body Scan`;
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
        title = `Visualisation guidée`;
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
              label: `Scène ${i + 1}`,
              instruction,
              duration_sec: per,
              color: palette[i % palette.length],
            })),
          };
        }
        break;
      }
      case "stop_protocol": {
        title = `Protocole STOP`;
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
        title = inQuestion.trim() ? `Intention – ${inQuestion.trim().slice(0, 48)}${inQuestion.trim().length > 48 ? "…" : ""}` : "Intention";
        duration = `${inDuration} min`;
        widgetConfig = {
          ...(inQuestion.trim() ? { question: inQuestion.trim() } : {}),
          duration_sec: inDuration * 60,
          allow_note: inAllowNote,
          ...(inNotePrompt.trim() ? { note_prompt: inNotePrompt.trim() } : {}),
        };
        break;
      case "affirmations":
        title = `Affirmations`;
        duration = `${affDuration} min`;
        widgetConfig = {
          duration_min: affDuration,
          affirmations: affirmations.split("\n").filter(Boolean),
        };
        break;
      case "gratitude":
        title = `Gratitude Check-in`;
        duration = "5 min";
        widgetConfig = { entries_count: gratEntries };
        break;
      case "journal_prompt":
        if (!jpPrompt.trim()) { toast({ title: "Erreur", description: "Le prompt est requis", variant: "destructive" }); setSubmitting(false); return; }
        // Insert into journal_prompts table
        const { error: jpError } = await supabase.from("journal_prompts" as any).insert({
          user_id: userId, assigned_by: user.id, prompt_text: jpPrompt,
        } as any);
        if (jpError) { toast({ title: "Erreur", description: jpError.message, variant: "destructive" }); setSubmitting(false); return; }
        // Also create toolbox assignment for tracking
        title = `Journal Prompt`;
        duration = "10 min";
        widgetConfig = { prompt: jpPrompt };
        break;
      case "external_link":
        if (!elTitle.trim() || !elUrl.trim()) { toast({ title: "Erreur", description: "Titre et URL requis", variant: "destructive" }); setSubmitting(false); return; }
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
    if (error) { toast({ title: "Erreur", description: error.message, variant: "destructive" }); }
    else { toast({ title: "Outil assigné", description: `"${title}" assigné avec succès` }); onAssigned(); }
    setSubmitting(false);
  };

  const inputClass = "w-full bg-secondary/30 border border-border/30 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40 transition-colors";
  const labelClass = "text-neural-label block mb-1.5";

  return (
    <div className="space-y-4">
      <p className="text-neural-label">Assigner un outil</p>

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
                    <label className={labelClass}>Cycles</label>
                    <input type="number" min={1} max={20} value={bwCycles} onChange={(e) => setBwCycles(+e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Inspir (s)</label>
                    <input type="number" min={1} max={30} value={bwBreathIn} onChange={(e) => setBwBreathIn(+e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Pause 1 (s)</label>
                    <input type="number" min={0} max={30} value={bwPause1} onChange={(e) => setBwPause1(+e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Expir (s)</label>
                    <input type="number" min={1} max={30} value={bwBreathOut} onChange={(e) => setBwBreathOut(+e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Pause 2 (s)</label>
                    <input type="number" min={0} max={30} value={bwPause2} onChange={(e) => setBwPause2(+e.target.value)} className={inputClass} />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Durée totale estimée : <span className="text-primary font-medium">{computeBreathworkDuration()} min</span> ({bwCycles} × {bwBreathIn + bwPause1 + bwBreathOut + bwPause2}s)</p>

                {/* Cycle preview */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(bwCycles, 8) }).map((_, i) => (
                    <div key={i} className="flex items-center gap-0.5">
                      <div className="w-2 h-6 rounded-sm bg-primary/40" title={`Inspir ${bwBreathIn}s`} />
                      <div className="w-1.5 h-3 rounded-sm bg-primary/20" title={`Pause ${bwPause1}s`} />
                      <div className="w-2 h-6 rounded-sm bg-neural-accent/40" title={`Expir ${bwBreathOut}s`} />
                      <div className="w-1.5 h-3 rounded-sm bg-neural-accent/20" title={`Pause ${bwPause2}s`} />
                    </div>
                  ))}
                  {bwCycles > 8 && <span className="text-neural-label ml-1">+{bwCycles - 8}</span>}
                </div>
              </>
            )}

            {selectedType === "focus_introspectif" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Durée (min)</label>
                  <input type="number" min={1} max={60} value={fiDuration} onChange={(e) => setFiDuration(+e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Intention</label>
                  <input type="text" value={fiIntention} onChange={(e) => setFiIntention(e.target.value)} placeholder="Ex: Ancrage émotionnel, Clarté décisionnelle…" className={inputClass} />
                </div>
              </div>
            )}

            {selectedType === "body_scan" && (
              <div>
                <label className={labelClass}>Durée (min)</label>
                <input type="number" min={1} max={60} value={bsDuration} onChange={(e) => setBsDuration(+e.target.value)} className={inputClass} />
              </div>
            )}

            {selectedType === "visualization" && (
              <div className="space-y-3">
                <div>
                  <label className={labelClass}>Mode</label>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        { v: "timed" as const, l: "Temporisé (auto)" },
                        { v: "manual" as const, l: "Manuel (suivant)" },
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
                  <label className={labelClass}>Durée cible (min)</label>
                  <input type="number" min={1} max={45} value={vizDuration} onChange={(e) => setVizDuration(+e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Textes de guidage (une par ligne, optionnel)</label>
                  <textarea
                    value={vizCues}
                    onChange={(e) => setVizCues(e.target.value)}
                    rows={4}
                    placeholder="Laissez vide pour le parcours par défaut (ancrage → retour)&#10;Ou saisissez vos propres instructions, une par ligne."
                    className={inputClass}
                  />
                </div>
              </div>
            )}

            {selectedType === "stop_protocol" && (
              <div className="space-y-3">
                <div>
                  <label className={labelClass}>Mode</label>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        { v: "manual" as const, l: "Manuel" },
                        { v: "timed" as const, l: "Temporisé" },
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
                  <label className={labelClass}>Durée par étape (s)</label>
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
                  <label className={labelClass}>Étapes personnalisées (optionnel, une par ligne : « Titre — indication »)</label>
                  <textarea
                    value={stopStepsRaw}
                    onChange={(e) => setStopStepsRaw(e.target.value)}
                    rows={5}
                    placeholder={"Stop — Pausez ce que vous faites\nRespirez — …\nObservez — …\nReprenez — …"}
                    className={inputClass}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Si vide, le protocole STOP par défaut (S·T·O·P) est utilisé.</p>
                </div>
              </div>
            )}

            {selectedType === "intention" && (
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Question centrale (optionnel)</label>
                  <textarea
                    value={inQuestion}
                    onChange={(e) => setInQuestion(e.target.value)}
                    rows={2}
                    placeholder="Vide = question par défaut dans l’app"
                    className={inputClass}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Durée de réflexion (min)</label>
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
                      Proposer une note après le timer
                    </label>
                  </div>
                </div>
                {inAllowNote && (
                  <div>
                    <label className={labelClass}>Placeholder de la note (optionnel)</label>
                    <input
                      type="text"
                      value={inNotePrompt}
                      onChange={(e) => setInNotePrompt(e.target.value)}
                      placeholder="Mon intention du jour…"
                      className={inputClass}
                    />
                  </div>
                )}
              </div>
            )}

            {selectedType === "affirmations" && (
              <div className="space-y-3">
                <div>
                  <label className={labelClass}>Durée (min)</label>
                  <input type="number" min={1} max={30} value={affDuration} onChange={(e) => setAffDuration(+e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Affirmations (une par ligne)</label>
                  <textarea value={affirmations} onChange={(e) => setAffirmations(e.target.value)} rows={4} placeholder="Je suis capable de prendre des décisions claires&#10;Je mérite le succès&#10;Ma vision est claire" className={inputClass} />
                </div>
              </div>
            )}

            {selectedType === "gratitude" && (
              <div>
                <label className={labelClass}>Nombre d'entrées</label>
                <input type="number" min={1} max={10} value={gratEntries} onChange={(e) => setGratEntries(+e.target.value)} className={inputClass} />
              </div>
            )}

            {selectedType === "journal_prompt" && (
              <div>
                <label className={labelClass}>Prompt de journaling</label>
                <textarea value={jpPrompt} onChange={(e) => setJpPrompt(e.target.value)} rows={3}
                  placeholder="Ex: Qu'est-ce qui vous a surpris aujourd'hui ? Quelle décision avez-vous reportée et pourquoi ?"
                  className={inputClass} />
              </div>
            )}

            {selectedType === "external_link" && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Titre</label>
                    <input type="text" value={elTitle} onChange={(e) => setElTitle(e.target.value)} placeholder="Nom du contenu" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Durée (optionnel)</label>
                    <input type="text" value={elDuration} onChange={(e) => setElDuration(e.target.value)} placeholder="45 min" className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>URL</label>
                  <input type="url" value={elUrl} onChange={(e) => setElUrl(e.target.value)} placeholder="https://..." className={inputClass} />
                </div>
              </div>
            )}

            <button onClick={handleSubmit} disabled={submitting}
              className="btn-neural disabled:opacity-50">
              <Send size={14} /> {submitting ? "Assignation…" : "Assigner"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
