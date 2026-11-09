import { Flame, Scroll, Sparkles, TreePine, Moon } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { TranslationKey } from "@/i18n/translations";
import type { PortraitLensCard } from "./portraitLensTypes";

export type PortraitLensRegistryId = "myss" | "tao" | "jung" | "blavatsky" | "manly_hall";

export interface PortraitLensRegistryEntry {
  id: PortraitLensRegistryId;
  frameworkKey: TranslationKey;
  systemKey: TranslationKey;
  ctaStartKey: TranslationKey;
  ctaOpenKey: TranslationKey;
  routeReady: string;
  routeStart: string;
  /** Prefix for `deepdive_responses.question_code` (future questionnaires). */
  questionCodePrefix?: string;
  totalQuestions: number;
  comingSoon?: boolean;
  accentColor: string;
  icon: LucideIcon;
  detailKind: PortraitLensCard["detailKind"];
  emptyDetailKey: TranslationKey;
  /** Cover Flow shelf art — path under `public/` or absolute URL. */
  coverArtUrl?: string;
}

export const PORTRAIT_LENS_REGISTRY: PortraitLensRegistryEntry[] = [
  {
    id: "myss",
    frameworkKey: "persona.lens.myss.framework",
    systemKey: "persona.lens.myss.system",
    ctaStartKey: "persona.lens.myss.ctaStart",
    ctaOpenKey: "persona.lens.myss.cta",
    routeReady: "/deep-dive?lens=myss",
    routeStart: "/deep-dive",
    totalQuestions: 70,
    accentColor: "#c9a24b",
    icon: Sparkles,
    detailKind: "myss",
    emptyDetailKey: "persona.portraits.lensEmpty",
    coverArtUrl: "/persona/portraits/myss-cover.png",
  },
  {
    id: "tao",
    frameworkKey: "persona.lens.tao.framework",
    systemKey: "persona.lens.tao.system",
    ctaStartKey: "persona.lens.tao.ctaStart",
    ctaOpenKey: "persona.glimpse.ctaTaoDeepDive",
    routeReady: "/deep-dive?lens=tao",
    routeStart: "/deep-dive?lens=tao",
    totalQuestions: 0,
    accentColor: "#4a7c59",
    icon: TreePine,
    detailKind: "tao",
    emptyDetailKey: "persona.glimpse.taoEmpty",
    coverArtUrl: "/persona/portraits/tao-cover.png",
  },
  {
    id: "jung",
    frameworkKey: "persona.lens.jung.framework",
    systemKey: "persona.lens.jung.system",
    ctaStartKey: "persona.lens.jung.ctaStart",
    ctaOpenKey: "persona.lens.jung.ctaOpen",
    routeReady: "/deep-dive?lens=jung",
    routeStart: "/deep-dive?lens=jung",
    questionCodePrefix: "JUNG_",
    totalQuestions: 0,
    accentColor: "#5b7c9a",
    icon: Moon,
    detailKind: "generic",
    emptyDetailKey: "persona.lens.jung.empty",
    coverArtUrl: "/persona/portraits/jung-cover.png",
  },
  {
    id: "blavatsky",
    frameworkKey: "persona.lens.blavatsky.framework",
    systemKey: "persona.lens.blavatsky.system",
    ctaStartKey: "persona.lens.blavatsky.ctaStart",
    ctaOpenKey: "persona.lens.blavatsky.ctaOpen",
    routeReady: "/deep-dive?lens=blavatsky",
    routeStart: "/deep-dive?lens=blavatsky",
    questionCodePrefix: "BLAV_",
    totalQuestions: 0,
    accentColor: "#8b6b9e",
    icon: Flame,
    detailKind: "generic",
    emptyDetailKey: "persona.lens.blavatsky.empty",
    coverArtUrl: "/persona/portraits/blavatsky-cover.png",
  },
  {
    id: "manly_hall",
    frameworkKey: "persona.lens.manly_hall.framework",
    systemKey: "persona.lens.manly_hall.system",
    ctaStartKey: "persona.lens.manly_hall.ctaStart",
    ctaOpenKey: "persona.lens.manly_hall.ctaOpen",
    routeReady: "/deep-dive?lens=manly_hall",
    routeStart: "/deep-dive?lens=manly_hall",
    questionCodePrefix: "HALL_",
    totalQuestions: 0,
    comingSoon: true,
    accentColor: "#7a6348",
    icon: Scroll,
    detailKind: "generic",
    emptyDetailKey: "persona.lens.manly_hall.empty",
    coverArtUrl: "/persona/portraits/manly-hall-cover.png",
  },
];

/** Shelf order on `/persona/portraits` Cover Flow. */
export const PORTRAIT_LENS_SHELF_ORDER: PortraitLensRegistryId[] = [
  "myss",
  "manly_hall",
  "tao",
  "jung",
  "blavatsky",
];

export function registryEntry(id: PortraitLensRegistryId): PortraitLensRegistryEntry {
  const entry = PORTRAIT_LENS_REGISTRY.find((e) => e.id === id);
  if (!entry) throw new Error(`Unknown portrait lens: ${id}`);
  return entry;
}
