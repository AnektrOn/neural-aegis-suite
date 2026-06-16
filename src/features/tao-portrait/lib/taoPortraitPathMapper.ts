import type { PolePartId, WuXingPole } from "../domain/types";
import { isPolePartId } from "../domain/types";

export interface TaoPathMapping {
  pole: WuXingPole;
  partId: PolePartId;
}

export interface TaoPathMapResult {
  mapping: TaoPathMapping | null;
  reason?: string;
}

/** Strip emoji / punctuation for folder name matching. */
export function normalizePathSegment(segment: string): string {
  return segment
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();
}

const POLE_ALIASES: Array<{ pole: Exclude<WuXingPole, "transversal">; tokens: string[] }> = [
  { pole: "wood", tokens: ["BOIS", "WOOD", "MU"] },
  { pole: "water", tokens: ["EAU", "WATER", "SHUI"] },
  { pole: "fire", tokens: ["FEU", "FIRE", "HUO"] },
  { pole: "earth", tokens: ["TERRE", "EARTH", "TU"] },
  { pole: "metal", tokens: ["METAL", "JIN"] },
];

const PART_CODE_MAP: Record<string, PolePartId> = {
  DIA: "P01_DIA",
  SIG: "P02_SIG",
  TIM: "P03_TIM",
  PRX: "P04_PRX",
  SCL: "P05_SCL",
};

function poleFromFolderName(folderName: string): Exclude<WuXingPole, "transversal"> | null {
  const norm = normalizePathSegment(folderName);
  for (const { pole, tokens } of POLE_ALIASES) {
    if (tokens.some((t) => norm.includes(t))) return pole;
  }
  return null;
}

function partIdFromFileName(fileName: string): PolePartId | null {
  const base = fileName.replace(/\.md$/i, "").trim();
  const dotMatch = base.match(/^P0?([1-5])\s*[·.\-_]\s*(DIA|SIG|TIM|PRX|SCL)\b/i);
  if (dotMatch) {
    const code = dotMatch[2].toUpperCase();
    return PART_CODE_MAP[code] ?? null;
  }
  const underscore = base.toUpperCase();
  if (isPolePartId(underscore)) return underscore;
  return null;
}

function isT2SynthesisFile(fileName: string): boolean {
  const base = fileName.replace(/\.md$/i, "").trim().toUpperCase();
  if (/^T2\b/.test(base)) return true;
  if (base.includes("SYNTHESE") && base.includes("WUXING")) return true;
  if (base.includes("GLOBAL") && base.includes("WUXING")) return true;
  return false;
}

/**
 * Map a relative path from a Benebell Wen export folder to DB keys.
 *
 * Examples:
 * - `2026-05/T2_Global_SyntheseWuXing.md` → transversal / T2_SYNTHESIS
 * - `2026-05/🌲 BOIS/P01·DIA.md` → wood / P01_DIA
 */
export function mapTaoPortraitPath(relativePath: string): TaoPathMapResult {
  const cleaned = relativePath.replace(/\\/g, "/").replace(/^\.\//, "");
  const segments = cleaned.split("/").filter(Boolean);
  if (segments.length === 0) {
    return { mapping: null, reason: "Chemin vide" };
  }

  const fileName = segments[segments.length - 1];
  if (!/\.md$/i.test(fileName)) {
    return { mapping: null, reason: "Pas un fichier .md" };
  }

  const parentFolder = segments.length >= 2 ? segments[segments.length - 2] : null;
  const poleFromParent = parentFolder ? poleFromFolderName(parentFolder) : null;

  if (isT2SynthesisFile(fileName) && !poleFromParent) {
    return { mapping: { pole: "transversal", partId: "T2_SYNTHESIS" } };
  }

  if (!poleFromParent) {
    return { mapping: null, reason: "Dossier pôle non reconnu" };
  }

  const partId = partIdFromFileName(fileName);
  if (!partId) {
    return { mapping: null, reason: "Nom de partie non reconnu (attendu P01·DIA.md …)" };
  }

  return { mapping: { pole: poleFromParent, partId } };
}

export function collectMdPathsFromTreeJson(jsonText: string): string[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText.trim());
  } catch {
    return [];
  }

  const roots = Array.isArray(parsed) ? parsed : [parsed];
  const paths: string[] = [];

  const walk = (node: unknown, prefix: string) => {
    if (!node || typeof node !== "object") return;
    const n = node as { type?: string; name?: string; contents?: unknown[] };
    const name = n.name ?? "";
    const nextPrefix = prefix && name !== "." ? `${prefix}/${name}` : name === "." ? "" : name;

    if (n.type === "file" && name.endsWith(".md")) {
      const path = prefix ? `${prefix}/${name}` : name;
      paths.push(path.replace(/^\.\//, ""));
      return;
    }

    if (Array.isArray(n.contents)) {
      for (const child of n.contents) {
        walk(child, nextPrefix);
      }
    }
  };

  for (const root of roots) {
    walk(root, "");
  }

  return paths;
}
