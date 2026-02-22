import { useState } from "react";
import { motion } from "framer-motion";
import { Target, Clock, ArrowUpRight, Plus } from "lucide-react";

interface Decision {
  id: string;
  name: string;
  priority: number;
  timeToDecide: string;
  responsibility: number;
  date: string;
  status: "pending" | "decided" | "deferred";
}

const mockDecisions: Decision[] = [
  { id: "1", name: "Q3 Hiring Strategy", priority: 5, timeToDecide: "2.4h", responsibility: 9, date: "2026-02-20", status: "decided" },
  { id: "2", name: "Product Launch Timeline", priority: 4, timeToDecide: "—", responsibility: 8, date: "2026-02-21", status: "pending" },
  { id: "3", name: "Budget Reallocation", priority: 3, timeToDecide: "1.1h", responsibility: 7, date: "2026-02-19", status: "decided" },
  { id: "4", name: "Partnership Negotiation", priority: 5, timeToDecide: "4.2h", responsibility: 10, date: "2026-02-18", status: "decided" },
  { id: "5", name: "Team Restructuring", priority: 4, timeToDecide: "—", responsibility: 8, date: "2026-02-22", status: "deferred" },
];

const priorityColor = (p: number) => {
  if (p >= 5) return "text-primary";
  if (p >= 3) return "text-neural-warm";
  return "text-muted-foreground";
};

export default function DecisionLog() {
  const [decisions] = useState<Decision[]>(mockDecisions);

  return (
    <div className="space-y-10 max-w-5xl">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-neural-label mb-3">Cognitive Architecture</p>
          <h1 className="text-neural-title text-3xl text-foreground">Decision Log</h1>
        </div>
        <button className="btn-neural">
          <Plus size={14} /> New Decision
        </button>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Avg Decision Speed", value: "2.6h", icon: Clock },
          { label: "Open Decisions", value: "2", icon: Target },
          { label: "Decisions This Week", value: "5", icon: ArrowUpRight },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="ethereal-glass p-6"
          >
            <stat.icon size={16} strokeWidth={1.5} className="text-primary mb-3" />
            <p className="text-2xl font-cinzel font-light text-foreground">{stat.value}</p>
            <p className="text-neural-label mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Decision list */}
      <div className="space-y-3">
        {decisions.map((d, i) => (
          <motion.div
            key={d.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.06 }}
            className="ethereal-glass p-6 flex items-center gap-6 cursor-pointer"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{d.name}</p>
              <p className="text-neural-label mt-1">{d.date}</p>
            </div>
            <div className="text-center">
              <p className={`text-sm font-cinzel ${priorityColor(d.priority)}`}>P{d.priority}</p>
              <p className="text-neural-label">Priority</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-cinzel text-foreground">{d.timeToDecide}</p>
              <p className="text-neural-label">Speed</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-cinzel text-foreground">{d.responsibility}/10</p>
              <p className="text-neural-label">Weight</p>
            </div>
            <div>
              <span className={`text-[9px] uppercase tracking-[0.3em] px-3 py-1.5 rounded-full border ${
                d.status === "decided"
                  ? "text-primary border-primary/20 bg-primary/5"
                  : d.status === "pending"
                  ? "text-neural-warm border-neural-warm/20 bg-neural-warm/5"
                  : "text-muted-foreground border-border bg-muted/20"
              }`}>
                {d.status}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
