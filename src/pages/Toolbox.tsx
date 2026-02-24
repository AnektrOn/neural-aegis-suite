import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, Pause, Headphones, Eye, BookOpen, Wind, Sparkles, Heart, Brain, Link as LinkIcon, ExternalLink, CheckCircle2, XCircle, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import BreathworkWidget from "@/components/widgets/BreathworkWidget";
import FocusIntrospectifWidget from "@/components/widgets/FocusIntrospectifWidget";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";

interface ToolboxItem {
  id: string;
  title: string;
  content_type: string;
  duration: string | null;
  description: string | null;
  external_url: string | null;
  widget_config: any;
}

interface CompletionRecord {
  assignment_id: string;
  status: string;
}

const typeConfig: Record<string, { icon: typeof Headphones; color: string; label: string }> = {
  meditation: { icon: Headphones, color: "text-primary", label: "Méditation" },
  visualization: { icon: Eye, color: "text-neural-accent", label: "Visualisation" },
  course: { icon: BookOpen, color: "text-neural-warm", label: "Formation" },
  breathwork: { icon: Wind, color: "text-primary", label: "Breathwork" },
  focus_introspectif: { icon: Eye, color: "text-neural-accent", label: "Focus Introspectif" },
  body_scan: { icon: Brain, color: "text-neural-warm", label: "Body Scan" },
  affirmations: { icon: Sparkles, color: "text-primary", label: "Affirmations" },
  gratitude: { icon: Heart, color: "text-destructive", label: "Gratitude" },
  external_link: { icon: LinkIcon, color: "text-muted-foreground", label: "Lien Externe" },
};

export default function Toolbox() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<ToolboxItem[]>([]);
  const [completions, setCompletions] = useState<CompletionRecord[]>([]);
  const [activeWidget, setActiveWidget] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [completionModal, setCompletionModal] = useState<{ open: boolean; itemId: string | null }>({ open: false, itemId: null });
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    const [itemsRes, compRes] = await Promise.all([
      supabase.from("toolbox_assignments").select("*").eq("user_id", user!.id).order("assigned_at", { ascending: false }),
      supabase.from("toolbox_completions").select("assignment_id, status").eq("user_id", user!.id),
    ]);
    if (itemsRes.data) setItems(itemsRes.data as any);
    if (compRes.data) setCompletions(compRes.data as any);
  };

  const getCompletion = (assignmentId: string) => completions.find(c => c.assignment_id === assignmentId);

  const submitCompletion = async (status: "completed" | "abandoned" | "ignored") => {
    if (!completionModal.itemId || !user) return;
    const { error } = await supabase.from("toolbox_completions").insert({
      assignment_id: completionModal.itemId,
      user_id: user.id,
      status,
      feedback: feedback || null,
    } as any);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      const labels: Record<string, string> = { completed: "Terminé ✓", abandoned: "Abandonné", ignored: "Ignoré" };
      toast({ title: labels[status] });
      setCompletionModal({ open: false, itemId: null });
      setFeedback("");
      loadData();
    }
  };

  const filtered = filter === "all" ? items : items.filter((i) => i.content_type === filter);
  const types = ["all", ...new Set(items.map((i) => i.content_type))];

  const stats = {
    completed: completions.filter(c => c.status === "completed").length,
    abandoned: completions.filter(c => c.status === "abandoned").length,
    ignored: completions.filter(c => c.status === "ignored").length,
    total: items.length,
  };

  const getTypeLabel = (t: string) => {
    if (t === "all") return "Tout";
    return typeConfig[t]?.label || t;
  };

  const renderWidget = (item: ToolboxItem) => {
    const config = item.widget_config;
    if (!config) return null;
    switch (item.content_type) {
      case "breathwork":
        return <BreathworkWidget config={config} title={item.title} />;
      case "focus_introspectif":
        return <FocusIntrospectifWidget config={config} title={item.title} />;
      default:
        return null;
    }
  };

  const modalItem = items.find(i => i.id === completionModal.itemId);

  return (
    <div className="space-y-10 max-w-5xl">
      <div>
        <p className="text-neural-label mb-3">Bibliothèque Neurale</p>
        <h1 className="text-neural-title text-3xl text-foreground">Boîte à Outils</h1>
      </div>

      {/* Stats bar */}
      {items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total", value: stats.total, icon: Headphones, color: "text-muted-foreground" },
            { label: "Terminés", value: stats.completed, icon: CheckCircle2, color: "text-primary" },
            { label: "Abandonnés", value: stats.abandoned, icon: XCircle, color: "text-destructive" },
            { label: "Ignorés", value: stats.ignored, icon: EyeOff, color: "text-muted-foreground" },
          ].map((s) => (
            <div key={s.label} className="ethereal-glass p-4 text-center">
              <s.icon size={16} strokeWidth={1.5} className={`${s.color} mx-auto mb-2`} />
              <p className="text-xl font-cinzel text-foreground">{s.value}</p>
              <p className="text-neural-label mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {types.map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`text-[9px] uppercase tracking-[0.3em] px-4 py-2 rounded-full border transition-all ${
              filter === f ? "text-primary border-primary/30 bg-primary/5" : "text-muted-foreground border-border hover:border-muted-foreground/30"
            }`}>
            {getTypeLabel(f)}
          </button>
        ))}
      </div>

      {/* Active widget overlay */}
      {activeWidget && (() => {
        const item = items.find(i => i.id === activeWidget);
        if (!item) return null;
        const widget = renderWidget(item);
        if (!widget) return null;
        return (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="ethereal-glass p-6">
            <div className="flex justify-between items-start mb-4">
              <span className="text-neural-label">{getTypeLabel(item.content_type)}</span>
              <button onClick={() => setActiveWidget(null)} className="text-muted-foreground hover:text-foreground text-xs">Fermer ✕</button>
            </div>
            {widget}
          </motion.div>
        );
      })()}

      {filtered.length === 0 ? (
        <div className="ethereal-glass p-12 text-center">
          <Headphones size={32} strokeWidth={1} className="mx-auto mb-4 text-muted-foreground/30" />
          <p className="text-muted-foreground text-sm">Aucun contenu assigné. Votre coach vous assignera des outils depuis le panneau admin.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item, i) => {
            const cfg = typeConfig[item.content_type] || typeConfig.course;
            const hasWidget = ["breathwork", "focus_introspectif"].includes(item.content_type);
            const isExternal = item.content_type === "external_link" && item.external_url;
            const completion = getCompletion(item.id);

            return (
              <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                className={`ethereal-glass p-6 flex flex-col ${completion ? "opacity-70" : ""}`}>
                <div className="flex items-start justify-between mb-4">
                  <cfg.icon size={18} strokeWidth={1.5} className={cfg.color} />
                  <div className="flex items-center gap-2">
                    {completion && (
                      <span className={`text-[8px] uppercase tracking-[0.2em] px-2 py-0.5 rounded-full border ${
                        completion.status === "completed" ? "text-primary border-primary/30 bg-primary/5" :
                        completion.status === "abandoned" ? "text-destructive border-destructive/30 bg-destructive/5" :
                        "text-muted-foreground border-border bg-secondary/20"
                      }`}>
                        {completion.status === "completed" ? "Terminé" : completion.status === "abandoned" ? "Abandonné" : "Ignoré"}
                      </span>
                    )}
                    <span className="text-neural-label">{item.duration || "—"}</span>
                  </div>
                </div>
                <p className="text-sm font-medium text-foreground mb-2">{item.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed flex-1">{item.description || cfg.label}</p>

                <div className="mt-4 flex items-center gap-3">
                  {hasWidget ? (
                    <button onClick={() => setActiveWidget(activeWidget === item.id ? null : item.id)}
                      className="flex items-center gap-2 text-[9px] uppercase tracking-[0.3em] text-primary hover:text-foreground transition-colors">
                      <Play size={12} /> {activeWidget === item.id ? "En cours" : "Lancer"}
                    </button>
                  ) : isExternal ? (
                    <a href={item.external_url!} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-[9px] uppercase tracking-[0.3em] text-primary hover:text-foreground transition-colors">
                      <ExternalLink size={12} /> Ouvrir
                    </a>
                  ) : (
                    <button onClick={() => setActiveWidget(item.id)}
                      className="flex items-center gap-2 text-[9px] uppercase tracking-[0.3em] text-primary hover:text-foreground transition-colors">
                      <Play size={12} /> Lancer
                    </button>
                  )}

                  {!completion && (
                    <button onClick={() => { setCompletionModal({ open: true, itemId: item.id }); setFeedback(""); }}
                      className="flex items-center gap-2 text-[9px] uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground transition-colors ml-auto">
                      <CheckCircle2 size={12} /> Statut
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Completion modal */}
      <Dialog open={completionModal.open} onOpenChange={(open) => setCompletionModal({ open, itemId: open ? completionModal.itemId : null })}>
        <DialogContent className="ethereal-glass border-border/30 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Marquer l'outil</DialogTitle>
            <DialogDescription>{modalItem?.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Feedback optionnel…"
              className="w-full bg-secondary/20 border border-border/20 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/30 transition-colors resize-none h-20"
            />
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => submitCompletion("completed")}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-primary/20 hover:border-primary/50 hover:bg-primary/5 transition-all">
                <CheckCircle2 size={20} className="text-primary" />
                <span className="text-[9px] uppercase tracking-[0.2em] text-primary">Terminé</span>
              </button>
              <button onClick={() => submitCompletion("abandoned")}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-destructive/20 hover:border-destructive/50 hover:bg-destructive/5 transition-all">
                <XCircle size={20} className="text-destructive" />
                <span className="text-[9px] uppercase tracking-[0.2em] text-destructive">Abandonné</span>
              </button>
              <button onClick={() => submitCompletion("ignored")}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border/30 hover:border-muted-foreground/50 hover:bg-secondary/20 transition-all">
                <EyeOff size={20} className="text-muted-foreground" />
                <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Ignoré</span>
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
