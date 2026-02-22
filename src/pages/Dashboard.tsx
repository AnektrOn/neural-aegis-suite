import { motion } from "framer-motion";
import { Zap, Brain, Target, TrendingUp, Activity } from "lucide-react";

const stats = [
  { label: "Leadership Score", value: "87", icon: Zap, change: "+4.2%" },
  { label: "Decision Velocity", value: "3.2h", icon: Target, change: "-18%" },
  { label: "Emotional Freq.", value: "7.4", icon: Brain, change: "+0.6" },
  { label: "Habit Streak", value: "12d", icon: TrendingUp, change: "+2d" },
];

const dailyActions = [
  "Review top 3 priorities for the day",
  "15-min strategic thinking block",
  "One high-stakes decision before noon",
  "Check in with a direct report",
  "Evening reflection & journaling",
];

export default function Dashboard() {
  return (
    <div className="space-y-10 max-w-6xl">
      {/* Header */}
      <div>
        <p className="text-neural-label mb-3">Welcome Back</p>
        <h1 className="text-neural-title text-3xl md:text-4xl text-foreground">
          Your Neural State
        </h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            className="ethereal-glass p-6 group cursor-default"
          >
            <div className="flex items-start justify-between mb-4">
              <stat.icon size={20} strokeWidth={1.5} className="text-primary animate-glow-pulse" />
              <span className="text-[10px] font-medium tracking-wider text-primary/70">{stat.change}</span>
            </div>
            <p className="text-2xl font-light text-foreground font-cinzel">{stat.value}</p>
            <p className="text-neural-label mt-2">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Neural Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="lg:col-span-3 ethereal-glass p-8"
        >
          <p className="text-neural-label mb-4">Neural Progress</p>
          <div className="relative h-48 flex items-center justify-center">
            {/* Neural Map SVG */}
            <svg viewBox="0 0 400 200" className="w-full h-full">
              {/* Filaments */}
              <line x1="200" y1="100" x2="80" y2="40" stroke="hsl(180 70% 50% / 0.3)" strokeWidth="1" />
              <line x1="200" y1="100" x2="320" y2="50" stroke="hsl(180 70% 50% / 0.2)" strokeWidth="1" />
              <line x1="200" y1="100" x2="100" y2="160" stroke="hsl(270 50% 55% / 0.2)" strokeWidth="1" />
              <line x1="200" y1="100" x2="340" y2="150" stroke="hsl(180 70% 50% / 0.15)" strokeWidth="1" />
              <line x1="200" y1="100" x2="160" y2="30" stroke="hsl(270 50% 55% / 0.15)" strokeWidth="1" />
              {/* Central node */}
              <circle cx="200" cy="100" r="12" fill="hsl(180 70% 50% / 0.2)" stroke="hsl(180 70% 50% / 0.5)" strokeWidth="1">
                <animate attributeName="r" values="10;14;10" dur="3s" repeatCount="indefinite" />
              </circle>
              <circle cx="200" cy="100" r="4" fill="hsl(180 70% 50%)" />
              {/* Satellite nodes */}
              {[
                { cx: 80, cy: 40, label: "Focus" },
                { cx: 320, cy: 50, label: "Clarity" },
                { cx: 100, cy: 160, label: "Empathy" },
                { cx: 340, cy: 150, label: "Drive" },
                { cx: 160, cy: 30, label: "Vision" },
              ].map((node, idx) => (
                <g key={idx}>
                  <circle cx={node.cx} cy={node.cy} r="6" fill="hsl(180 70% 50% / 0.15)" stroke="hsl(180 70% 50% / 0.3)" strokeWidth="0.5">
                    <animate attributeName="opacity" values="0.5;1;0.5" dur={`${3 + idx}s`} repeatCount="indefinite" />
                  </circle>
                  <circle cx={node.cx} cy={node.cy} r="2" fill="hsl(180 70% 50% / 0.6)" />
                  <text x={node.cx} y={node.cy + 18} textAnchor="middle" fill="hsl(220 10% 45%)" fontSize="8" fontFamily="Space Grotesk" letterSpacing="0.15em">{node.label.toUpperCase()}</text>
                </g>
              ))}
            </svg>
          </div>
        </motion.div>

        {/* Daily Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="lg:col-span-2 ethereal-glass p-8"
        >
          <div className="flex items-center gap-2 mb-6">
            <Activity size={14} strokeWidth={1.5} className="text-primary" />
            <p className="text-neural-label">Daily Actions</p>
          </div>
          <div className="space-y-3">
            {dailyActions.map((action, i) => (
              <label key={i} className="flex items-start gap-3 cursor-pointer group">
                <div className="mt-0.5 w-5 h-5 rounded-lg border border-primary/20 flex items-center justify-center shrink-0 transition-colors group-hover:border-primary/40">
                  <div className="w-2 h-2 rounded-sm bg-primary/0 group-hover:bg-primary/20 transition-colors" />
                </div>
                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors leading-relaxed">
                  {action}
                </span>
              </label>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
