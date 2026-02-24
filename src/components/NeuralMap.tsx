import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Network } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Person {
  id: string;
  name: string;
  role: string | null;
  quality: number;
  insight: string | null;
}

type NeuralPeriod = "1d" | "7d" | "30d" | "90d" | "quarter" | "semester" | "year";

const periodDays: Record<NeuralPeriod, number> = {
  "1d": 1, "7d": 7, "30d": 30, "90d": 90, quarter: 90, semester: 180, year: 365,
};

const periodLabels: Record<NeuralPeriod, string> = {
  "1d": "Jour", "7d": "7 jours", "30d": "30 jours", "90d": "90 jours",
  quarter: "Trimestre", semester: "Semestre", year: "Année",
};

const qualityColor = (q: number) => {
  if (q >= 8) return "hsl(176 70% 48%)";
  if (q >= 6) return "hsl(35 80% 55%)";
  return "hsl(0 70% 50%)";
};

interface NeuralMapProps {
  people: Person[];
  compact?: boolean;
  onPersonClick?: (person: Person) => void;
  showFilters?: boolean;
}

export default function NeuralMap({ people, compact = false, onPersonClick, showFilters = true }: NeuralMapProps) {
  const { user } = useAuth();
  const [neuralPeriod, setNeuralPeriod] = useState<NeuralPeriod>("30d");
  const [neuralAverages, setNeuralAverages] = useState<Record<string, number>>({});
  const [draggedPositions, setDraggedPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [dragging, setDragging] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const viewW = compact ? 400 : 600;
  const viewH = compact ? 280 : 400;
  const cx0 = viewW / 2;
  const cy0 = viewH / 2;

  useEffect(() => {
    if (user && people.length > 0) loadNeuralAverages();
  }, [neuralPeriod, people, user]);

  const loadNeuralAverages = async () => {
    if (!user) return;
    const since = new Date();
    since.setDate(since.getDate() - periodDays[neuralPeriod]);
    const { data } = await supabase
      .from("relation_quality_history")
      .select("contact_id, quality")
      .eq("user_id", user.id)
      .gte("recorded_at", since.toISOString());

    if (data) {
      const grouped: Record<string, number[]> = {};
      (data as any[]).forEach((h: { contact_id: string; quality: number }) => {
        if (!grouped[h.contact_id]) grouped[h.contact_id] = [];
        grouped[h.contact_id].push(h.quality);
      });
      const avgs: Record<string, number> = {};
      for (const [id, vals] of Object.entries(grouped)) {
        avgs[id] = vals.reduce((a, b) => a + b, 0) / vals.length;
      }
      setNeuralAverages(avgs);
    }
  };

  const getNodePos = (person: Person, idx: number) => {
    if (draggedPositions[person.id]) return draggedPositions[person.id];
    const angle = (idx / people.length) * Math.PI * 2 - Math.PI / 2;
    const avgQ = neuralAverages[person.id] ?? person.quality;
    const maxR = compact ? 110 : 180;
    const radius = maxR - (avgQ / 10) * (maxR * 0.55);
    return { x: cx0 + Math.cos(angle) * radius, y: cy0 + Math.sin(angle) * radius };
  };

  const getNeuralThickness = (personId: string, currentQuality: number) => {
    const avg = neuralAverages[personId] ?? currentQuality;
    // Exponential scaling: 1→0.5, 5→5, 8→14, 10→20
    return Math.max(0.5, (avg / 10) ** 1.8 * 20);
  };

  const svgPointFromEvent = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    return {
      x: ((clientX - rect.left) / rect.width) * viewW,
      y: ((clientY - rect.top) / rect.height) * viewH,
    };
  }, [viewW, viewH]);

  const handlePointerDown = (personId: string, e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(personId);
  };

  const handlePointerMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!dragging) return;
    const pt = svgPointFromEvent(e);
    // Clamp within SVG bounds
    const x = Math.max(20, Math.min(viewW - 20, pt.x));
    const y = Math.max(20, Math.min(viewH - 20, pt.y));
    setDraggedPositions(prev => ({ ...prev, [dragging]: { x, y } }));
  }, [dragging, svgPointFromEvent, viewW, viewH]);

  const handlePointerUp = useCallback(() => {
    setDragging(null);
  }, []);

  if (people.length === 0) {
    return (
      <div className="ethereal-glass p-8 text-center">
        <Network size={24} strokeWidth={1} className="mx-auto mb-3 text-muted-foreground/30" />
        <p className="text-muted-foreground text-sm">Aucun contact dans votre réseau.</p>
      </div>
    );
  }

  return (
    <div>
      {showFilters && (
        <div className="flex gap-2 flex-wrap mb-4">
          {(Object.keys(periodLabels) as NeuralPeriod[]).map((p) => (
            <button key={p} onClick={() => setNeuralPeriod(p)}
              className={`text-[9px] uppercase tracking-[0.2em] px-3 py-1.5 rounded-lg border transition-all ${
                neuralPeriod === p ? "border-primary/40 bg-primary/5 text-primary" : "border-border/30 text-muted-foreground hover:border-primary/30"
              }`}>
              {periodLabels[p]}
            </button>
          ))}
        </div>
      )}
      <div className="ethereal-glass p-4 sm:p-8">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${viewW} ${viewH}`}
          className={`w-full h-auto ${compact ? "max-h-[300px]" : "max-h-[500px]"} select-none`}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
        >
          {/* Center node */}
          <circle cx={cx0} cy={cy0} r={compact ? 12 : 18} fill="hsl(176 70% 48% / 0.15)" stroke="hsl(176 70% 48% / 0.4)" strokeWidth="1">
            <animate attributeName="r" values={compact ? "10;14;10" : "16;20;16"} dur="4s" repeatCount="indefinite" />
          </circle>
          <circle cx={cx0} cy={cy0} r={compact ? 4 : 6} fill="hsl(176 70% 48%)" />
          <text x={cx0} y={cy0 + (compact ? 22 : 35)} textAnchor="middle" fill="hsl(220 10% 45%)" fontSize={compact ? 7 : 9} fontFamily="Cinzel" letterSpacing="0.3em">VOUS</text>

          {people.map((person, idx) => {
            const pos = getNodePos(person, idx);
            const avgQ = neuralAverages[person.id] ?? person.quality;
            const color = qualityColor(avgQ);
            const strokeW = getNeuralThickness(person.id, person.quality);
            const nodeR = compact ? 6 + avgQ * 0.5 : 8 + avgQ * 0.8;
            const isDragging = dragging === person.id;

            return (
              <g key={person.id} style={{ cursor: isDragging ? "grabbing" : "grab" }}
                onMouseDown={(e) => handlePointerDown(person.id, e)}
                onTouchStart={(e) => handlePointerDown(person.id, e)}
                onClick={(e) => { if (!isDragging && onPersonClick) { e.stopPropagation(); onPersonClick(person); } }}
              >
                <line x1={cx0} y1={cy0} x2={pos.x} y2={pos.y} stroke={color} strokeWidth={strokeW} opacity="0.5" strokeLinecap="round" />
                <circle cx={pos.x} cy={pos.y} r={nodeR} fill={`${color}15`} stroke={`${color}50`} strokeWidth="0.8">
                  <animate attributeName="opacity" values="0.6;1;0.6" dur={`${3 + idx * 0.5}s`} repeatCount="indefinite" />
                </circle>
                <circle cx={pos.x} cy={pos.y} r="3" fill={color} />
                <text x={pos.x} y={pos.y + nodeR + 10} textAnchor="middle" fill="hsl(210 20% 88%)" fontSize={compact ? 7 : 8} fontFamily="Space Grotesk" fontWeight="500">
                  {person.name.split(" ")[0]}
                </text>
                {!compact && (
                  <text x={pos.x} y={pos.y + nodeR + 21} textAnchor="middle" fill="hsl(220 10% 45%)" fontSize="7" fontFamily="Space Grotesk">
                    {typeof avgQ === "number" ? avgQ.toFixed(1) : avgQ}/10
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
