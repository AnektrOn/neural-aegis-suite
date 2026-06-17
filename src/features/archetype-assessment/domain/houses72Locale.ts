import type { Locale } from "@/i18n/LanguageContext";
import type { Houses72OptionSeed, Houses72QuestionSeed } from "./questionsHouses72";
import { HOUSES_72_META } from "./questionsHouses72";
import { HOUSES72_EN_OVERLAY } from "./questionsHouses72EnOverlay";

function overlayKey(house: number, position: number): string {
  return `${house}-${position}`;
}

export function getHouse72Prompt(q: Houses72QuestionSeed, locale: Locale): string {
  if (locale === "en") {
    if (q.prompt_en) return q.prompt_en;
    const overlay = HOUSES72_EN_OVERLAY[overlayKey(q.house, q.position)];
    if (overlay?.prompt_en) return overlay.prompt_en;
  }
  return q.prompt_fr;
}

export function getHouse72OptionLabel(o: Houses72OptionSeed, locale: Locale, house: number, qPosition: number): string {
  if (locale === "en") {
    if (o.label_en) return o.label_en;
    const overlay = HOUSES72_EN_OVERLAY[overlayKey(house, qPosition)];
    const en = overlay?.options?.[o.position - 1];
    if (en) return en;
  }
  return o.label_fr;
}

export function getHouse72Title(house: number, locale: Locale): string {
  const meta = HOUSES_72_META[house];
  if (!meta) return String(house);
  return locale === "en" ? meta.title_en : meta.title_fr;
}

export function getHouse72Theme(house: number, locale: Locale): string {
  const meta = HOUSES_72_META[house];
  if (!meta) return "";
  return locale === "en" ? meta.theme_en : meta.theme_fr;
}
