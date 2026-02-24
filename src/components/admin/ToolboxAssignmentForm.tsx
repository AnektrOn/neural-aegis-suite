import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wind, Eye, Brain, BookOpen, Heart, Sparkles, Link as LinkIcon, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Props {
  userId: string;
  onAssigned: () => void;
}

const WIDGET_TYPES = [
  { value: "breathwork", label: "Breathwork", icon: Wind, color: "text-primary" },
  { value: "focus_introspectif", label: "Focus Introspectif", icon: Eye, color: "text-neural-accent" },
  { value: "body_scan", label: "Body Scan", icon: Brain, color: "text-neural-warm" },
  { value: "affirmations", label: "Affirmations", icon: Sparkles, color: "text-primary" },
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
      case "body_scan":
        title = `Body Scan`;
        duration = `${bsDuration} min`;
        widgetConfig = { duration_min: bsDuration, zones: ["tête", "épaules", "poitrine", "abdomen", "jambes", "pieds"] };
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
        // Insert into journal_prompts table instead
        const { error: jpError } = await supabase.from("journal_prompts" as any).insert({
          user_id: userId, assigned_by: user.id, prompt_text: jpPrompt,
        } as any);
        if (jpError) { toast({ title: "Erreur", description: jpError.message, variant: "destructive" }); }
        else { toast({ title: "Prompt journal assigné" }); onAssigned(); }
        setSubmitting(false);
        return;
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
