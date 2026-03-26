import { useRef, useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";

interface RadialSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  size?: number;
  label?: string;
  color?: string;
  formatValue?: (v: number) => string;
}

export default function RadialSlider({
  value,
  onChange,
  min = 0,
  max = 10,
  step = 0.1,
  size = 140,
  label,
  color = "hsl(var(--primary))",
  formatValue,
}: RadialSliderProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState(false);

  const strokeWidth = 8;
  const radius = (size - strokeWidth * 2) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  const progress = (value - min) / (max - min);
  const dashOffset = circumference * (1 - progress);

  // Angle in radians: 0 = top (12 o'clock), clockwise
  const angleFromEvent = useCallback(
    (e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent) => {
      if (!svgRef.current) return null;
      const rect = svgRef.current.getBoundingClientRect();
      const clientX = "touches" in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      const x = clientX - rect.left - rect.width / 2;
      const y = clientY - rect.top - rect.height / 2;
      // atan2 gives angle from positive X axis; we want from top (negative Y axis)
      let angle = Math.atan2(x, -y); // radians, 0 = top, positive = clockwise
      if (angle < 0) angle += 2 * Math.PI;
      const ratio = angle / (2 * Math.PI);
      let newVal = min + ratio * (max - min);
      // Snap to step
      newVal = Math.round(newVal / step) * step;
      newVal = Math.max(min, Math.min(max, newVal));
      return parseFloat(newVal.toFixed(1));
    },
    [min, max, step]
  );

  const handlePointerDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      setDragging(true);
      const val = angleFromEvent(e);
      if (val !== null) onChange(val);
    },
    [angleFromEvent, onChange]
  );

  useEffect(() => {
    if (!dragging) return;
    const move = (e: MouseEvent | TouchEvent) => {
      const val = angleFromEvent(e);
      if (val !== null) onChange(val);
    };
    const up = () => setDragging(false);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    window.addEventListener("touchmove", move);
    window.addEventListener("touchend", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", up);
    };
  }, [dragging, angleFromEvent, onChange]);

  // Scroll wheel support
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const dir = e.deltaY < 0 ? 1 : -1;
      let newVal = value + dir * step;
      newVal = Math.round(newVal / step) * step;
      newVal = Math.max(min, Math.min(max, newVal));
      onChange(parseFloat(newVal.toFixed(1)));
    },
    [value, min, max, step, onChange]
  );

  // Thumb position
  const thumbAngle = progress * 2 * Math.PI - Math.PI / 2; // SVG coordinate system
  // Actually we want 0 at top: angle from top clockwise
  const thumbAngleRad = progress * 2 * Math.PI - Math.PI / 2;
  const thumbX = center + radius * Math.cos(thumbAngleRad);
  const thumbY = center + radius * Math.sin(thumbAngleRad);

  const displayValue = formatValue ? formatValue(value) : value.toFixed(1);

  return (
    <div className="flex flex-col items-center gap-2 select-none">
      <svg
        ref={svgRef}
        width={size}
        height={size}
        className="cursor-pointer text-foreground"
        onMouseDown={handlePointerDown}
        onTouchStart={handlePointerDown}
        onWheel={handleWheel}
        style={{ touchAction: "none" }}
      >
        {/* Background track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#2A2E45"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Progress arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${center} ${center})`}
          className="transition-all duration-100"
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
        {/* Thumb */}
        <motion.circle
          cx={thumbX}
          cy={thumbY}
          r={dragging ? 10 : 8}
          fill={color}
          stroke="#08090D"
          strokeWidth={3}
          className="drop-shadow-md"
        />
        {/* Center text */}
        <text
          x={center}
          y={center - 6}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="currentColor"
          fontSize={size * 0.18}
          fontFamily="DM Mono, monospace"
          fontWeight="400"
        >
          {displayValue}
        </text>
        {label && (
          <text
            x={center}
            y={center + size * 0.12}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="currentColor"
            fontSize={7}
            fontFamily="Inter, sans-serif"
            letterSpacing="0.12em"
            opacity={0.6}
            style={{ textTransform: "uppercase" }}
          >
            {label.toUpperCase()}
          </text>
        )}
      </svg>
    </div>
  );
}
