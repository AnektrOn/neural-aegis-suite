import type { LucideIcon } from "lucide-react";
import type { TranslationKey } from "@/i18n/translations";

/** Extensible portrait system id — add new lenses in buildPortraitLenses. */
export type PortraitLensId = string;

export type PortraitLensStatus = "ready" | "partial" | "empty" | "loading";

export interface PortraitLensAction {
  labelKey: TranslationKey;
  href: string;
  variant?: "primary" | "outline";
}

export interface PortraitLensCard {
  id: PortraitLensId;
  frameworkKey: TranslationKey;
  systemKey: TranslationKey;
  status: PortraitLensStatus;
  title: string | null;
  excerpt: string | null;
  eyebrow: string | null;
  accentColor: string;
  icon: LucideIcon;
  mark?: string;
  progressFilled?: number;
  progressTotal?: number;
  actions: PortraitLensAction[];
  /** Drives optional detail slots (triad, pole grid, etc.). */
  detailKind: "myss" | "tao" | "generic";
}
