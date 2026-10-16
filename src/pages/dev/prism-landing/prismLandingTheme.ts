import * as THREE from "three";

function themeRoot(): HTMLElement {
  return document.documentElement;
}

/** Reads an HSL triplet token (`200 35% 7%`) from the app theme on `<html>`. */
export function hslToken(name: string, fallback: string): THREE.Color {
  if (typeof document === "undefined") {
    return new THREE.Color(`hsl(${fallback})`);
  }
  const raw = getComputedStyle(themeRoot()).getPropertyValue(name).trim();
  const parts = (raw || fallback).split(/\s+/);
  if (parts.length < 3) {
    return new THREE.Color(`hsl(${fallback})`);
  }
  return new THREE.Color(`hsl(${parts[0]}, ${parts[1]}, ${parts[2]})`);
}

export function cssHsl(name: string, fallback: string): string {
  const color = hslToken(name, fallback);
  return `#${color.getHexString()}`;
}

export function readPrismStagePalette() {
  return {
    background: cssHsl("--aegis-hero-bg", "222 26% 5%"),
    glow: cssHsl("--primary", "24 48% 65%"),
    primary: cssHsl("--primary", "24 48% 65%"),
    foreground: cssHsl("--foreground", "24 48% 95%"),
    card: cssHsl("--card", "201 28% 12%"),
    muted: cssHsl("--muted-foreground", "24 10% 75%"),
  };
}
