/**
 * Chronologie du mot sur la landing — calée sur les blocs texte de `WelcomeView`.
 *
 * Ch.1 `#welcome-hero`     → AEGIS à droite
 * Ch.2 `#demo-vocale`       → morph LOGOS à gauche
 * Ch.2→3 limite sections    → désintégration
 * Ch.3 `#rupture-vocale`    → suite masquée jusqu’à la réintégration
 * Réint. fin Ch.3 → `#faq`  → AEGIS au centre (avant-dernière section)
 */

import {
  getWelcomeNebulaWordScale,
  getWelcomeNebulaWorldLayout,
  isWelcomeNebulaMobileViewport,
  readWelcomeNebulaViewport,
  type WelcomeNebulaWorldAnchor,
} from "./welcomeNebulaWordLayout";

export interface WelcomeNebulaWordState {
  text: string;
  offsetX: number;
  offsetY: number;
  reveal: number;
  scale: number;
}

function pinToCenter(
  state: Omit<WelcomeNebulaWordState, "scale"> & { scale?: number },
  center: WelcomeNebulaWorldAnchor,
  scale: number,
): WelcomeNebulaWordState {
  return {
    text: state.text,
    reveal: state.reveal,
    offsetX: center.offsetX,
    offsetY: center.offsetY,
    scale,
  };
}

export const WELCOME_NEBULA_SECTION_IDS = {
  hero: "welcome-hero",
  demo: "demo-vocale",
  rupture: "rupture-vocale",
  faq: "faq",
} as const;

/** Sticky header landing (~4.5rem) + ligne de lecture */
const STICKY_HEADER_PX = 72;

export interface WelcomeNebulaSectionSpan {
  top: number;
  bottom: number;
  height: number;
}

export function measureWelcomeSection(el: HTMLElement): WelcomeNebulaSectionSpan {
  const rect = el.getBoundingClientRect();
  const top =
    rect.top +
    (typeof window !== "undefined" ? window.scrollY : 0) -
    (typeof document !== "undefined"
      ? document.documentElement.clientTop
      : 0);
  const height = rect.height;
  return { top, bottom: top + height, height };
}

/** Point vertical dans la page qui « lit » le contenu (sous le header). */
export function welcomeNebulaFocusY(scrollY: number, vh: number): number {
  return scrollY + STICKY_HEADER_PX + vh * 0.34;
}

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}

function smoothstep(t: number): number {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

type SectionEl = HTMLElement | null;

export function computeWelcomeNebulaWordState(
  sections: {
    hero: SectionEl;
    demo: SectionEl;
    rupture: SectionEl;
    faq: SectionEl;
  },
  scrollY: number = typeof window !== "undefined" ? window.scrollY : 0,
  vh: number = typeof window !== "undefined" ? window.innerHeight : 800,
): WelcomeNebulaWordState {
  const viewport = readWelcomeNebulaViewport();
  const mobile = isWelcomeNebulaMobileViewport(viewport);
  const wordScale = getWelcomeNebulaWordScale(viewport);
  const { right, left, center } = getWelcomeNebulaWorldLayout(viewport);
  const finalize = (
    state: Omit<WelcomeNebulaWordState, "scale">,
  ): WelcomeNebulaWordState =>
    mobile
      ? pinToCenter(state, center, wordScale)
      : { ...state, scale: wordScale };

  const fallback: WelcomeNebulaWordState = finalize({
    text: "AEGIS",
    ...right,
    reveal: 1,
  });

  const { hero, demo, rupture, faq } = sections;
  if (!hero || !demo || !rupture || !faq) return fallback;

  const h = measureWelcomeSection(hero);
  const d = measureWelcomeSection(demo);
  const r = measureWelcomeSection(rupture);
  const f = measureWelcomeSection(faq);

  const focus = welcomeNebulaFocusY(scrollY, vh);

  const hiddenLogos: WelcomeNebulaWordState = pinToCenter(
    { text: "LOGOS", ...left, reveal: 0 },
    center,
    wordScale,
  );

  // —— Ch.1 : tant que la ligne de lecture est dans le hero (titre + lead). ——
  if (focus < h.bottom) {
    return finalize({ text: "AEGIS", ...right, reveal: 1 });
  }

  // —— Ch.2 : bloc démo vocale (#demo-vocale) — morph puis LOGOS stabilisé. ——
  const morphZoneEnd = d.top + d.height * 0.42;
  if (focus < d.bottom) {
    if (focus <= morphZoneEnd) {
      const morphT = smoothstep((focus - d.top) / Math.max(1, morphZoneEnd - d.top));
      if (mobile) {
        return finalize({
          text: morphT >= 0.52 ? "LOGOS" : "AEGIS",
          offsetX: center.offsetX,
          offsetY: center.offsetY,
          reveal: 1,
        });
      }
      return finalize({
        text: morphT >= 0.52 ? "LOGOS" : "AEGIS",
        offsetX: lerp(right.offsetX, left.offsetX, morphT),
        offsetY: lerp(right.offsetY, left.offsetY, morphT),
        reveal: 1,
      });
    }
    return finalize({ text: "LOGOS", ...left, reveal: 1 });
  }

  // —— Désintégration : passage contenu démo → rupture (jonction physique des sections). ——
  const disStart = d.bottom - Math.min(vh * 0.12, d.height * 0.15);
  const disEnd =
    r.top +
    Math.min(r.height * 0.22, vh * 0.28);

  if (focus < disEnd) {
    if (focus >= disStart) {
      const disT = smoothstep((focus - disStart) / Math.max(1, disEnd - disStart));
      return finalize({
        text: "LOGOS",
        offsetX: left.offsetX,
        offsetY: left.offsetY,
        reveal: 1 - disT,
      });
    }
    return finalize({ text: "LOGOS", ...left, reveal: 1 });
  }

  // —— Réintégration : fin du ch.3 → entrée dans #faq (avant-dernière section). ——
  const reintStart = r.bottom - Math.min(vh * 0.45, r.height * 0.35);
  const reintEnd = f.top + Math.min(f.height * 0.38, vh * 0.42);

  if (focus >= reintStart && focus < reintEnd) {
    const reintT = smoothstep((focus - reintStart) / Math.max(1, reintEnd - reintStart));
    if (mobile) {
      return finalize({
        text: "AEGIS",
        offsetX: center.offsetX,
        offsetY: center.offsetY,
        reveal: reintT,
      });
    }
    return finalize({
      text: "AEGIS",
      offsetX: lerp(left.offsetX, center.offsetX, reintT),
      offsetY: lerp(left.offsetY, center.offsetY, reintT),
      reveal: reintT,
    });
  }

  if (focus >= reintEnd) {
    return finalize({ text: "AEGIS", ...center, reveal: 1 });
  }

  // Milieu de page : ch.3 (rupture) après dissolve + sections intermédiaires.
  return hiddenLogos;
}

export function queryWelcomeNebulaSections(): {
  hero: SectionEl;
  demo: SectionEl;
  rupture: SectionEl;
  faq: SectionEl;
} {
  if (typeof document === "undefined") {
    return { hero: null, demo: null, rupture: null, faq: null };
  }
  const ids = WELCOME_NEBULA_SECTION_IDS;
  return {
    hero: document.getElementById(ids.hero),
    demo: document.getElementById(ids.demo),
    rupture: document.getElementById(ids.rupture),
    faq: document.getElementById(ids.faq),
  };
}