import type { ArchetypePole } from "./types";

export interface PoleTheme {
  labelFr: string;
  labelEn: string;
  icon: "scale" | "sun" | "moon";
  accentVar: string;
  accentMutedVar: string;
  borderClass: string;
  badgeClass: string;
  navActiveClass: string;
}

export const POLE_THEMES: Record<ArchetypePole, PoleTheme> = {
  balance: {
    labelFr: "Balance",
    labelEn: "Balance",
    icon: "scale",
    accentVar: "--aegis-warm",
    accentMutedVar: "--aegis-warm-muted",
    borderClass: "border-[hsl(var(--aegis-warm)/0.35)]",
    badgeClass:
      "border-[hsl(var(--aegis-warm)/0.4)] bg-[hsl(var(--aegis-warm-muted)/0.35)] text-[hsl(var(--aegis-warm))]",
    navActiveClass:
      "border-[hsl(var(--aegis-warm)/0.5)] bg-[hsl(var(--aegis-warm-muted)/0.5)] text-[hsl(var(--aegis-warm))]",
  },
  light: {
    labelFr: "Lumière",
    labelEn: "Light",
    icon: "sun",
    accentVar: "--primary",
    accentMutedVar: "--primary-muted",
    borderClass: "border-primary/35",
    badgeClass: "border-primary/40 bg-primary-muted/50 text-primary",
    navActiveClass: "border-primary/50 bg-primary-muted/50 text-primary",
  },
  shadow: {
    labelFr: "Ombre",
    labelEn: "Shadow",
    icon: "moon",
    accentVar: "--neural-accent",
    accentMutedVar: "--sidebar-accent",
    borderClass: "border-[hsl(var(--neural-accent)/0.35)]",
    badgeClass:
      "border-[hsl(var(--neural-accent)/0.4)] bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--neural-accent))]",
    navActiveClass:
      "border-[hsl(var(--neural-accent)/0.5)] bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--neural-accent))]",
  },
};
