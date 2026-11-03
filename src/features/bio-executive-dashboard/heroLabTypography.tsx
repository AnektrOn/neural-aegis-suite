import type { CSSProperties } from "react";
import type { HeroElementLayout, HeroElementTypography } from "./bioExecutiveHeroLabConfig";
import { heroElementBoxStyle, heroTypographyToStyle } from "./bioExecutiveHeroLabConfig";

/** Position only — typography goes on inner text nodes (Tailwind utilities override parent font-size). */
export function heroElementPositionProps(layout: HeroElementLayout) {
  return { style: heroElementBoxStyle(layout) };
}

export function heroTypographyProps(typography: HeroElementTypography) {
  return { style: heroTypographyToStyle(typography) };
}

export function heroTextBlockProps(layout: HeroElementLayout): { style: CSSProperties } {
  return { style: { ...heroElementBoxStyle(layout), ...heroTypographyToStyle(layout.typography) } };
}
