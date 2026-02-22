import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Play, Pause, Headphones, Eye, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ToolboxItem {
  id: string;
  title: string;
  content_type: string;
  duration: string | null;
  description: string | null;
}

const typeConfig: Record<string, { icon: typeof Headphones; color: string }> = {
  meditation: { icon: Headphones, color: "text-primary" },
  visualization: { icon: Eye, color: "text-neural-accent" },
  course: { icon: BookOpen, color: "text-neural-warm" },
};

export default function Toolbox() {
  const { user } = useAuth();
  const [items, setItems] = useState<ToolboxItem[]>([]);
  const [playing, setPlaying] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    if (user) loadItems();
  }, [user]);

  const loadItems = async () => {
    const { data } = await supabase
      .from("toolbox_assignments" as any)
      .select("*")
      .eq("user_id", user!.id)
      .order("assigned_at", { ascending: false });
    if (data) setItems(data as any);
  };

  const filtered = filter === "all" ? items : items.filter((i) => i.content_type === filter);
  const types = ["all", ...new Set(items.map((i) => i.content_type))];

  return (
    <div className="space-y-10 max-w-5xl">
      <div>
        <p className="text-neural-label mb-3">Neural Library</p>
        <h1 className="text-neural-title text-3xl text-foreground">Toolbox</h1>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {types.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-[9px] uppercase tracking-[0.3em] px-4 py-2 rounded-full border transition-all ${
              filter === f
                ? "text-primary border-primary/30 bg-primary/5"
                : "text-muted-foreground border-border hover:border-muted-foreground/30"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Player */}
      {playing && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="ethereal-glass p-6 flex items-center gap-6">
          <button onClick={() => setPlaying(null)} className="w-12 h-12 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center glow-node">
            <Pause size={18} className="text-primary" />
          </button>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">{items.find((i) => i.id === playing)?.title}</p>
            <div className="mt-2 h-1 rounded-full bg-secondary overflow-hidden">
              <motion.div className="h-full bg-primary/60 rounded-full" initial={{ width: "0%" }} animate={{ width: "35%" }} transition={{ duration: 2 }} />
            </div>
          </div>
          <span className="text-neural-label">2:14 / 12:00</span>
        </motion.div>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="ethereal-glass p-12 text-center">
          <Headphones size={32} strokeWidth={1} className="mx-auto mb-4 text-muted-foreground/30" />
          <p className="text-muted-foreground text-sm">No content assigned yet. Your coach will assign tools from the admin panel.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item, i) => {
            const config = typeConfig[item.content_type] || typeConfig.course;
            return (
              <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="ethereal-glass p-6 flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <config.icon size={18} strokeWidth={1.5} className={config.color} />
                  <span className="text-neural-label">{item.duration || "—"}</span>
                </div>
                <p className="text-sm font-medium text-foreground mb-2">{item.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed flex-1">{item.description || ""}</p>
                <button onClick={() => setPlaying(item.id)} className="mt-4 flex items-center gap-2 text-[9px] uppercase tracking-[0.3em] text-primary hover:text-foreground transition-colors">
                  <Play size={12} /> Play
                </button>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
