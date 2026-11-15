import type { HeroMobileDeviceGabaritKey } from "./bioExecutiveMobileDeviceGabarits";
import { MOBILE_DEVICE_GABARITS } from "./bioExecutiveMobileDeviceGabarits";

export type MobileGabaritOrientation = "portrait" | "landscape";

export type MobileGabaritChecklistId = `${HeroMobileDeviceGabaritKey}:${MobileGabaritOrientation}`;

export const HERO_LAB_GABARIT_CHECKLIST_KEY = "aegis_bio_hero_gabarit_checklist_v1";

export const MOBILE_GABARIT_CHECKLIST_TOTAL = MOBILE_DEVICE_GABARITS.length * 2;

export function mobileGabaritChecklistId(
  device: HeroMobileDeviceGabaritKey,
  orientation: MobileGabaritOrientation,
): MobileGabaritChecklistId {
  return `${device}:${orientation}`;
}

export const MOBILE_GABARIT_QA_HINTS: Record<MobileGabaritOrientation, string[]> = {
  portrait: [
    "Pas de débordement horizontal (320 prioritaire)",
    "Session + titre lisibles, silhouette hors footer",
    "Onglets footer · Quick-Log · dock ≥ 44px",
    "Carousel snap + bento sous le fold",
  ],
  landscape: [
    "Split hero | tuiles sans scroll vertical parasite",
    "Titres / métriques non coupés",
    "Grille tuiles paysage lisible",
    "Silhouette + footer ne se chevauchent pas",
  ],
};

export type MobileGabaritChecklistState = Partial<Record<MobileGabaritChecklistId, boolean>>;

export function loadMobileGabaritChecklist(): MobileGabaritChecklistState {
  try {
    const raw = localStorage.getItem(HERO_LAB_GABARIT_CHECKLIST_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as MobileGabaritChecklistState;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function saveMobileGabaritChecklist(state: MobileGabaritChecklistState) {
  try {
    localStorage.setItem(HERO_LAB_GABARIT_CHECKLIST_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export function countMobileGabaritChecklistDone(state: MobileGabaritChecklistState): number {
  let n = 0;
  for (const device of MOBILE_DEVICE_GABARITS) {
    for (const orientation of ["portrait", "landscape"] as const) {
      const id = mobileGabaritChecklistId(device.key, orientation);
      if (state[id]) n += 1;
    }
  }
  return n;
}