import { useState } from "react";
import { motion } from "framer-motion";
import { Users, Network, LayoutGrid } from "lucide-react";

interface Person {
  id: string;
  name: string;
  role: string;
  quality: number;
  insight: string;
}

const mockPeople: Person[] = [
  { id: "1", name: "Sarah Chen", role: "COO", quality: 9, insight: "Strong alignment on Q3 vision." },
  { id: "2", name: "Marcus Webb", role: "VP Engineering", quality: 7, insight: "Needs more strategic support." },
  { id: "3", name: "Elena Rossi", role: "Head of Product", quality: 8, insight: "Excellent initiative, give more autonomy." },
  { id: "4", name: "James Park", role: "CFO", quality: 6, insight: "Tension around budget priorities." },
  { id: "5", name: "Aisha Osei", role: "Head of People", quality: 9, insight: "Key ally for culture transformation." },
  { id: "6", name: "David Lin", role: "Board Advisor", quality: 8, insight: "Valuable external perspective." },
];

const qualityColor = (q: number) => {
  if (q >= 8) return "hsl(180 70% 50%)";
  if (q >= 6) return "hsl(35 80% 55%)";
  return "hsl(0 70% 50%)";
};

export default function PeopleBoard() {
  const [view, setView] = useState<"neural" | "card">("neural");

  return (
    <div className="space-y-10 max-w-6xl">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-neural-label mb-3">Relational Intelligence</p>
          <h1 className="text-neural-title text-3xl text-foreground">People Board</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setView("neural")}
            className={`p-2.5 rounded-xl border transition-all ${
              view === "neural" ? "border-primary/30 bg-primary/5 text-primary" : "border-border text-muted-foreground"
            }`}
          >
            <Network size={16} strokeWidth={1.5} />
          </button>
          <button
            onClick={() => setView("card")}
            className={`p-2.5 rounded-xl border transition-all ${
              view === "card" ? "border-primary/30 bg-primary/5 text-primary" : "border-border text-muted-foreground"
            }`}
          >
            <LayoutGrid size={16} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {view === "neural" ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="ethereal-glass p-8"
        >
          <svg viewBox="0 0 600 400" className="w-full h-auto max-h-[500px]">
            {/* Central leader node */}
            <circle cx="300" cy="200" r="18" fill="hsl(180 70% 50% / 0.15)" stroke="hsl(180 70% 50% / 0.4)" strokeWidth="1">
              <animate attributeName="r" values="16;20;16" dur="4s" repeatCount="indefinite" />
            </circle>
            <circle cx="300" cy="200" r="6" fill="hsl(180 70% 50%)" />
            <text x="300" y="235" textAnchor="middle" fill="hsl(220 10% 45%)" fontSize="9" fontFamily="Cinzel" letterSpacing="0.3em">YOU</text>

            {/* People nodes */}
            {mockPeople.map((person, idx) => {
              const angle = (idx / mockPeople.length) * Math.PI * 2 - Math.PI / 2;
              const radius = 140;
              const cx = 300 + Math.cos(angle) * radius;
              const cy = 200 + Math.sin(angle) * radius;
              const color = qualityColor(person.quality);

              return (
                <g key={person.id}>
                  <line
                    x1="300" y1="200"
                    x2={cx} y2={cy}
                    stroke={color}
                    strokeWidth="0.8"
                    opacity="0.3"
                  />
                  <circle cx={cx} cy={cy} r="10" fill={`${color}20`} stroke={`${color}50`} strokeWidth="0.8">
                    <animate attributeName="opacity" values="0.6;1;0.6" dur={`${3 + idx * 0.5}s`} repeatCount="indefinite" />
                  </circle>
                  <circle cx={cx} cy={cy} r="3" fill={color} />
                  <text x={cx} y={cy + 22} textAnchor="middle" fill="hsl(210 20% 88%)" fontSize="8" fontFamily="Space Grotesk" fontWeight="500">{person.name.split(" ")[0]}</text>
                  <text x={cx} y={cy + 33} textAnchor="middle" fill="hsl(220 10% 45%)" fontSize="7" fontFamily="Space Grotesk">{person.quality}/10</text>
                </g>
              );
            })}
          </svg>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockPeople.map((person, i) => (
            <motion.div
              key={person.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="ethereal-glass p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-cinzel"
                  style={{
                    backgroundColor: `${qualityColor(person.quality)}15`,
                    border: `1px solid ${qualityColor(person.quality)}30`,
                    color: qualityColor(person.quality),
                  }}
                >
                  {person.name[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{person.name}</p>
                  <p className="text-neural-label">{person.role}</p>
                </div>
              </div>

              {/* Quality bar */}
              <div className="mb-3">
                <div className="flex justify-between mb-1">
                  <span className="text-neural-label">Relationship</span>
                  <span className="text-xs font-cinzel" style={{ color: qualityColor(person.quality) }}>
                    {person.quality}/10
                  </span>
                </div>
                <div className="h-1 rounded-full bg-secondary overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${person.quality * 10}%` }}
                    transition={{ delay: 0.3 + i * 0.08, duration: 0.6 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: qualityColor(person.quality) }}
                  />
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">{person.insight}</p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
