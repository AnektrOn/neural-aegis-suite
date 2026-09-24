/**
 * BQC face map — Moricoli & Bergagnini (2016), diagram SVG viewBox 400×450.
 * UV: u = (x - 95) / 210, v = 1 - (y - 55) / 365
 *
 * Latéralité : x petit = côté droit du sujet ; unilatéraux 37/39 (gauche sujet), 41/50 (droit sujet).
 */

export type PointCoord = { x: number; y: number };

export const pointsCoordinates: Record<number, PointCoord[]> = {
  // Oreille / tragus — p. 31, 117
  0: [{ x: 105, y: 230 }, { x: 295, y: 230 }],

  // Axe nasal / colonne — p. 31, 135–148
  1: [{ x: 200, y: 275 }],
  43: [{ x: 200, y: 250 }],
  143: [{ x: 200, y: 270 }],

  // Poumons & voies respiratoires — p. 31, 119–145
  3: [{ x: 175, y: 230 }, { x: 225, y: 230 }],
  60: [{ x: 145, y: 220 }, { x: 255, y: 220 }],
  61: [{ x: 180, y: 260 }, { x: 220, y: 260 }],
  73: [{ x: 165, y: 205 }, { x: 235, y: 205 }],

  // Mal de gorge — p. 31, 137–139
  12: [{ x: 110, y: 220 }, { x: 290, y: 220 }],
  14: [{ x: 108, y: 250 }, { x: 292, y: 250 }],
  20: [{ x: 110, y: 205 }, { x: 290, y: 205 }],

  // Membres / sciatique — p. 31, 136–145
  5: [{ x: 140, y: 320 }, { x: 260, y: 320 }],
  17: [{ x: 175, y: 310 }, { x: 225, y: 310 }],
  38: [{ x: 155, y: 310 }, { x: 245, y: 310 }],
  74: [{ x: 150, y: 330 }, { x: 250, y: 330 }],

  // Urgence & philtrum — p. 31, 138–146
  19: [{ x: 200, y: 285 }],
  63: [{ x: 200, y: 295 }],
  113: [{ x: 180, y: 300 }, { x: 220, y: 300 }],

  // Front & tête — p. 31, 56–147
  26: [{ x: 200, y: 165 }],
  34: [{ x: 175, y: 165 }, { x: 225, y: 165 }],
  103: [{ x: 200, y: 110 }],
  106: [{ x: 200, y: 135 }],
  124: [{ x: 160, y: 110 }, { x: 240, y: 110 }],
  126: [{ x: 200, y: 75 }],
  300: [{ x: 150, y: 85 }, { x: 250, y: 85 }],

  // Arcade sourcilière — planche p. 34–35
  216: [{ x: 170, y: 162 }, { x: 230, y: 162 }],
  324: [{ x: 162, y: 162 }, { x: 238, y: 162 }],
  477: [{ x: 180, y: 162 }, { x: 220, y: 162 }],

  // Organes unilatéraux — p. 31, 140–142
  37: [{ x: 245, y: 260 }],
  39: [{ x: 235, y: 285 }],
  41: [{ x: 145, y: 270 }],
  50: [{ x: 155, y: 260 }],

  // Menton & anus — p. 31, 147–150
  127: [{ x: 200, y: 340 }],
  156: [{ x: 170, y: 350 }, { x: 230, y: 350 }],
  365: [{ x: 200, y: 370 }],

  // Cartographie sourcilière étendue (livrable A — hors protocoles actuels)
  65: [{ x: 165, y: 160 }, { x: 235, y: 160 }],
  97: [{ x: 158, y: 163 }, { x: 242, y: 163 }],
  98: [{ x: 150, y: 162 }, { x: 250, y: 162 }],
  99: [{ x: 142, y: 163 }, { x: 258, y: 163 }],
  100: [{ x: 135, y: 165 }, { x: 265, y: 165 }],
  107: [{ x: 175, y: 150 }, { x: 225, y: 150 }],
  108: [{ x: 200, y: 150 }],
  319: [{ x: 138, y: 170 }, { x: 262, y: 170 }],
};

/** Point ids used by protocols in `DienChanMap`. */
export const DIEN_CHAN_PROTOCOL_POINT_IDS: number[] = [
  0, 1, 3, 5, 12, 14, 17, 19, 20, 26, 34, 37, 38, 39, 41, 43, 50, 60, 61, 73, 74, 103, 106,
  113, 124, 126, 127, 143, 365,
];

export function missingProtocolCoordinates(): number[] {
  const missing: number[] = [];
  for (const id of DIEN_CHAN_PROTOCOL_POINT_IDS) {
    const coords = pointsCoordinates[id];
    if (!coords?.length) missing.push(id);
  }
  return missing;
}
