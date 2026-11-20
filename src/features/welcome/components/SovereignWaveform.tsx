import React, { useEffect, useRef } from "react";

export interface SovereignWaveformProps {
  width?: number;
  height?: number;
  barCount?: number;
  isActive?: boolean;
}

export const SovereignWaveform: React.FC<SovereignWaveformProps> = ({
  width = 320,
  height = 40,
  barCount = 36,
  isActive = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cs = getComputedStyle(document.documentElement);
    const primaryTriplet = cs.getPropertyValue("--primary").trim() || "24 48% 65%";
    const fgTriplet = cs.getPropertyValue("--foreground").trim() || "24 48% 95%";

    let elapsedTime = 0;
    lastTimeRef.current = performance.now();

    const render = (currentTime: number) => {
      const deltaTime = Math.min(currentTime - lastTimeRef.current, 100);
      lastTimeRef.current = currentTime;

      if (isActive) {
        elapsedTime += deltaTime * 0.0025;
      }

      ctx.clearRect(0, 0, width, height);

      const totalBarWidth = width / barCount;
      const barWidth = Math.max(2, totalBarWidth - 3);
      const centerY = height / 2;

      for (let i = 0; i < barCount; i++) {
        let barHeight = 4;
        if (isActive) {
          const wave1 = Math.sin(i * 0.35 + elapsedTime * 2.0);
          const wave2 = Math.cos(i * 0.75 - elapsedTime * 1.5);
          barHeight = Math.max(4, Math.abs(wave1 * wave2) * (height * 0.85));
        }

        const x = i * totalBarWidth;
        const y = centerY - barHeight / 2;

        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        gradient.addColorStop(0, `hsl(${fgTriplet} / 0.92)`);
        gradient.addColorStop(0.55, `hsl(${primaryTriplet} / 0.80)`);
        gradient.addColorStop(1, `hsl(${primaryTriplet} / 0.18)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        if (typeof ctx.roundRect === "function") {
          ctx.roundRect(x, y, barWidth, barHeight, 2);
        } else {
          ctx.rect(x, y, barWidth, barHeight);
        }
        ctx.fill();
      }

      animationFrameId.current = requestAnimationFrame(render);
    };

    animationFrameId.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameId.current !== null) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [width, height, barCount, isActive]);

  return (
    <div
      className="inline-flex max-w-full items-center justify-center overflow-hidden rounded-xl border border-border/30 bg-background/40 p-2.5 backdrop-blur-md"
      style={{
        minHeight: `${height + 20}px`,
        boxShadow: "inset 0 1px 0 0 hsl(var(--foreground) / 0.06)",
      }}
    >
      <canvas
        ref={canvasRef}
        className="block max-w-full"
        role="img"
        aria-label="Spectre de modulation vocale souveraine en temps réel"
      />
    </div>
  );
};
