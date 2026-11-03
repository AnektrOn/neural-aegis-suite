export type BioExecutiveTileSlotId =
  | "signal"
  | "decision"
  | "score"
  | "stress"
  | "habits"
  | "sleep"
  | "pulse"
  | "toolbox";

export type BioExecutiveTileKind = "signal" | "vital" | "action";

export type BioExecutiveTileSlotMeta = {
  id: BioExecutiveTileSlotId;
  kind: BioExecutiveTileKind;
  rowSpan?: number;
  colSpan?: number;
  /** Included in mobile horizontal carousel (signal renders above carousel when visible) */
  inCarousel: boolean;
};

/** Desktop grid body (signal banner is separate / conditional). */
export const BIO_EXECUTIVE_DESKTOP_TILE_SLOTS: BioExecutiveTileSlotMeta[] = [
  { id: "decision", kind: "action", rowSpan: 2, inCarousel: true },
  { id: "score", kind: "vital", inCarousel: true },
  { id: "stress", kind: "vital", inCarousel: true },
  { id: "habits", kind: "vital", inCarousel: true },
  { id: "sleep", kind: "vital", inCarousel: true },
  { id: "pulse", kind: "action", inCarousel: true },
  { id: "toolbox", kind: "action", inCarousel: true },
];

export const BIO_EXECUTIVE_CAROUSEL_SLOTS = BIO_EXECUTIVE_DESKTOP_TILE_SLOTS.filter((s) => s.inCarousel);
