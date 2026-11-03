import { scoreTrendToPolyline, sparklineAverage, sparklineY } from "./bioSparkline";
import type { BioExecutiveHabitRow } from "./types";

type CoherenceVizProps = {
  level: number;
  sparkline: number[];
  calmMode: boolean;
};

export function CoherenceViz({ level, sparkline, calmMode }: CoherenceVizProps) {
  const activeRings = Math.min(8, Math.max(2, level * 2));
  const avg = sparklineAverage(sparkline);
  const last = sparkline.length > 0 ? sparkline[sparkline.length - 1] : null;
  const sparkH = 40;
  const sparkW = 100;
  const avgY = avg != null ? sparklineY(avg, sparkline, sparkH, 4) : null;
  const lastY = last != null ? sparklineY(last, sparkline, sparkH, 4) : null;
  const lastX = sparkline.length > 1 ? sparkW : sparkW / 2;

  return (
    <svg viewBox="0 0 120 120" className="w-full max-h-[140px] overflow-visible opacity-95" aria-hidden>
      {Array.from({ length: 8 }).map((_, i) => (
        <ellipse
          key={i}
          cx="60"
          cy="60"
          rx={15 + i * 6}
          ry={5 + i * 2.5}
          fill="none"
          stroke="currentColor"
          strokeWidth="0.9"
          strokeOpacity={i < activeRings ? 0.55 : 0.12}
          className={!calmMode && i < activeRings ? "bio-exec-viz-ellipse-pulse" : undefined}
          style={!calmMode && i < activeRings ? { animationDelay: `${i * 120}ms` } : undefined}
        />
      ))}
      <circle cx="60" cy="60" r="4" fill="var(--bio-warm)" className={!calmMode ? "bio-exec-viz-glow" : undefined} />
      {sparkline.length >= 2 ? (
        <g transform="translate(10, 78)">
          {avgY != null ? (
            <line
              x1="0"
              y1={avgY}
              x2={sparkW}
              y2={avgY}
              stroke="currentColor"
              strokeOpacity={0.4}
              strokeDasharray="3 3"
              strokeWidth="1"
            />
          ) : null}
          <polyline
            points={scoreTrendToPolyline(sparkline, sparkW, sparkH, 4)}
            fill="none"
            stroke="currentColor"
            strokeOpacity={0.55}
            strokeWidth="1.4"
          />
          {lastY != null ? (
            <circle cx={lastX} cy={lastY} r="3" fill="var(--bio-warm)" />
          ) : null}
        </g>
      ) : null}
    </svg>
  );
}

type ScoreVizProps = {
  sparkline: number[];
  calmMode: boolean;
};

export function ScoreViz({ sparkline, calmMode }: ScoreVizProps) {
  const width = 200;
  const height = 70;
  const points =
    sparkline.length >= 2 ? scoreTrendToPolyline(sparkline, width, height, 8) : "";
  const last = sparkline.length > 0 ? sparkline[sparkline.length - 1] : null;
  const avg = sparklineAverage(sparkline);
  const lastX = sparkline.length > 1 ? width : width / 2;
  const lastY = last != null ? sparklineY(last, sparkline, height, 8) : height / 2;
  const avgY = avg != null ? sparklineY(avg, sparkline, height, 8) : null;

  const wavePath = Array.from({ length: 24 })
    .map((_, i) => {
      const x = i * (width / 23);
      const y = 36 + Math.sin(i * 0.45) * 14;
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible opacity-95" aria-hidden>
      <path d={wavePath} fill="none" stroke="currentColor" strokeOpacity={0.22} strokeWidth="1" />
      {avgY != null ? (
        <line
          x1="0"
          y1={avgY}
          x2={width}
          y2={avgY}
          stroke="currentColor"
          strokeOpacity={0.4}
          strokeDasharray="4 4"
          strokeWidth="1"
        />
      ) : null}
      {points ? (
        <>
          <polyline points={points} fill="none" stroke="currentColor" strokeOpacity={0.35} strokeWidth="1" />
          <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" />
        </>
      ) : null}
      {last != null ? (
        <circle
          cx={lastX}
          cy={lastY}
          r="4"
          fill="var(--bio-warm)"
          className={!calmMode ? "bio-exec-viz-glow" : undefined}
        />
      ) : null}
    </svg>
  );
}

type StressWaveVizProps = {
  stress: number;
  avgStress: number;
  calmMode: boolean;
};

export function StressWaveViz({ stress, avgStress, calmMode }: StressWaveVizProps) {
  const amplitude = Math.max(2, stress * 2.8);
  const frequency = 0.28 + (stress / 10) * 0.38;
  const wavePath = Array.from({ length: 41 })
    .map((_, i) => {
      const x = i * 5;
      const y = 40 + Math.sin(i * frequency) * amplitude;
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
  const avgY = 40 + ((avgStress - 5) / 10) * 18;

  return (
    <svg viewBox="0 0 200 80" className="w-full h-full overflow-visible opacity-95" aria-hidden>
      <rect x="0" y="18" width="200" height="44" fill="currentColor" fillOpacity={0.06} rx="4" />
      <line
        x1="0"
        y1={avgY}
        x2="200"
        y2={avgY}
        stroke="currentColor"
        strokeOpacity={0.35}
        strokeDasharray="4 4"
        strokeWidth="1"
      />
      <path
        d={wavePath}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className={!calmMode ? "bio-exec-viz-wave" : undefined}
      />
    </svg>
  );
}

type SessionsVizProps = {
  count: number;
  regularityPct: number;
};

export function SessionsViz({ count, regularityPct }: SessionsVizProps) {
  const maxArcs = 8;
  const filledArcs = Math.min(maxArcs, Math.max(1, Math.ceil(count / 2)));

  return (
    <svg viewBox="0 0 160 100" className="w-full h-full overflow-visible opacity-95" aria-hidden>
      {Array.from({ length: maxArcs }).map((_, i) => {
        const y = 90 - i * 10;
        const halfWidth = 12 + i * 10;
        const isFilled = i < filledArcs;
        return (
          <path
            key={i}
            d={`M ${80 - halfWidth} ${y} Q 80 ${y - 10}, ${80 + halfWidth} ${y}`}
            fill="none"
            stroke="currentColor"
            strokeOpacity={isFilled ? 0.75 : 0.18}
            strokeWidth={isFilled ? 1.4 : 1}
          />
        );
      })}
      <circle cx="80" cy="90" r={3.5 + regularityPct / 30} fill="var(--bio-warm)" fillOpacity={0.9} />
    </svg>
  );
}

type HabitsVizProps = {
  habits: BioExecutiveHabitRow[];
  progressPct: number;
};

export function HabitsViz({ habits, progressPct }: HabitsVizProps) {
  const barCount = Math.min(6, Math.max(habits.length, 4));

  return (
    <svg viewBox="0 0 120 80" className="w-full h-full overflow-visible opacity-95" aria-hidden>
      {Array.from({ length: barCount }).map((_, i) => {
        const habit = habits[i];
        const x = 8 + i * 18;
        const done = habit?.done ?? false;
        const height = done ? 48 : 18;
        return (
          <g key={habit?.id ?? i}>
            <rect
              x={x}
              y={70 - height}
              width="12"
              height={height}
              rx="6"
              fill="currentColor"
              fillOpacity={done ? 0.72 : 0.18}
            />
            {done ? <circle cx={x + 6} cy={70 - height - 5} r="2.5" fill="var(--bio-warm)" /> : null}
          </g>
        );
      })}
      <line
        x1="4"
        y1="74"
        x2={4 + (progressPct / 100) * 112}
        y2="74"
        stroke="var(--bio-warm)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

type SleepWeekBarsProps = {
  hours: number;
  avg7d: number;
  goal: number;
};

export function SleepWeekBars({ hours, avg7d, goal }: SleepWeekBarsProps) {
  const values = Array.from({ length: 7 }, (_, i) => (i === 6 ? hours : avg7d));
  const max = Math.max(goal, hours, avg7d, 1);

  return (
    <svg viewBox="0 0 140 48" className="h-12 w-full overflow-visible" aria-hidden>
      {values.map((value, i) => {
        const h = Math.max(4, (value / max) * 40);
        const x = 6 + i * 19;
        return (
          <rect
            key={i}
            x={x}
            y={44 - h}
            width="12"
            height={h}
            rx="3"
            fill="currentColor"
            fillOpacity={i === 6 ? 0.92 : 0.32}
          />
        );
      })}
    </svg>
  );
}

type SleepVizProps = {
  hours: number;
  goal: number;
  avg7d: number;
};

const SLEEP_ARC_LEN = Math.PI * 50;

export function SleepViz({ hours, goal, avg7d }: SleepVizProps) {
  const pct = goal > 0 ? Math.min(100, (hours / goal) * 100) : 0;
  const offset = SLEEP_ARC_LEN - (pct / 100) * SLEEP_ARC_LEN;
  const avgRatio = goal > 0 ? Math.min(1, Math.max(0, avg7d / goal)) : 0;
  const angle = Math.PI * (1 - avgRatio);
  const avgCx = 70 + Math.cos(angle) * 50;
  const avgCy = 70 - Math.sin(angle) * 50;

  return (
    <svg viewBox="0 0 140 80" className="w-full h-full overflow-visible opacity-95" aria-hidden>
      <path
        d="M 20 70 A 50 50 0 0 1 120 70"
        fill="none"
        stroke="currentColor"
        strokeOpacity={0.15}
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path
        d="M 20 70 A 50 50 0 0 1 120 70"
        fill="none"
        stroke="var(--bio-warm)"
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={SLEEP_ARC_LEN}
        strokeDashoffset={offset}
        className="bio-exec-viz-sleep-arc"
      />
      <circle cx={avgCx} cy={avgCy} r="3.5" fill="currentColor" fillOpacity={0.45} />
    </svg>
  );
}

type DecisionLoadVizProps = {
  load: number;
};

export function DecisionLoadViz({ load }: DecisionLoadVizProps) {
  const selectedIdx = Math.min(8, Math.max(0, Math.round(load)));

  return (
    <svg viewBox="0 0 240 90" className="w-full h-full overflow-visible opacity-90" aria-hidden>
      <rect x="18" y="58" width="72" height="26" rx="4" fill="currentColor" fillOpacity={0.08} />
      {[35, 50, 65, 80, 95].map((radius) => (
        <path
          key={radius}
          d={`M ${120 - radius} 82 A ${radius} ${radius} 0 0 1 ${120 + radius} 82`}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.28}
          strokeWidth="1"
        />
      ))}
      {Array.from({ length: 9 }).map((_, i) => {
        const isSelected = i === selectedIdx;
        return (
          <circle
            key={i}
            cx={32 + i * 22}
            cy="82"
            r={isSelected ? 4.5 : 2}
            fill={isSelected ? "var(--bio-warm)" : "currentColor"}
            fillOpacity={isSelected ? 1 : 0.45}
          />
        );
      })}
    </svg>
  );
}
