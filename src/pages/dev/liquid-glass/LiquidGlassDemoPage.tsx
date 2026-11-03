"use client";

import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { ArrowLeft, Zap } from "lucide-react";
import { LiquidGlass, LiquidGlassButton } from "@/components/ui/apple-tahoe-liquid-glass-button";

const BACKGROUND_IMAGES = [
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1920&q=80",
];

export default function LiquidGlassDemoPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonWrapperRef = useRef<HTMLDivElement>(null);
  const [bgIndex, setBgIndex] = useState(0);

  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);
  const smoothX = useSpring(cursorX, { damping: 25, stiffness: 150, mass: 0.5 });
  const smoothY = useSpring(cursorY, { damping: 25, stiffness: 150, mass: 0.5 });

  useEffect(() => {
    const container = containerRef.current;
    const button = buttonWrapperRef.current;
    if (!container || !button) return;

    const c = container.getBoundingClientRect();
    const b = button.getBoundingClientRect();
    cursorX.set(c.width / 2 - b.width / 2);
    cursorY.set(c.height / 2 - b.height / 2);

    const handleMouseMove = (e: MouseEvent) => {
      const cr = container.getBoundingClientRect();
      const br = button.getBoundingClientRect();
      cursorX.set(e.clientX - cr.left - br.width / 2);
      cursorY.set(e.clientY - cr.top - br.height / 2);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [cursorX, cursorY]);

  return (
    <div
      ref={containerRef}
      onClick={() => setBgIndex((i) => (i + 1) % BACKGROUND_IMAGES.length)}
      className="relative flex h-screen w-screen cursor-pointer select-none overflow-hidden bg-black"
    >
      <div
        className="absolute inset-0 bg-cover bg-center transition-[background-image] duration-500"
        style={{ backgroundImage: `url(${BACKGROUND_IMAGES[bgIndex]})` }}
      />

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <h1 className="text-4xl font-black tracking-tight text-white drop-shadow-sm md:text-7xl">LIQUID GLASS</h1>
      </div>

      <LiquidGlassButton
        asChild
        size="sm"
        material="clear"
        appearance="dark"
        refraction={8}
        bezel={8}
        interactive
        className="absolute left-4 top-4 z-20"
        onClick={(e) => e.stopPropagation()}
      >
        <Link to="/dev">
          <ArrowLeft className="h-4 w-4" strokeWidth={2} aria-hidden />
          Lab
        </Link>
      </LiquidGlassButton>

      <LiquidGlass
        material="clear"
        appearance="dark"
        refraction={32}
        bezel={32}
        blur={2}
        saturation={1.4}
        brightness={1.05}
        dispersion={0}
        fallbackBlur={10}
        mode="auto"
        interactive={false}
        motion="full"
        fluid={false}
        className="absolute bottom-8 left-8 max-w-xs p-6 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-lg font-bold">Any surface</div>
        <p className="mt-1 text-sm">
          Cards, toolbars and panels refract the content behind them. No wrapper needed.
        </p>
      </LiquidGlass>

      <motion.div
        ref={buttonWrapperRef}
        className="pointer-events-auto absolute left-0 top-0 z-10"
        style={{ x: smoothX, y: smoothY }}
        onClick={(e) => e.stopPropagation()}
      >
        <LiquidGlassButton interactive appearance="light">
          <span>Generate</span>
          <Zap className="h-5 w-5 fill-black/10" />
        </LiquidGlassButton>
      </motion.div>
    </div>
  );
}
