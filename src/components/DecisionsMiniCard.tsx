import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Decision {
  id: string;
  name: string;
  priority: number;
  status: string;
}

interface DecisionsMiniCardProps {
  userId: string;
  onAddNew: () => void;
}

const priorityTextColor = (priority: number) => {
  if (priority >= 4) return "text-amber-400";
  return "text-muted-foreground/50";
};

export default function DecisionsMiniCard({ userId, onAddNew }: DecisionsMiniCardProps) {
  const [decisions, setDecisions] = useState<Decision[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await supabase
          .from("decisions" as any)
          .select("id, name, priority, status")
          .eq("user_id", userId)
          .eq("status", "pending")
          .order("priority", { ascending: false })
          .limit(3);
        if (data) setDecisions(data as Decision[]);
      } catch {
        // silent fail — card stays empty
      }
    };
    load();
  }, [userId]);

  const pendingCount = decisions.filter((d) => d.status === "pending").length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.18 }}
      className="rounded-2xl bg-accent/[0.04] border border-accent/[0.12] p-3 space-y-2.5"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground/60">
          Décisions en cours
        </p>
        {pendingCount > 0 && (
          <span className="text-[8px] bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded-full leading-none">
            {pendingCount} ouvertes
          </span>
        )}
      </div>

      {/* List */}
      {decisions.length === 0 ? (
        <p className="text-[10px] text-muted-foreground/30 py-1">Aucune décision enregistrée</p>
      ) : (
        <div className="space-y-1.5">
          {decisions.map((d) => (
            <div key={d.id} className="flex items-center gap-2 min-w-0">
              <div className="w-1.5 h-1.5 rounded-full shrink-0 bg-primary/40" />
              <p
                className={`flex-1 text-[11px] truncate leading-tight transition-colors ${
                  d.status === "decided"
                    ? "line-through text-muted-foreground/25"
                    : "text-foreground/80"
                }`}
              >
                {d.name}
              </p>
              <span className={`text-[9px] shrink-0 font-medium tabular-nums ${priorityTextColor(d.priority)}`}>
                P{d.priority}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Add link */}
      <button
        onClick={onAddNew}
        className="flex items-center gap-1 text-[9px] tracking-widest uppercase text-accent/50 hover:text-accent transition-colors"
      >
        <Plus size={9} strokeWidth={2} />
        Nouvelle décision
      </button>
    </motion.div>
  );
}
