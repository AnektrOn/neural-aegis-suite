import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Play, Headphones, Eye, BookOpen, Wind, Sparkles, Heart, Brain, Link as LinkIcon, ExternalLink, CheckCircle2, XCircle, EyeOff, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import BreathworkWidget from "@/components/widgets/BreathworkWidget";
import FocusIntrospectifWidget from "@/components/widgets/FocusIntrospectifWidget";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

interface ToolboxItem {
  id: string;
  title: string;
  content_type: string;
  duration: string | null;
  description: string | null;
  external_url: string | null;
  widget_config: any;
  assigned_at: string;
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
  const [completionDialog, setCompletionDialog] = useState<{ open: boolean; itemId: string | null; status: string }>({ open: false, itemId: null, status: "" });

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    const [itemsRes, compRes] = await Promise.all([
      supabase.from("toolbox_assignments").select("*").eq("user_id", user!.id).order("assigned_at", { ascending: false }),
      supabase.from("toolbox_completions" as any).select("assignment_id, status").eq("user_id", user!.id),
    ]);
    if (itemsRes.data) setItems(itemsRes.data as any);
    const comps = (compRes.data || []) as unknown as CompletionRecord[];
    setCompletions(comps);

    // Auto-detect ignored items (assigned >24h ago, never opened, no completion)
    if (itemsRes.data && user) {
      const now = Date.now();
      const completedIds = new Set(comps.map(c => c.assignment_id));
      const ignoredCandidates = (itemsRes.data as ToolboxItem[]).filter(item => {
        if (completedIds.has(item.id)) return false;
        const assignedAge = now - new Date(item.assigned_at).getTime();
        return assignedAge > 24 * 60 * 60 * 1000;
      });
      for (const item of ignoredCandidates) {
        await supabase.from("toolbox_completions" as any).insert({
          assignment_id: item.id,
          user_id: user.id,
          status: "ignored",
        } as any);
      }
      if (ignoredCandidates.length > 0) {
        const { data: freshComps } = await supabase.from("toolbox_completions" as any).select("assignment_id, status").eq("user_id", user!.id);
        if (freshComps) setCompletions(freshComps as unknown as CompletionRecord[]);
      }
    }
  };

  // Get the latest completion for an item
  const getLatestCompletion = (assignmentId: string) => {
    const matches = completions.filter(c => c.assignment_id === assignmentId);
    return matches.length > 0 ? matches[matches.length - 1] : undefined;
  };

  // Count all completions (not just unique)
  const allCompletionStats = {
    completed: completions.filter(c => c.status === "completed").length,
    abandoned: completions.filter(c => c.status === "abandoned").length,
    ignored: completions.filter(c => c.status === "ignored").length,
    total: items.length,
  };

  const recordCompletion = useCallback(async (assignmentId: string, status: "completed" | "abandoned") => {
    if (!user) return;

    const { error } = await supabase.from("toolbox_completions" as any).insert({
      assignment_id: assignmentId,
      user_id: user.id,
      status,
    } as any);

    if (!error) {
      const labels: Record<string, string> = { completed: "Exercice terminé ✦", abandoned: "Exercice abandonné" };
      setCompletionDialog({ open: true, itemId: assignmentId, status });
      toast({ title: labels[status] });
      loadData();
    }
  }, [user]);

  // Reload an abandoned tool = clear the "reloaded" flag so user can retry
  // We DON'T delete the old completion — we just allow a new attempt
  const handleReload = (itemId: string) => {
    // Mark this item as "retrying" by setting it as active widget
    setActiveWidget(itemId);
    toast({ title: "Outil rechargé", description: "Vous pouvez réessayer cet exercice." });
  };

  const handleCloseWidget = useCallback((itemId: string) => {
    setActiveWidget(null);
  }, []);

  const filtered = filter === "all" ? items : items.filter((i) => i.content_type === filter);
  const types = ["all", ...new Set(items.map((i) => i.content_type))];

  const getTypeLabel = (t: string) => {
    if (t === "all") return "Tout";
    return typeConfig[t]?.label || t;
  };

  const renderWidget = (item: ToolboxItem) => {
    const config = item.widget_config;
    if (!config) return null;
    switch (item.content_type) {
      case "breathwork":
        return (
          <BreathworkWidget
            config={config}
            title={item.title}
            onComplete={() => recordCompletion(item.id, "completed")}
            onAbandon={() => recordCompletion(item.id, "abandoned")}
          />
        );
      case "focus_introspectif":
        return (
          <FocusIntrospectifWidget
            config={config}
            title={item.title}
            onComplete={() => recordCompletion(item.id, "completed")}
            onAbandon={() => recordCompletion(item.id, "abandoned")}
          />
        );
      default:
        return null;
    }
  };

  const dialogItem = items.find(i => i.id === completionDialog.itemId);

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
            { label: "Total", value: allCompletionStats.total, icon: Headphones, color: "text-muted-foreground" },
            { label: "Terminés", value: allCompletionStats.completed, icon: CheckCircle2, color: "text-primary" },
            { label: "Abandonnés", value: allCompletionStats.abandoned, icon: XCircle, color: "text-destructive" },
            { label: "Ignorés", value: allCompletionStats.ignored, icon: EyeOff, color: "text-muted-foreground" },
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
              <button onClick={() => handleCloseWidget(item.id)} className="text-muted-foreground hover:text-foreground text-xs">Fermer ✕</button>
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
            const latestCompletion = getLatestCompletion(item.id);
            const isAbandoned = latestCompletion?.status === "abandoned";
            const isIgnored = latestCompletion?.status === "ignored";
            const isCompleted = latestCompletion?.status === "completed";
            const isActive = activeWidget === item.id;

            return (
              <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                className={`ethereal-glass p-6 flex flex-col ${latestCompletion && !isActive ? "opacity-60" : ""}`}>
                <div className="flex items-start justify-between mb-4">
                  <cfg.icon size={18} strokeWidth={1.5} className={cfg.color} />
                  <div className="flex items-center gap-2">
                    {latestCompletion && (
                      <span className={`text-[8px] uppercase tracking-[0.2em] px-2 py-0.5 rounded-full border ${
                        isCompleted ? "text-primary border-primary/30 bg-primary/5" :
                        isAbandoned ? "text-destructive border-destructive/30 bg-destructive/5" :
                        "text-muted-foreground border-border bg-secondary/20"
                      }`}>
                        {isCompleted ? "Terminé" : isAbandoned ? "Abandonné" : "Ignoré"}
                      </span>
                    )}
                    <span className="text-neural-label">{item.duration || "—"}</span>
                  </div>
                </div>
                <p className="text-sm font-medium text-foreground mb-2">{item.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed flex-1">{item.description || cfg.label}</p>

                <div className="mt-4 flex items-center gap-3">
                  {/* Not yet attempted or currently active */}
                  {(!latestCompletion || isActive) && !isIgnored ? (
                    hasWidget ? (
                      <button onClick={() => setActiveWidget(isActive ? null : item.id)}
                        className="flex items-center gap-2 text-[9px] uppercase tracking-[0.3em] text-primary hover:text-foreground transition-colors">
                        <Play size={12} /> {isActive ? "En cours" : "Lancer"}
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
                    )
                  ) : null}

                  {/* Reload button for abandoned items only (not ignored) */}
                  {isAbandoned && !isActive && (
                    <button onClick={() => handleReload(item.id)}
                      className="flex items-center gap-2 text-[9px] uppercase tracking-[0.3em] text-neural-accent hover:text-foreground transition-colors">
                      <RotateCcw size={12} /> Recharger
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Completion confirmation dialog */}
      <Dialog open={completionDialog.open} onOpenChange={(open) => { if (!open) setCompletionDialog({ open: false, itemId: null, status: "" }); }}>
        <DialogContent className="ethereal-glass border-border/30 sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-foreground text-center">
              {completionDialog.status === "completed" ? (
                <span className="flex items-center justify-center gap-2">
                  <CheckCircle2 size={20} className="text-primary" /> Exercice terminé
                </span>
              ) : completionDialog.status === "abandoned" ? (
                <span className="flex items-center justify-center gap-2">
                  <XCircle size={20} className="text-destructive" /> Exercice abandonné
                </span>
              ) : (
                "Statut mis à jour"
              )}
            </DialogTitle>
            <DialogDescription className="text-center">
              {dialogItem?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="text-center py-4 space-y-3">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-lg font-cinzel text-primary">{allCompletionStats.completed}</p>
                <p className="text-neural-label">Terminés</p>
              </div>
              <div>
                <p className="text-lg font-cinzel text-destructive">{allCompletionStats.abandoned}</p>
                <p className="text-neural-label">Abandonnés</p>
              </div>
              <div>
                <p className="text-lg font-cinzel text-muted-foreground">{allCompletionStats.ignored}</p>
                <p className="text-neural-label">Ignorés</p>
              </div>
            </div>
            <button
              onClick={() => setCompletionDialog({ open: false, itemId: null, status: "" })}
              className="mt-4 text-[9px] uppercase tracking-[0.3em] text-primary hover:text-foreground transition-colors"
            >
              Fermer
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
