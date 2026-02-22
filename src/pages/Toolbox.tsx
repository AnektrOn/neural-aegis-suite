import { useState } from "react";
import { motion } from "framer-motion";
import { Play, Pause, Headphones, Eye, BookOpen } from "lucide-react";

interface ToolboxItem {
  id: string;
  title: string;
  type: "meditation" | "visualization" | "course";
  duration: string;
  description: string;
}

const mockItems: ToolboxItem[] = [
  { id: "1", title: "Executive Presence", type: "meditation", duration: "12 min", description: "Cultivate deep authority and calm leadership energy." },
  { id: "2", title: "Decision Clarity Protocol", type: "visualization", duration: "8 min", description: "Visualize outcomes with neural precision." },
  { id: "3", title: "The Sovereign Leader", type: "course", duration: "45 min", description: "Module 3: Emotional sovereignty under pressure." },
  { id: "4", title: "Morning Neural Prime", type: "meditation", duration: "15 min", description: "Activate peak cognitive and emotional states." },
  { id: "5", title: "Team Resonance Field", type: "visualization", duration: "10 min", description: "Align your energy with your team's frequency." },
  { id: "6", title: "High-Stakes Communication", type: "course", duration: "30 min", description: "Module 5: Influence under uncertainty." },
];

const typeConfig = {
  meditation: { icon: Headphones, color: "text-primary" },
  visualization: { icon: Eye, color: "text-neural-accent" },
  course: { icon: BookOpen, color: "text-neural-warm" },
};

export default function Toolbox() {
  const [playing, setPlaying] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const filtered = filter === "all" ? mockItems : mockItems.filter((i) => i.type === filter);

  return (
    <div className="space-y-10 max-w-5xl">
      <div>
        <p className="text-neural-label mb-3">Neural Library</p>
        <h1 className="text-neural-title text-3xl text-foreground">Toolbox</h1>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {["all", "meditation", "visualization", "course"].map((f) => (
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

      {/* Player (if playing) */}
      {playing && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="ethereal-glass p-6 flex items-center gap-6"
        >
          <button
            onClick={() => setPlaying(null)}
            className="w-12 h-12 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center glow-node"
          >
            <Pause size={18} className="text-primary" />
          </button>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              {mockItems.find((i) => i.id === playing)?.title}
            </p>
            <div className="mt-2 h-1 rounded-full bg-secondary overflow-hidden">
              <motion.div
                className="h-full bg-primary/60 rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: "35%" }}
                transition={{ duration: 2 }}
              />
            </div>
          </div>
          <span className="text-neural-label">2:14 / 12:00</span>
        </motion.div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item, i) => {
          const config = typeConfig[item.type];
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="ethereal-glass p-6 flex flex-col"
            >
              <div className="flex items-start justify-between mb-4">
                <config.icon size={18} strokeWidth={1.5} className={config.color} />
                <span className="text-neural-label">{item.duration}</span>
              </div>
              <p className="text-sm font-medium text-foreground mb-2">{item.title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed flex-1">{item.description}</p>
              <button
                onClick={() => setPlaying(item.id)}
                className="mt-4 flex items-center gap-2 text-[9px] uppercase tracking-[0.3em] text-primary hover:text-foreground transition-colors"
              >
                <Play size={12} /> Play
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
