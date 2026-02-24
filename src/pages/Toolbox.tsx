import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, Pause, Headphones, Eye, BookOpen, Wind, Sparkles, Heart, Brain, Link as LinkIcon, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import BreathworkWidget from "@/components/widgets/BreathworkWidget";
import FocusIntrospectifWidget from "@/components/widgets/FocusIntrospectifWidget";

interface ToolboxItem {
  id: string;
  title: string;
  content_type: string;
  duration: string | null;
  description: string | null;
  external_url: string | null;
  widget_config: any;
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
  const [items, setItems] = useState<ToolboxItem[]>([]);
  const [activeWidget, setActiveWidget] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    if (user) loadItems();
  }, [user]);

  const loadItems = async () => {
    const { data } = await supabase.from("toolbox_assignments" as any).select("*").eq("user_id", user!.id).order("assigned_at", { ascending: false });
    if (data) setItems(data as any);
  };

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
        return <BreathworkWidget config={config} title={item.title} />;
      case "focus_introspectif":
        return <FocusIntrospectifWidget config={config} title={item.title} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-10 max-w-5xl">
      <div>
        <p className="text-neural-label mb-3">Bibliothèque Neurale</p>
        <h1 className="text-neural-title text-3xl text-foreground">Boîte à Outils</h1>
      </div>

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

            return (
              <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="ethereal-glass p-6 flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <cfg.icon size={18} strokeWidth={1.5} className={cfg.color} />
                  <span className="text-neural-label">{item.duration || "—"}</span>
                </div>
                <p className="text-sm font-medium text-foreground mb-2">{item.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed flex-1">{item.description || cfg.label}</p>

                {hasWidget ? (
                  <button onClick={() => setActiveWidget(activeWidget === item.id ? null : item.id)}
                    className="mt-4 flex items-center gap-2 text-[9px] uppercase tracking-[0.3em] text-primary hover:text-foreground transition-colors">
                    <Play size={12} /> {activeWidget === item.id ? "En cours" : "Lancer"}
                  </button>
                ) : isExternal ? (
                  <a href={item.external_url!} target="_blank" rel="noopener noreferrer"
                    className="mt-4 flex items-center gap-2 text-[9px] uppercase tracking-[0.3em] text-primary hover:text-foreground transition-colors">
                    <ExternalLink size={12} /> Ouvrir
                  </a>
                ) : (
                  <button onClick={() => setActiveWidget(item.id)}
                    className="mt-4 flex items-center gap-2 text-[9px] uppercase tracking-[0.3em] text-primary hover:text-foreground transition-colors">
                    <Play size={12} /> Lancer
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
